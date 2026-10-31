/**
 * Firebase Storage helpers with client-side image compression.
 *
 * Path conventions:
 * - Game covers:      users/{uid}/gameImages/{accountId}/{imageId}.jpg
 * - Provider photos:  users/{uid}/providerPhotos/{imageId}.jpg
 *
 * Compression matches the original game-hub optimizeImageForUpload: max 1600px,
 * target ~800KB, JPEG/PNG only.
 */
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { requireStorage } from '@/config/firebase';

const MAX_DIMENSION = 1600;
const TARGET_BYTES = 800 * 1024; // 800 KB
const QUALITY_STEPS = [0.85, 0.75, 0.65, 0.55, 0.45];

export interface OptimizedImage {
  blob: Blob;
  previewUrl: string;
}

/** Downscale + re-encode an image File to a JPEG blob under the target size. */
export async function optimizeImageForUpload(file: File): Promise<OptimizedImage | null> {
  if (!file.type.startsWith('image/')) return null;

  const bitmap = await loadImageBitmap(file);
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(bitmap, 0, 0, width, height);

  // Step down quality until under target.
  let blob: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    blob = await canvasToBlob(canvas, 'image/jpeg', quality);
    if (blob && blob.size <= TARGET_BYTES) break;
  }
  if (!blob) return null;

  return { blob, previewUrl: URL.createObjectURL(blob) };
}

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      createImageBitmap(img).then(resolve).catch(reject);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Upload a compressed image to the given storage path. Returns the public URL. */
export async function uploadImage(path: string, file: File): Promise<string> {
  const storage = requireStorage();
  const optimized = await optimizeImageForUpload(file);
  const blob = optimized?.blob ?? file;
  const storageRef = ref(storage, path);
  await uploadBytesResumable(storageRef, blob);
  return getDownloadURL(storageRef);
}

/** Best-effort delete of a storage object by URL/path. Swallows errors. */
export async function deleteByUrl(url: string | null | undefined): Promise<void> {
  if (!url) return;
  try {
    const storage = requireStorage();
    await deleteObject(ref(storage, url));
  } catch {
    // best-effort
  }
}

export async function deleteByPath(path: string): Promise<void> {
  const storage = requireStorage();
  await deleteObject(ref(storage, path));
}
