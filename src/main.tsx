import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerServiceWorker } from './lib/pwaService';

// Graceful interception of Firestore daily quota exhausted rejections & internal SDK assertion errors
if (typeof window !== 'undefined') {
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    const combined = args.map((a) => (typeof a === 'object' ? (a?.message || JSON.stringify(a)) : String(a || ''))).join(' ').toLowerCase();
    if (
      combined.includes('resource-exhausted') ||
      combined.includes('quota limit exceeded') ||
      combined.includes('using maximum backoff delay') ||
      (combined.includes('@firebase/firestore') && combined.includes('quota')) ||
      combined.includes('internal assertion failed') ||
      combined.includes('unexpected state (id: ca9)') ||
      combined.includes('unexpected state (id: b815)')
    ) {
      // Silence internal Firestore SDK retry loop and assertion errors
      return;
    }
    originalConsoleError.apply(console, args);
  };

  window.addEventListener(
    'error',
    (event) => {
      const msg = (event.message || event.error?.message || '').toLowerCase();
      if (
        msg.includes('internal assertion failed') ||
        msg.includes('unexpected state') ||
        msg.includes('ca9') ||
        msg.includes('b815') ||
        msg.includes('pendingresponses') ||
        (msg.includes('firestore') && msg.includes('assertion'))
      ) {
        // Intercept internal Firestore SDK assertion failures so they don't break the UI
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      const msg = (reason?.message || String(reason || '')).toLowerCase();
      const code = (reason?.code || '').toLowerCase();
      if (
        code === 'resource-exhausted' ||
        msg.includes('quota') ||
        msg.includes('resource-exhausted') ||
        msg.includes('limit exceeded') ||
        msg.includes('internal assertion failed') ||
        msg.includes('unexpected state') ||
        msg.includes('ca9') ||
        msg.includes('b815')
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
}

// Initialize PWA Service Worker for offline support and background web notifications
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
