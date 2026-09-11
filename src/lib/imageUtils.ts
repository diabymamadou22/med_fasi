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
