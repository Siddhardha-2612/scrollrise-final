/**
 * Audio Blob utility functions
 */

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const activeBlobUrls = new Set<string>();

export function createAudioBlobUrl(blob: Blob): string {
  const url = URL.createObjectURL(blob);
  activeBlobUrls.add(url);
  return url;
}

export function revokeAudioBlobUrl(url: string): void {
  if (activeBlobUrls.has(url)) {
    URL.revokeObjectURL(url);
    activeBlobUrls.delete(url);
  }
}

export function clearAllAudioBlobUrls(): void {
  activeBlobUrls.forEach(url => {
    URL.revokeObjectURL(url);
  });
  activeBlobUrls.clear();
}
