/**
 * Video processing, thumbnail generation, and IndexedDB storage utilities for NID.
 * Enables seamless video importing for Chat and Shared Gallery with client-side persistence,
 * video thumbnail generation, and responsive playback across mobile and desktop.
 */

const DB_NAME = 'nid_media_db';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

// In-memory cache for Object URLs created from IndexedDB blobs
const objectUrlCache = new Map<string, string>();

/**
 * Open or upgrade the IndexedDB media database
 */
function openMediaDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté par ce navigateur.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error || new Error('Erreur d\'ouverture IndexedDB.'));
    };
  });
}

/**
 * Upload a media Blob or File to the server for persistent, cross-partner playback
 */
export async function uploadMediaToServer(
  blobOrFile: Blob | File,
  suggestedFilename?: string
): Promise<{ url: string; filename: string; size: number }> {
  const originalName =
    suggestedFilename ||
    (blobOrFile instanceof File ? blobOrFile.name : `video_${Date.now()}.mp4`);

  const uploadEndpoint = `/api/media/upload?filename=${encodeURIComponent(originalName)}`;

  const response = await fetch(uploadEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': blobOrFile.type || 'video/mp4',
      'X-Filename': originalName,
    },
    body: blobOrFile,
  });

  if (!response.ok) {
    throw new Error(`Erreur serveur HTTP ${response.status} lors de l'upload du média`);
  }

  const result = await response.json();
  if (!result || !result.url) {
    throw new Error("Réponse d'upload média invalide du serveur");
  }

  return {
    url: result.url,
    filename: result.filename || originalName,
    size: result.size || blobOrFile.size,
  };
}

/**
 * Save a video Blob or File to IndexedDB for local zero-latency caching,
 * and upload to the server so that the partner can play it seamlessly across devices.
 * Returns the server URL `/api/media/xxx.mp4` when uploaded, or `idb:xxx` as offline fallback.
 */
export async function storeMediaBlob(key: string, blob: Blob): Promise<string> {
  const originalName = blob instanceof File ? blob.name : `${key}.mp4`;

  // 1. Immediately store in local IndexedDB so local playback never fails even if offline
  try {
    const db = await openMediaDb();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(blob, key);
  } catch (err) {
    console.warn('IndexedDB write warning:', err);
  }

  // Pre-cache object URL for instant zero-latency preview on uploader's device
  const localObjUrl = URL.createObjectURL(blob);
  objectUrlCache.set(key, localObjUrl);

  // 2. Upload to the shared server so partner can play it across devices
  try {
    const uploadRes = await uploadMediaToServer(blob, originalName);
    if (uploadRes && uploadRes.url) {
      // Also cache local object URL under the server URL so the uploader doesn't re-download it!
      objectUrlCache.set(uploadRes.url, localObjUrl);

      // Also save in local IndexedDB under the server URL for offline support
      try {
        const db = await openMediaDb();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(blob, uploadRes.url);
      } catch {}

      console.log(`[Media Stored & Uploaded] Accessible pour les 2 partenaires: ${uploadRes.url}`);
      return uploadRes.url;
    }
  } catch (uploadErr) {
    console.warn("[Media Upload Fallback] Impossible d'uploader vers le serveur pour le moment:", uploadErr);
  }

  // If network upload failed or was offline, return idb key as fallback
  return `idb:${key}`;
}

/**
 * Retrieve a Blob from IndexedDB
 */
export async function getMediaBlob(key: string): Promise<Blob | null> {
  try {
    const rawKey = key.startsWith('idb:') ? key.replace(/^idb:/, '') : key;
    const db = await openMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(rawKey);

      req.onsuccess = () => {
        resolve(req.result || null);
      };

      req.onerror = () => {
        reject(req.error);
      };
    });
  } catch (err) {
    console.error('Erreur lecture IndexedDB:', err);
    return null;
  }
}

/**
 * Resolves a media URL.
 * If it is already a server URL (`/api/media/...`), web URL (`http`, `https`), or `data:` / `blob:`, returns it directly.
 * If it is an IndexedDB ref (`idb:xxx`):
 *   - If available locally, returns the local blob URL and triggers background migration to the server.
 *   - If NOT available locally (e.g. partner's phone before sync), returns '' to avoid broken scheme errors.
 */
export async function resolveMediaUrl(urlOrKey?: string): Promise<string> {
  if (!urlOrKey) return '';

  // 1. Direct server endpoint, web URL or data/blob
  if (
    urlOrKey.startsWith('/api/') ||
    urlOrKey.startsWith('data:') ||
    urlOrKey.startsWith('blob:') ||
    urlOrKey.startsWith('http://') ||
    urlOrKey.startsWith('https://')
  ) {
    if (objectUrlCache.has(urlOrKey)) {
      return objectUrlCache.get(urlOrKey)!;
    }
    return urlOrKey;
  }

  // 2. IndexedDB reference (`idb:xxx` or raw key)
  const rawKey = urlOrKey.startsWith('idb:') ? urlOrKey.replace(/^idb:/, '') : urlOrKey;

  // Check cache first
  if (objectUrlCache.has(rawKey)) {
    return objectUrlCache.get(rawKey)!;
  }

  const blob = await getMediaBlob(rawKey);
  if (blob) {
    const objUrl = URL.createObjectURL(blob);
    objectUrlCache.set(rawKey, objUrl);

    // Auto-migrate this legacy local blob to the shared server in background
    uploadMediaToServer(blob, `${rawKey}.mp4`)
      .then((uploadRes) => {
        if (uploadRes?.url) {
          objectUrlCache.set(uploadRes.url, objUrl);
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('nid:media_migrated', {
                detail: { oldKey: urlOrKey, newUrl: uploadRes.url },
              })
            );
          }
        }
      })
      .catch((err) => console.warn('[Auto-Migrate] Background migration warning:', err));

    return objUrl;
  }

  // 3. Not found locally: this device is the partner's and the video is still pending sync from the uploader
  console.warn(`[resolveMediaUrl] Média local introuvable sur cet appareil (en attente de synchronisation): ${urlOrKey}`);
  return '';
}

/**
 * Synchronous resolver if already cached, otherwise returns fallback or original URL
 */
export function getCachedMediaUrl(urlOrKey?: string): string {
  if (!urlOrKey) return '';
  if (
    urlOrKey.startsWith('/api/') ||
    urlOrKey.startsWith('data:') ||
    urlOrKey.startsWith('blob:') ||
    urlOrKey.startsWith('http://') ||
    urlOrKey.startsWith('https://')
  ) {
    if (objectUrlCache.has(urlOrKey)) {
      return objectUrlCache.get(urlOrKey)!;
    }
    return urlOrKey;
  }

  const rawKey = urlOrKey.startsWith('idb:') ? urlOrKey.replace(/^idb:/, '') : urlOrKey;
  if (objectUrlCache.has(rawKey)) {
    return objectUrlCache.get(rawKey)!;
  }
  return urlOrKey;
}

/**
 * Convert a File/Blob to a Base64 Data URL
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Erreur conversion DataURL'));
    reader.readAsDataURL(blob);
  });
}

/**
 * Check if a file or URL points to a video
 */
export function isVideoMediaType(fileOrUrl?: File | string | null, mediaType?: string): boolean {
  if (mediaType === 'video') return true;
  if (!fileOrUrl) return false;

  if (typeof fileOrUrl !== 'string') {
    return fileOrUrl.type.startsWith('video/');
  }

  const clean = fileOrUrl.toLowerCase().trim();
  if (clean.startsWith('data:video/') || clean.startsWith('blob:')) return true;
  if (clean.startsWith('idb:') || clean.includes('/api/media/')) return true;

  // Strip query parameters and hashes to test actual filename extension
  const urlWithoutQuery = clean.split('?')[0].split('#')[0];
  if (/\.(mp4|webm|mov|m4v|ogv|ogg|3gp|mkv)$/i.test(urlWithoutQuery)) {
    return true;
  }

  // Check storage or path patterns
  if (
    clean.includes('/videos%2f') ||
    clean.includes('/video%2f') ||
    clean.includes('/videos/') ||
    clean.includes('/video/') ||
    clean.includes('video_')
  ) {
    return true;
  }

  return false;
}

export interface VideoMetadataResult {
  duration: number; // in seconds
  formattedDuration: string; // e.g. "0:14"
  width: number;
  height: number;
  thumbnailDataUrl: string;
  sizeBytes: number;
}

/**
 * Extract video thumbnail, duration and dimensions from a File or Blob
 */
export function extractVideoThumbnail(file: File | Blob): Promise<VideoMetadataResult> {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');

    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';

    let hasHandledError = false;
    const handleError = (err: any) => {
      if (hasHandledError) return;
      hasHandledError = true;
      URL.revokeObjectURL(videoUrl);
      reject(err instanceof Error ? err : new Error('Impossible de lire cette vidéo'));
    };

    video.onerror = (e) => handleError(e);

    // Timeout safety in case video cannot decode
    const timeoutId = setTimeout(() => {
      handleError(new Error('Délai d\'analyse de la vidéo dépassé.'));
    }, 15000);

    video.onloadedmetadata = () => {
      const duration = isFinite(video.duration) ? Math.max(1, Math.round(video.duration)) : 5;
      const targetTime = Math.min(1.0, duration > 2 ? duration * 0.15 : 0.5);

      // Seek to capture frame
      video.currentTime = targetTime;
    };

    video.onseeked = () => {
      clearTimeout(timeoutId);
      try {
        const width = video.videoWidth || 640;
        const height = video.videoHeight || 360;

        // Max thumbnail width 640px to keep thumbnail lightweight (~30-60 KB)
        const maxThumbDim = 640;
        let thumbW = width;
        let thumbH = height;

        if (width > maxThumbDim || height > maxThumbDim) {
          if (width > height) {
            thumbW = maxThumbDim;
            thumbH = Math.round((height * maxThumbDim) / width);
          } else {
            thumbH = maxThumbDim;
            thumbW = Math.round((width * maxThumbDim) / height);
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = thumbW;
        canvas.height = thumbH;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D context non disponible');
        }

        ctx.drawImage(video, 0, 0, thumbW, thumbH);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        const durationSec = Math.round(video.duration || 0);
        const mins = Math.floor(durationSec / 60);
        const secs = durationSec % 60;
        const formattedDuration = `${mins}:${secs.toString().padStart(2, '0')}`;

        URL.revokeObjectURL(videoUrl);

        resolve({
          duration: durationSec,
          formattedDuration,
          width,
          height,
          thumbnailDataUrl,
          sizeBytes: file.size,
        });
      } catch (err) {
        handleError(err);
      }
    };

    video.src = videoUrl;
  });
}

/**
 * Format seconds into mm:ss
 */
export function formatVideoDuration(seconds?: number): string {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format file size into human readable string
 */
export function formatMediaSize(bytes?: number): string {
  if (!bytes || bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
