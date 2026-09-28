import { ChatMessage, MissYouPulse, TimelineMemory } from '../types';

export interface ChatPresenceInfo {
  partnerId: string;
  isTyping: boolean;
  isOnline: boolean;
  lastSeen: string;
  updatedAt: string;
}

export type ChatPresenceState = Record<string, ChatPresenceInfo>;

export interface ChatSyncRelayResult {
  messages: ChatMessage[];
  deletedIds: string[];
}

export interface ChatEventsOptions {
  partnerId: string;
  onNewMessage?: (msg: ChatMessage) => void;
  onDeleteMessages?: (messageIds: string[]) => void;
  onClearChat?: () => void;
  onMessagesRead?: (messageIds: string[], readAt?: string) => void;
  onPresence?: (presence: ChatPresenceState) => void;
  onPulse?: (pulse: MissYouPulse) => void;
  onNewMemory?: (memory: TimelineMemory) => void;
  onUpdateMemory?: (memory: TimelineMemory) => void;
  onDeleteMemory?: (memoryId: string) => void;
}

// ============================================================================
// SINGLETON MULTI-CHANNEL REAL-TIME MANAGER (WebSocket + SSE Fallback)
// ============================================================================

class RealtimeHub {
  private subscribers = new Set<ChatEventsOptions>();
  private activePartnerId = 'p1';
  private ws: WebSocket | null = null;
  private sse: EventSource | null = null;
  private isConnecting = false;
  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private isDestroyed = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.reconnect('online_event'));
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.reconnect('visibility_visible');
        }
      });
    }
  }

  public subscribe(options: ChatEventsOptions): () => void {
    this.subscribers.add(options);
    this.activePartnerId = options.partnerId || this.activePartnerId;

    // Connecter immédiatement si pas encore connecté
    if (!this.ws && !this.sse && !this.isConnecting) {
      this.connect();
    }

    return () => {
      this.subscribers.delete(options);
      if (this.subscribers.size === 0) {
        // Laisser la connexion active un peu avant de fermer
        setTimeout(() => {
          if (this.subscribers.size === 0) {
            this.disconnect();
          }
        }, 15000);
      }
    };
  }

  public getWebSocket(): WebSocket | null {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.ws;
    }
    return null;
  }

  private connect() {
    if (typeof window === 'undefined' || this.isConnecting) return;
    this.isConnecting = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);

    // 1. Tenter la connexion WebSocket (prioritaire, 0ms latence)
    if (typeof WebSocket !== 'undefined') {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        const wsUrl = `${protocol}//${host}/ws/chat?partnerId=${encodeURIComponent(this.activePartnerId)}`;

        const ws = new WebSocket(wsUrl);
        this.ws = ws;

        ws.onopen = () => {
          this.isConnecting = false;
          // Arrêter SSE si WebSocket actif
          if (this.sse) {
            this.sse.close();
            this.sse = null;
          }

          // Démarrer ping régulier
          if (this.pingInterval) clearInterval(this.pingInterval);
          this.pingInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              try {
                this.ws.send(JSON.stringify({ type: 'ping' }));
              } catch {}
            }
          }, 18000);
        };

        ws.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            this.dispatchPayload(payload);
          } catch {}
        };

        ws.onclose = () => {
          this.ws = null;
          this.isConnecting = false;
          if (this.pingInterval) clearInterval(this.pingInterval);
          this.scheduleReconnect();
        };

        ws.onerror = () => {
          // Si le WebSocket échoue, basculer sur SSE
          if (!this.sse) {
            this.connectSse();
          }
        };

        // Si après 3.5s le WS n'est pas ouvert, ouvrir aussi SSE en backup
        setTimeout(() => {
          if (this.subscribers.size > 0 && (!this.ws || this.ws.readyState !== WebSocket.OPEN) && !this.sse) {
            this.connectSse();
          }
        }, 3500);

        return;
      } catch (err) {
        console.warn('[Realtime Hub] Erreur init WS, fallback SSE:', err);
      }
    }

    // 2. Fallback SSE
    this.connectSse();
  }

  private connectSse() {
    if (typeof window === 'undefined' || this.sse) return;
    try {
      const sse = new EventSource(`/api/chat/events?partnerId=${encodeURIComponent(this.activePartnerId)}`);
      this.sse = sse;

      sse.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.dispatchPayload(payload);
        } catch {}
      };

      sse.onerror = () => {
        if (this.sse) {
          this.sse.close();
          this.sse = null;
        }
        this.scheduleReconnect();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private dispatchPayload(payload: any) {
    if (!payload || !payload.type) return;

    this.subscribers.forEach((sub) => {
      try {
        if (payload.type === 'new_message' && payload.message && sub.onNewMessage) {
          sub.onNewMessage(payload.message);
        } else if (
          payload.type === 'delete_messages' &&
          Array.isArray(payload.messageIds) &&
          sub.onDeleteMessages
        ) {
          sub.onDeleteMessages(payload.messageIds);
        } else if (payload.type === 'clear_chat' && sub.onClearChat) {
          sub.onClearChat();
        } else if (
          (payload.type === 'messages_read' || payload.type === 'read_receipt') &&
          Array.isArray(payload.messageIds) &&
          sub.onMessagesRead
        ) {
          sub.onMessagesRead(payload.messageIds, payload.readAt);
        } else if (payload.type === 'presence' && payload.presence && sub.onPresence) {
          sub.onPresence(payload.presence);
        } else if (payload.type === 'handshake' && payload.presence && sub.onPresence) {
          sub.onPresence(payload.presence);
        } else if (payload.type === 'pulse' && payload.pulse && sub.onPulse) {
          sub.onPulse(payload.pulse);
        } else if (payload.type === 'new_memory' && payload.memory && sub.onNewMemory) {
          sub.onNewMemory(payload.memory);
        } else if (payload.type === 'update_memory' && payload.memory && sub.onUpdateMemory) {
          sub.onUpdateMemory(payload.memory);
        } else if (payload.type === 'delete_memory' && payload.memoryId && sub.onDeleteMemory) {
          sub.onDeleteMemory(payload.memoryId);
        }
      } catch (err) {
        console.warn('[Realtime Hub] Dispatch callback error:', err);
      }
    });
  }

  private scheduleReconnect() {
    if (this.subscribers.size === 0 || this.isDestroyed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2000);
  }

  public reconnect(reason?: string) {
    if (this.subscribers.size === 0) return;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.disconnect();
    this.connect();
  }

  private disconnect() {
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      try {
        this.ws.close();
      } catch {}
      this.ws = null;
    }
    if (this.sse) {
      try {
        this.sse.close();
      } catch {}
      this.sse = null;
    }
    this.isConnecting = false;
  }
}

const realtimeHub = new RealtimeHub();

/**
 * Envoie un message au relais direct du serveur Express
 * (transmis immédiatement via WebSocket + HTTP, diffusé en 0ms et pushé vers l'appareil de l'autre partenaire)
 */
export async function sendChatMessageViaRelay(
  message: ChatMessage,
  senderName?: string
): Promise<boolean> {
  // 1. Transmission instantanée via WebSocket (0ms round-trip)
  const ws = realtimeHub.getWebSocket();
  if (ws) {
    try {
      ws.send(JSON.stringify({ type: 'chat_message', message, senderName }));
    } catch {}
  }

  // 2. Toujours persister via HTTP pour garantir l'enregistrement et le Web Push
  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, senderName }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Chat Relay] Erreur envoi HTTP message:', err);
    // Si WebSocket a envoyé, le message est tout de même parti
    return Boolean(ws);
  }
}

/**
 * Récupère tous les messages sauvegardés sur le serveur
 */
export async function fetchChatMessagesFromRelay(): Promise<ChatMessage[]> {
  try {
    const res = await fetch('/api/chat/messages');
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.messages) ? data.messages : [];
  } catch (err) {
    console.warn('[Chat Relay] Erreur récupération messages:', err);
    return [];
  }
}

/**
 * Synchronise les messages locaux avec le serveur et échange les identifiants supprimés (tombstones)
 */
export async function syncLocalMessagesWithRelay(
  localMessages: ChatMessage[],
  deletedIds?: string[]
): Promise<ChatSyncRelayResult> {
  try {
    const res = await fetch('/api/chat/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localMessages, deletedIds: deletedIds || [] }),
    });
    if (!res.ok) return { messages: [], deletedIds: [] };
    const data = await res.json();
    return {
      messages: Array.isArray(data.messages) ? data.messages : [],
      deletedIds: Array.isArray(data.deletedIds) ? data.deletedIds : [],
    };
  } catch (err) {
    console.warn('[Chat Relay] Erreur synchronisation messages:', err);
    return { messages: [], deletedIds: [] };
  }
}

/**
 * Diffuse l'état de frappe via le serveur
 */
export async function sendTypingViaRelay(
  partnerId: string,
  isTyping: boolean
): Promise<void> {
  const ws = realtimeHub.getWebSocket();
  if (ws) {
    try {
      ws.send(JSON.stringify({ type: 'typing', partnerId, isTyping }));
      return;
    } catch {}
  }
  try {
    await fetch('/api/chat/typing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId, isTyping }),
    });
  } catch {}
}

/**
 * Diffuse la présence en ligne via le serveur
 */
export async function sendPresenceViaRelay(
  partnerId: string,
  isOnline: boolean
): Promise<void> {
  const ws = realtimeHub.getWebSocket();
  if (ws) {
    try {
      ws.send(JSON.stringify({ type: 'presence', partnerId, isOnline }));
      return;
    } catch {}
  }
  try {
    await fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partnerId, isOnline }),
    });
  } catch {}
}

/**
 * Diffuse une impulsion de manque via le serveur
 */
export async function sendPulseViaRelay(
  pulse: MissYouPulse,
  senderName?: string
): Promise<boolean> {
  const ws = realtimeHub.getWebSocket();
  if (ws) {
    try {
      ws.send(JSON.stringify({ type: 'pulse', pulse, senderName }));
    } catch {}
  }
  try {
    const res = await fetch('/api/chat/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pulse, senderName }),
    });
    return res.ok;
  } catch {
    return Boolean(ws);
  }
}

/**
 * Supprime un ou plusieurs messages sur le serveur relais
 */
export async function deleteChatMessagesViaRelay(messageIds: string[]): Promise<boolean> {
  if (!Array.isArray(messageIds) || messageIds.length === 0) return true;
  try {
    const res = await fetch('/api/chat/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Chat Relay] Erreur suppression messages:', err);
    return false;
  }
}

/**
 * Efface l'intégralité de la discussion sur le serveur relais
 */
export async function clearChatViaRelay(): Promise<boolean> {
  try {
    const res = await fetch('/api/chat/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return res.ok;
  } catch (err) {
    console.warn('[Chat Relay] Erreur effacement discussion:', err);
    return false;
  }
}

/**
 * Écoute en temps réel via WebSocket avec fallback automatique Server-Sent Events (SSE)
 */
export function connectChatEvents(options: ChatEventsOptions): () => void {
  return realtimeHub.subscribe(options);
}

/**
 * Diffuse instantanément un accusé de réception / lecture aux deux appareils (latence 0ms)
 */
export async function sendReadReceiptViaRelay(messageIds: string[], readBy: string): Promise<boolean> {
  if (!Array.isArray(messageIds) || messageIds.length === 0) return true;
  const now = new Date().toISOString();

  // 1. Tenter l'envoi immédiat via WebSocket
  const ws = realtimeHub.getWebSocket();
  if (ws && ws.readyState === WebSocket.OPEN) {
    try {
      ws.send(JSON.stringify({ type: 'messages_read', messageIds, readBy, readAt: now }));
      return true;
    } catch {}
  }

  // 2. Fallback HTTP POST
  try {
    const res = await fetch('/api/chat/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageIds, readBy }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Chat Relay] Erreur diffusion accusé de lecture:', err);
    return false;
  }
}
