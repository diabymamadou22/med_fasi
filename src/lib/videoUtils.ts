/**
 * Video processing, thumbnail generation, and IndexedDB/Firestore storage utilities for NID.
 * Enables seamless video importing for Chat and Shared Gallery with client-side persistence,
 * cloud sync between partners, video thumbnail generation, and responsive playback across mobile and desktop.
 */

import {
  saveMediaBlobToFirestore,
  getMediaBlobFromFirestore,
} from './firestoreMediaSync';

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
 * Save a video Blob or File to IndexedDB and return an `idb:` reference key
 */
export async function storeMediaBlob(key: string, blob: Blob): Promise<string> {
  try {
    const db = await openMediaDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(blob, key);

      req.onsuccess = () => {
        // Cache the object URL for immediate fast access
        const objUrl = URL.createObjectURL(blob);
        objectUrlCache.set(key, objUrl);
        resolve(`idb:${key}`);
      };

      req.onerror = () => {
        reject(req.error || new Error('Erreur de sauvegarde média dans IndexedDB.'));
      };
    });
  } catch (err) {
    console.warn('Fallback: impossible de stocker dans IndexedDB, conversion en DataURL...', err);
    return blobToDataUrl(blob);
  }
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
 * If it is an IndexedDB ref (`idb:xxx`) or Firestore ref (`firestore:xxx`),
 * loads the Blob and returns a working `blob:` URL.
 * If it is already a `data:`, `blob:`, or `http:` URL, returns it directly.
 */
export async function resolveMediaUrl(urlOrKey?: string): Promise<string> {
  if (!urlOrKey) return '';

  if (
    urlOrKey.startsWith('data:') ||
    urlOrKey.startsWith('blob:') ||
    urlOrKey.startsWith('http://') ||
    urlOrKey.startsWith('https://')
  ) {
    return urlOrKey;
  }

  const cleanKey = urlOrKey
    .replace(/^firestore:/, '')
    .replace(/^idb:/, '');

  // Check cache first
  if (objectUrlCache.has(cleanKey)) {
    return objectUrlCache.get(cleanKey)!;
  }

  // 1. Try local IndexedDB
  try {
    const idbBlob = await getMediaBlob(cleanKey);
    if (idbBlob) {
      const objUrl = URL.createObjectURL(idbBlob);
      objectUrlCache.set(cleanKey, objUrl);
      return objUrl;
    }
  } catch (err) {
    // Continue to Firestore
  }

  // 2. Try Firestore cloud storage
  try {
    const firestoreBlob = await getMediaBlobFromFirestore(cleanKey);
    if (firestoreBlob) {
      // Also cache in local IndexedDB for future instant/offline loads
      storeMediaBlob(cleanKey, firestoreBlob).catch(() => {});
      const objUrl = URL.createObjectURL(firestoreBlob);
      objectUrlCache.set(cleanKey, objUrl);
      return objUrl;
    }
  } catch (fsErr) {
    console.warn(`[videoUtils] Impossible de résoudre le média "${cleanKey}":`, fsErr);
  }

  return urlOrKey;
}

/**
 * Synchronous resolver if already cached, otherwise returns fallback or original URL
 */
export function getCachedMediaUrl(urlOrKey?: string): string {
  if (!urlOrKey) return '';
  if (
    urlOrKey.startsWith('data:') ||
    urlOrKey.startsWith('blob:') ||
    urlOrKey.startsWith('http://') ||
    urlOrKey.startsWith('https://')
  ) {
    return urlOrKey;
  }

  const cleanKey = urlOrKey
    .replace(/^firestore:/, '')
    .replace(/^idb:/, '');

  if (objectUrlCache.has(cleanKey)) {
    return objectUrlCache.get(cleanKey)!;
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

export interface UploadAndPersistResult {
  serverUrl: string;
  localBlobUrl: string;
  thumbnailDataUrl: string;
  duration?: number;
  formattedDuration: string;
  width?: number;
  height?: number;
  sizeBytes: number;
  isOfflineFallback?: boolean;
}

export type UploadMediaResult = UploadAndPersistResult;

/**
 * Universal media upload and persistence engine.
 * 1. Generates an instant, optimized video thumbnail and metadata.
 * 2. Caches media in IndexedDB and generates a blob URL for instant zero-lag playback.
 * 3. Chunks and synchronizes media to Firestore cloud storage so both partners can view it across any device.
 */
export async function uploadAndPersistMedia(
  file: File | Blob,
  keyPrefix = 'vid',
  onProgress?: (status: string) => void
): Promise<UploadAndPersistResult> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const mediaKey = `${keyPrefix}_${timestamp}_${randomSuffix}`;
  const fileSize = file.size || 0;

  onProgress?.('Extraction de la miniature...');
  let thumbnailDataUrl = '';
  let duration: number | undefined;
  let formattedDuration = '0:00';
  let width = 640;
  let height = 360;

  try {
    const meta = await extractVideoThumbnail(file);
    thumbnailDataUrl = meta.thumbnailDataUrl;
    duration = meta.duration;
    formattedDuration = meta.formattedDuration;
    width = meta.width;
    height = meta.height;
  } catch (err) {
    console.warn('[videoUtils] Miniature non disponible, utilisation du repli par défaut:', err);
  }

  // 1. Local caching in IndexedDB for immediate playback
  onProgress?.('Mise en cache locale...');
  const idbKey = await storeMediaBlob(mediaKey, file);
  const localBlobUrl = URL.createObjectURL(file);
  objectUrlCache.set(mediaKey, localBlobUrl);
  objectUrlCache.set(idbKey.replace(/^idb:/, ''), localBlobUrl);

  // 2. Persist to Firestore for cloud sync between both partners
  let serverUrl = idbKey;
  try {
    onProgress?.('Synchronisation cloud avec votre partenaire (0%)...');
    const fileName = file instanceof File ? file.name : `${mediaKey}.mp4`;
    const firestoreUrl = await saveMediaBlobToFirestore(
      mediaKey,
      file,
      fileName,
      (percent) => {
        onProgress?.(`Synchronisation cloud (${percent}%)...`);
      }
    );
    if (firestoreUrl) {
      serverUrl = firestoreUrl;
      objectUrlCache.set(firestoreUrl.replace(/^firestore:/, ''), localBlobUrl);
    }
  } catch (syncErr) {
    console.warn('[videoUtils] Synchronisation cloud Firestore en repli IDB:', syncErr);
  }

  return {
    serverUrl,
    localBlobUrl,
    thumbnailDataUrl,
    duration,
    formattedDuration,
    width,
    height,
    sizeBytes: fileSize,
  };
}
