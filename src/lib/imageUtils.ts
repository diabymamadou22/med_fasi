/**
 * Image compression and processing utilities for Nid d'Amour
 * Optimizes mobile camera photos (5-15 MB) into lightweight high-fidelity images (~150-250 KB)
 * preserving complete aspect ratios and preventing storage saturation.
 */

export interface CompressedImageResult {
  dataUrl: string;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  reductionPercent: number;
  width: number;
  height: number;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 o';
  const k = 1024;
  const sizes = ['o', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Utility to resize, center-crop and compress uploaded profile images into lightweight base64 strings
 * so they fit safely in browser localStorage (< 60 KB each) without loss of visual clarity.
 */
export async function processImageFile(
  file: File,
  maxDimension = 360,
  quality = 0.84
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier sélectionné doit être une image.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur de lecture du fichier image.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Impossible de charger l\'image.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = maxDimension;
          canvas.height = maxDimension;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Contexte Canvas indisponible.'));
            return;
          }

          // Center crop calculations
          const minSide = Math.min(img.width, img.height);
          const sx = (img.width - minSide) / 2;
          const sy = (img.height - minSide) / 2;

          // Smooth rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            sx,
            sy,
            minSide,
            minSide,
            0,
            0,
            maxDimension,
            maxDimension
          );

          // Export as JPEG base64
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * High-performance smart compressor for smartphone camera photos (5 to 15 MB)
 * Keeps exact original aspect ratio (NO cropping), scales within maxDimension bounding box,
 * and performs iterative quality targeting to keep payload light (< 300 KB) while preserving clarity.
 */
export async function compressImageWithStats(
  file: File,
  options?: {
    maxDimension?: number;
    maxSizeBytes?: number;
    initialQuality?: number;
  }
): Promise<CompressedImageResult> {
  const maxDimension = options?.maxDimension || 1280;
  const maxSizeBytes = options?.maxSizeBytes || 320 * 1024; // 320 KB target
  const initialQuality = options?.initialQuality || 0.82;
  const originalSizeBytes = file.size;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier sélectionné doit être une image valide.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Impossible de lire le fichier photo.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Impossible de charger la photo pour la compression.'));
      img.onload = () => {
        try {
          let width = img.width;
          let height = img.height;

          // Proportionally scale to fit bounding box
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            reject(new Error('Accès au moteur graphique Canvas impossible.'));
            return;
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          // Iterative compression to satisfy size budget
          let currentQuality = initialQuality;
          let dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
          let estimatedBytes = Math.round((dataUrl.length * 3) / 4);

          // Step down quality if image is still above budget
          const qualitySteps = [0.75, 0.68, 0.60, 0.52];
          let stepIndex = 0;

          while (estimatedBytes > maxSizeBytes && stepIndex < qualitySteps.length) {
            currentQuality = qualitySteps[stepIndex];
            dataUrl = canvas.toDataURL('image/jpeg', currentQuality);
            estimatedBytes = Math.round((dataUrl.length * 3) / 4);
            stepIndex++;
          }

          const reductionPercent = Math.max(
            0,
            Math.round(((originalSizeBytes - estimatedBytes) / originalSizeBytes) * 100)
          );

          resolve({
            dataUrl,
            originalSizeBytes,
            compressedSizeBytes: estimatedBytes,
            reductionPercent,
            width,
            height,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Convenience function to resize photos KEEPING their exact original aspect ratio (NO cropping)
 */
export async function processPhotoWithoutCropping(
  file: File,
  maxDimension = 1280,
  quality = 0.82
): Promise<string> {
  const result = await compressImageWithStats(file, {
    maxDimension,
    initialQuality: quality,
  });
  return result.dataUrl;
}

