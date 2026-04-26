const DEFAULT_MAX_DIMENSION = 1600;
const DEFAULT_TARGET_BYTES = 800 * 1024; // 800 KB
const DEFAULT_HARD_LIMIT_BYTES = 12 * 1024 * 1024; // 12 MB

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to read image"));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to compress image"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

export async function optimizeImageForUpload(
  file: File,
  options?: {
    maxDimension?: number;
    targetBytes?: number;
    hardLimitBytes?: number;
  }
): Promise<File> {
  const maxDimension = options?.maxDimension ?? DEFAULT_MAX_DIMENSION;
  const targetBytes = options?.targetBytes ?? DEFAULT_TARGET_BYTES;
  const hardLimitBytes = options?.hardLimitBytes ?? DEFAULT_HARD_LIMIT_BYTES;

  if (!file.type.startsWith("image/")) return file;
  if (file.size > hardLimitBytes) {
    throw new Error("Image is too large. Please choose one under 12 MB.");
  }
  if (file.size <= targetBytes) return file;

  const image = await loadImage(file);
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not process image");
  context.drawImage(image, 0, 0, width, height);

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
  const extension = outputType === "image/png" ? "png" : "jpg";
  const baseName = file.name.replace(/\.[^.]+$/, "");

  let quality = 0.86;
  let blob = await canvasToBlob(canvas, outputType, quality);
  while (blob.size > targetBytes && quality > 0.5) {
    quality -= 0.1;
    blob = await canvasToBlob(canvas, outputType, quality);
  }

  return new File([blob], `${baseName}.${extension}`, { type: outputType });
}
