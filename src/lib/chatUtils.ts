import { ChatMessage } from '../types';

/**
 * Universally and reliably extracts a numeric millisecond timestamp
 * from any message object regardless of whether it's stored as:
 * - timestampMs / createdAtMs (number)
 * - ISO string or numeric string
 * - Firestore Timestamp object ({ seconds, nanoseconds } or toDate() / toMillis())
 * - Or embedded in the ID (e.g. msg_1726301234567_abc)
 */
export function extractMessageTimestampMs(m: any): number {
  if (!m) return 0;

  // 1. Explicit numeric timestampMs or createdAtMs
  if (typeof m.timestampMs === 'number' && !isNaN(m.timestampMs) && m.timestampMs > 0) {
    return m.timestampMs < 1e11 ? m.timestampMs * 1000 : m.timestampMs;
  }
  if (typeof m.createdAtMs === 'number' && !isNaN(m.createdAtMs) && m.createdAtMs > 0) {
    return m.createdAtMs < 1e11 ? m.createdAtMs * 1000 : m.createdAtMs;
  }

  // 2. msg.timestamp
  const raw = m.timestamp;
  if (typeof raw === 'number' && !isNaN(raw) && raw > 0) {
    return raw < 1e11 ? raw * 1000 : raw;
  }
  if (typeof raw === 'string' && raw.trim()) {
    const trimmed = raw.trim();
    // If purely digits
    if (/^\d{10,14}$/.test(trimmed)) {
      const num = parseInt(trimmed, 10);
      return num < 1e11 ? num * 1000 : num;
    }
    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    if (typeof raw.toMillis === 'function') {
      try {
        const ms = raw.toMillis();
        if (typeof ms === 'number' && !isNaN(ms) && ms > 0) return ms;
      } catch {}
    }
    if (typeof raw.toDate === 'function') {
      try {
        const d = raw.toDate();
        if (d instanceof Date && !isNaN(d.getTime())) return d.getTime();
      } catch {}
    }
    if (typeof raw.seconds === 'number' && !isNaN(raw.seconds)) {
      return raw.seconds * 1000 + Math.round((raw.nanoseconds || 0) / 1000000);
    }
    if (typeof raw._seconds === 'number' && !isNaN(raw._seconds)) {
      return raw._seconds * 1000 + Math.round((raw._nanoseconds || 0) / 1000000);
    }
  }

  // 3. msg.createdAt
  const created = m.createdAt;
  if (typeof created === 'number' && !isNaN(created) && created > 0) {
    return created < 1e11 ? created * 1000 : created;
  }
  if (typeof created === 'string' && created.trim()) {
    const parsed = Date.parse(created.trim());
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // 4. Extract timestamp embedded in message ID (e.g. msg_1726301234567_abc)
  if (typeof m.id === 'string') {
    const match = m.id.match(/(\d{10,13})/);
    if (match) {
      const idTime = parseInt(match[1], 10);
      if (!isNaN(idTime) && idTime > 0) {
        return idTime < 1e11 ? idTime * 1000 : idTime;
      }
    }
  }

  return 0;
}

/**
 * Strictly sorts chat messages in chronological arrival order (oldest to newest).
 * Ties are broken using document ID.
 */
export function sortChatMessagesChronologically(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const timeA = extractMessageTimestampMs(a);
    const timeB = extractMessageTimestampMs(b);
    if (timeA !== timeB) return timeA - timeB;
    return (a.id || '').localeCompare(b.id || '');
  });
}

/**
 * Format message arrival timestamp to the second (HH:mm:ss)
 */
export function formatMessageTime(timestamp: any): string {
  const ms = extractMessageTimestampMs(typeof timestamp === 'object' && timestamp?.timestamp ? timestamp : { timestamp });
  const date = new Date(ms || Date.now());
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}
