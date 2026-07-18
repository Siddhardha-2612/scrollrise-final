/**
 * Voice Audio helper functions
 */

export function formatPlaybackTime(time: number): string {
  if (isNaN(time) || !isFinite(time)) return "0:00";
  const mins = Math.floor(time / 60);
  const secs = Math.floor(time % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

export function measureAudioDuration(blob: Blob): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audio.addEventListener('loadedmetadata', () => {
      const dur = audio.duration;
      URL.revokeObjectURL(url);
      resolve(isFinite(dur) && !isNaN(dur) ? dur : 0);
    });
    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(0);
    });
    // Set timeout as a safeguard
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve(0);
    }, 4000);
  });
}
