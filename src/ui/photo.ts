/**
 * Resizes a chosen photo on the device (nothing is uploaded) so stored
 * photos stay small: longest side ≤ 512px, JPEG.
 */
export const PHOTO_MAX_SIDE = 512;

export async function resizePhoto(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('This image format couldn’t be read on this device. Please try a JPEG or PNG photo.');
  });
  const scale = Math.min(1, PHOTO_MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Image processing isn’t available in this browser.');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.86));
  if (!blob) throw new Error('The photo couldn’t be processed.');
  return { blob, width, height };
}
