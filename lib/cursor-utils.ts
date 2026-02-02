/**
 * Utilities for custom cursor handling.
 * 
 * Note: CSS cursor property doesn't support resizing images directly.
 * Your cursor PNG files should be pre-sized to standard cursor dimensions:
 * - 16×16 pixels (standard)
 * - 32×32 pixels (high-DPI/retina)
 * 
 * If you need to resize a larger image, use an image editor or online tool
 * to create 16×16 and 32×32 versions.
 */

/** Standard cursor sizes in pixels */
export const CURSOR_SIZES = {
  standard: 16,
  highDPI: 32,
} as const;

/**
 * Creates a data URL for a cursor image with optional resizing.
 * Note: This requires the image to be loaded first. For simple cases,
 * just provide pre-sized PNG files in public/cursors/.
 */
export async function createCursorDataURL(
  imagePath: string,
  size: number = CURSOR_SIZES.standard
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error(`Failed to load cursor image: ${imagePath}`));
    img.src = imagePath;
  });
}
