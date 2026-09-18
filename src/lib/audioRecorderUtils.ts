/**
 * Cross-platform Audio Recording Utilities for iOS Safari, Android Chrome, and Desktop
 * Handles Safari's audio/mp4 (AAC) requirement and Android/Chrome's audio/webm (Opus)
 */

export interface SupportedAudioMime {
  mimeType: string;
  extension: string;
}

/**
 * Detect the optimal supported audio MIME type for MediaRecorder on this device
 */
export function getSupportedAudioMimeType(): SupportedAudioMime {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return { mimeType: 'audio/webm', extension: 'webm' };
  }

  // Priority order:
  // 1. audio/mp4 (best on iOS Safari 14.5+)
  // 2. audio/webm;codecs=opus (standard on Android Chrome & desktop)
  // 3. audio/webm
  // 4. audio/ogg;codecs=opus
  // 5. audio/wav or fallback
  const candidates: SupportedAudioMime[] = [
    { mimeType: 'audio/mp4;codecs=mp4a.40.2', extension: 'mp4' },
    { mimeType: 'audio/mp4', extension: 'mp4' },
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' },
    { mimeType: 'audio/webm', extension: 'webm' },
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' },
    { mimeType: 'audio/wav', extension: 'wav' },
  ];

  for (const candidate of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(candidate.mimeType)) {
        return candidate;
      }
    } catch {
      // ignore check error
    }
  }

  return { mimeType: '', extension: 'audio' };
}

/**
 * Format duration in seconds to MM:SS format
 */
export function formatAudioTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert Audio Blob to Base64 Data URL
 */
export function audioBlobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Erreur de conversion audio en data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
