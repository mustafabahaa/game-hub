export function getStoragePathFromPublicUrl(
  publicUrl: string | null | undefined,
  bucket: string
): string | null {
  if (!publicUrl) return null;

  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = publicUrl.indexOf(marker);
  if (markerIndex === -1) return null;

  const pathStart = markerIndex + marker.length;
  const rawPath = publicUrl.slice(pathStart);
  if (!rawPath) return null;

  const cleanPath = decodeURIComponent(rawPath.split("?")[0]);
  return cleanPath || null;
}
