/**
 * Firestore Media Sync Engine
 * Chunks media files (videos/audio/images) into persistent Firestore documents
 * stored in the accessible `couple_settings` collection.
 *
 * This provides a 100% durable, cross-container, cross-device cloud storage layer
 * that works seamlessly across AI Studio Dev and Preview URLs, mobile PWAs, and desktop browsers.
 */

import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

const MEDIA_COLLECTION = 'couple_settings';
// Firestore document limit is 1 MiB. We use 650 KiB base64 chunks (~480 KiB binary) for safety
const CHUNK_SIZE_BYTES = 650 * 1024;

export interface FirestoreMediaManifest {
  id: string;
  isMediaManifest: true;
  mediaId: string;
  totalChunks: number;
  totalSize: number;
  mimeType: string;
  fileName: string;
  createdAt: number;
}

export interface FirestoreMediaChunk {
  id: string;
  isMediaChunk: true;
  mediaId: string;
  chunkIndex: number;
  data: string; // Base64 string chunk
  createdAt: number;
}

/**
 * Converts a Blob or File into a base64 string (browser & Node.js universal)
 */
async function blobToBase64(blob: Blob): Promise<string> {
  if (typeof FileReader !== 'undefined') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const commaIdx = result.indexOf(',');
        if (commaIdx !== -1) {
          resolve(result.slice(commaIdx + 1));
        } else {
          resolve(result);
        }
      };
      reader.onerror = () => reject(reader.error || new Error('Erreur lecture Blob'));
      reader.readAsDataURL(blob);
    });
  }
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer).toString('base64');
}

/**
 * Converts a base64 string back into a Blob (browser & Node.js universal)
 */
function base64ToBlob(base64: string, mimeType: string): Blob {
  if (typeof Buffer !== 'undefined') {
    const buffer = Buffer.from(base64, 'base64');
    return new Blob([buffer], { type: mimeType });
  }
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * Stores a video/media Blob into Firestore as sequential chunks in `couple_settings`.
 * Returns the unique manifest identifier: `firestore:manifest_{mediaId}`
 */
export async function saveMediaBlobToFirestore(
  mediaId: string,
  blob: Blob,
  fileName = 'video.mp4',
  onProgress?: (percent: number) => void
): Promise<string> {
  const cleanId = mediaId.replace(/^idb:/, '').replace(/[^\w.-]/g, '_');
  const mimeType = blob.type || 'video/mp4';

  const fullBase64 = await blobToBase64(blob);
  const totalLength = fullBase64.length;
  const totalChunks = Math.ceil(totalLength / CHUNK_SIZE_BYTES);

  console.log(`[FirestoreMedia] Début téléversement "${cleanId}": ${totalChunks} fragments (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);

  // 1. Upload all chunks in parallel batches of 3 to optimize speed without exceeding Firestore rate limits
  const batchSize = 3;
  for (let i = 0; i < totalChunks; i += batchSize) {
    const sliceEnd = Math.min(i + batchSize, totalChunks);
    const promises: Promise<void>[] = [];

    for (let chunkIdx = i; chunkIdx < sliceEnd; chunkIdx++) {
      const start = chunkIdx * CHUNK_SIZE_BYTES;
      const end = Math.min(start + CHUNK_SIZE_BYTES, totalLength);
      const chunkData = fullBase64.slice(start, end);

      const chunkDocId = `media_${cleanId}_chunk_${chunkIdx}`;
      const chunkRef = doc(db, MEDIA_COLLECTION, chunkDocId);

      promises.push(
        setDoc(chunkRef, {
          id: chunkDocId,
          isMediaChunk: true,
          mediaId: cleanId,
          chunkIndex: chunkIdx,
          data: chunkData,
          createdAt: Date.now(),
        })
      );
    }

    await Promise.all(promises);
    const percent = Math.round((sliceEnd / totalChunks) * 100);
    onProgress?.(percent);
  }

  // 2. Write the manifest document
  const manifestDocId = `media_${cleanId}_manifest`;
  const manifestRef = doc(db, MEDIA_COLLECTION, manifestDocId);
  const manifest: FirestoreMediaManifest = {
    id: manifestDocId,
    isMediaManifest: true,
    mediaId: cleanId,
    totalChunks,
    totalSize: blob.size,
    mimeType,
    fileName,
    createdAt: Date.now(),
  };

  await setDoc(manifestRef, manifest);
  console.log(`[FirestoreMedia] Téléversement réussi: ${manifestDocId}`);
  return `firestore:${cleanId}`;
}

/**
 * Retrieves a media Blob from Firestore chunks.
 * Returns null if not found in Firestore.
 */
export async function getMediaBlobFromFirestore(
  mediaIdOrRef: string,
  onProgress?: (percent: number) => void
): Promise<Blob | null> {
  const cleanId = mediaIdOrRef
    .replace(/^firestore:/, '')
    .replace(/^idb:/, '')
    .replace(/[^\w.-]/g, '_');

  try {
    // 1. Read manifest
    const manifestDocId = `media_${cleanId}_manifest`;
    const manifestSnap = await getDoc(doc(db, MEDIA_COLLECTION, manifestDocId));

    if (!manifestSnap.exists()) {
      return null;
    }

    const manifest = manifestSnap.data() as FirestoreMediaManifest;
    const totalChunks = manifest.totalChunks || 1;
    const mimeType = manifest.mimeType || 'video/mp4';

    console.log(`[FirestoreMedia] Téléchargement de "${cleanId}": ${totalChunks} fragments...`);

    // 2. Fetch all chunks in batches of 6 for network stability
    const chunks: string[] = new Array(totalChunks);
    const BATCH = 6;
    for (let i = 0; i < totalChunks; i += BATCH) {
      const end = Math.min(i + BATCH, totalChunks);
      const batchPromises = [];
      for (let j = i; j < end; j++) {
        const chunkDocId = `media_${cleanId}_chunk_${j}`;
        const idx = j;
        batchPromises.push(
          getDoc(doc(db, MEDIA_COLLECTION, chunkDocId)).then((snap) => {
            if (!snap.exists()) {
              throw new Error(`Fragment Firestore manquant: ${chunkDocId}`);
            }
            chunks[idx] = snap.data().data as string;
          })
        );
      }
      await Promise.all(batchPromises);
      onProgress?.(Math.round((end / totalChunks) * 100));
    }

    const fullBase64 = chunks.join('');
    const blob = base64ToBlob(fullBase64, mimeType);

    onProgress?.(100);
    console.log(`[FirestoreMedia] Reconstitution réussie pour "${cleanId}" (${(blob.size / 1024 / 1024).toFixed(2)} MB)`);
    return blob;
  } catch (err) {
    console.warn(`[FirestoreMedia] Échec lecture média Firestore "${cleanId}":`, err);
    return null;
  }
}

/**
 * Checks if a media has been stored in Firestore
 */
export async function hasMediaInFirestore(mediaIdOrRef: string): Promise<boolean> {
  const cleanId = mediaIdOrRef
    .replace(/^firestore:/, '')
    .replace(/^idb:/, '')
    .replace(/[^\w.-]/g, '_');

  try {
    const manifestDocId = `media_${cleanId}_manifest`;
    const snap = await getDoc(doc(db, MEDIA_COLLECTION, manifestDocId));
    return snap.exists();
  } catch {
    return false;
  }
}
