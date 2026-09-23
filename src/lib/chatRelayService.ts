import { ChatMessage, MissYouPulse, TimelineMemory } from '../types';

export interface ChatPresenceInfo {
  partnerId: string;
  isTyping: boolean;
  isOnline: boolean;
  lastSeen: string;
  updatedAt: string;
}

export type ChatPresenceState = Record<string, ChatPresenceInfo>;

/**
 * Envoie un message au relais direct du serveur Express
 * (stocké immédiatement, diffusé en SSE et pushé vers l'appareil de l'autre partenaire)
 */
export async function sendChatMessageViaRelay(
  message: ChatMessage,
  senderName?: string
): Promise<boolean> {
  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, senderName }),
    });
    return res.ok;
  } catch (err) {
    console.warn('[Chat Relay] Erreur envoi message:', err);
    return false;
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
 * Synchronise les messages locaux avec le serveur
 */
export async function syncLocalMessagesWithRelay(
  localMessages: ChatMessage[]
): Promise<ChatMessage[]> {
  try {
    const res = await fetch('/api/chat/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ localMessages }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.messages) ? data.messages : [];
  } catch (err) {
    console.warn('[Chat Relay] Erreur synchronisation messages:', err);
    return [];
  }
}

/**
 * Diffuse l'état de frappe via le serveur
 */
export async function sendTypingViaRelay(
  partnerId: string,
  isTyping: boolean
): Promise<void> {
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
  try {
    const res = await fetch('/api/chat/pulse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pulse, senderName }),
    });
    return res.ok;
  } catch {
    return false;
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
 * Écoute en temps réel via Server-Sent Events (SSE)
 */
export function connectChatEvents(options: {
  partnerId: string;
  onNewMessage?: (msg: ChatMessage) => void;
  onDeleteMessages?: (messageIds: string[]) => void;
  onClearChat?: () => void;
  onPresence?: (presence: ChatPresenceState) => void;
  onPulse?: (pulse: MissYouPulse) => void;
  onNewMemory?: (memory: TimelineMemory) => void;
  onUpdateMemory?: (memory: TimelineMemory) => void;
  onDeleteMemory?: (memoryId: string) => void;
}): () => void {
  let eventSource: EventSource | null = null;
  let isClosed = false;
  let reconnectTimeout: any = null;

  function connect() {
    if (isClosed) return;
    try {
      eventSource = new EventSource(`/api/chat/events?partnerId=${encodeURIComponent(options.partnerId)}`);

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'new_message' && payload.message && options.onNewMessage) {
            options.onNewMessage(payload.message);
          } else if (
            payload.type === 'delete_messages' &&
            Array.isArray(payload.messageIds) &&
            options.onDeleteMessages
          ) {
            options.onDeleteMessages(payload.messageIds);
          } else if (payload.type === 'clear_chat' && options.onClearChat) {
            options.onClearChat();
          } else if (payload.type === 'presence' && payload.presence && options.onPresence) {
            options.onPresence(payload.presence);
          } else if (payload.type === 'handshake' && payload.presence && options.onPresence) {
            options.onPresence(payload.presence);
          } else if (payload.type === 'pulse' && payload.pulse && options.onPulse) {
            options.onPulse(payload.pulse);
          } else if (payload.type === 'new_memory' && payload.memory && options.onNewMemory) {
            options.onNewMemory(payload.memory);
          } else if (payload.type === 'update_memory' && payload.memory && options.onUpdateMemory) {
            options.onUpdateMemory(payload.memory);
          } else if (payload.type === 'delete_memory' && payload.memoryId && options.onDeleteMemory) {
            options.onDeleteMemory(payload.memoryId);
          }
        } catch {}
      };

      eventSource.onerror = () => {
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };
    } catch {
      if (!isClosed) {
        reconnectTimeout = setTimeout(connect, 4000);
      }
    }
  }

  connect();

  return () => {
    isClosed = true;
    if (reconnectTimeout) clearTimeout(reconnectTimeout);
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
}
