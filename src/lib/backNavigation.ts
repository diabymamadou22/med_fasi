/**
 * Mobile Hardware & Browser Back Button Navigation Manager
 * Handles Android back gesture/button and browser back button.
 * Intercepts 'popstate' to close active modals, overlays, full-screen viewers, or tabs
 * instead of exiting the web application or PWA.
 */

import { useEffect, useRef } from 'react';

interface BackHandlerItem {
  id: string;
  onClose: () => void;
  pushedHistory: boolean;
}

class BackNavigationManager {
  private stack: BackHandlerItem[] = [];
  private isProgrammaticBack: boolean = false;
  private isInitialized: boolean = false;
  private lastBackPressTime: number = 0;
  private exitPromptCallback: (() => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Ensure we have an initial root state so the first back press doesn't exit immediately
    try {
      if (!window.history.state || !window.history.state.loveAppRoot) {
        window.history.replaceState({ loveAppRoot: true, time: Date.now() }, '');
      }
    } catch {
      // Ignore security or iframe sandbox restrictions
    }

    window.addEventListener('popstate', this.handlePopState);
  }

  private handlePopState = (event: PopStateEvent) => {
    // If this popstate was triggered by our own window.history.back() cleanup, ignore it
    if (this.isProgrammaticBack) {
      this.isProgrammaticBack = false;
      return;
    }

    // If we have an active modal/overlay in the stack, close the top-most one!
    if (this.stack.length > 0) {
      const topItem = this.stack.pop();
      if (topItem) {
        try {
          topItem.onClose();
        } catch (err) {
          console.error('[BackNavigation] Error executing onClose for', topItem.id, err);
        }
      }
      return;
    }

    // If no modals or overlays are open and we are at the app root:
    // Push state back so accidental back press doesn't close the PWA immediately without warning
    const now = Date.now();
    if (now - this.lastBackPressTime < 2000) {
      // User tapped back twice in 2 seconds -> Allow default exit
      return;
    }

    this.lastBackPressTime = now;

    // Re-push root state to catch future back presses
    try {
      window.history.pushState({ loveAppRoot: true, time: Date.now() }, '');
    } catch {}

    if (this.exitPromptCallback) {
      this.exitPromptCallback();
    }
  };

  /**
   * Register a back button handler for an open modal, overlay, or viewer.
   * Returns an unregister cleanup function.
   */
  public push(id: string, onClose: () => void, pushHistory: boolean = true): () => void {
    if (typeof window === 'undefined') {
      return () => {};
    }

    // Remove any previous registration with the same id
    this.remove(id, false);

    let pushed = false;
    if (pushHistory) {
      try {
        window.history.pushState({ loveAppOverlay: id, time: Date.now() }, '');
        pushed = true;
      } catch (err) {
        console.warn('[BackNavigation] Failed to push history state', err);
      }
    }

    const item: BackHandlerItem = {
      id,
      onClose,
      pushedHistory: pushed,
    };

    this.stack.push(item);

    return () => {
      this.remove(id, true);
    };
  }

  /**
   * Remove a back handler from the stack.
   * If programmatic is true and the item had pushed a history state and was on top of the stack,
   * we cleanly pop the history entry without triggering handlers.
   */
  public remove(id: string, programmatic: boolean = true) {
    if (this.stack.length === 0) return;

    const index = this.stack.findIndex((item) => item.id === id);
    if (index === -1) return;

    const [item] = this.stack.splice(index, 1);

    // If it was the top item and pushed a history entry, unwind the history
    if (programmatic && item.pushedHistory && index === this.stack.length) {
      this.isProgrammaticBack = true;
      try {
        window.history.back();
      } catch {
        this.isProgrammaticBack = false;
      }
    }
  }

  public setExitPromptCallback(cb: (() => void) | null) {
    this.exitPromptCallback = cb;
  }
}

export const backNavigation = new BackNavigationManager();

/**
 * React hook to bind an overlay / modal / viewer to the phone back button.
 * When isOpen is true, pressing the phone's back button will invoke onClose().
 */
export function useBackHandler(
  isOpen: boolean,
  onClose: () => void,
  id: string,
  options?: { priority?: number; pushHistory?: boolean }
) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!isOpen) return;

    const cleanup = backNavigation.push(
      id,
      () => {
        onCloseRef.current();
      },
      options?.pushHistory ?? true
    );

    return () => {
      cleanup();
    };
  }, [isOpen, id, options?.pushHistory]);
}
