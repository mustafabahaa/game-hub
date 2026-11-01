/**
 * Release detection without a service worker. GameHub deliberately ships no
 * SW; instead the build stamps a `build-id` meta tag into index.html and this
 * poller re-fetches the document (served no-store) on an interval and on
 * return to the foreground. A changed id means a newer deployment exists.
 * Network failures are ignored — offline is not a release signal.
 */
const CHECK_INTERVAL_MS = 15 * 60 * 1000;

declare const __BUILD_ID__: string;

export function startReleaseCheck(onUpdateAvailable: () => void): () => void {
  let stopped = false;

  const check = async () => {
    try {
      const response = await fetch('/', { cache: 'no-store' });
      if (!response.ok) return;
      const html = await response.text();
      const match = html.match(/<meta name="build-id" content="([^"]+)" \/>/);
      if (!stopped && match && match[1] !== __BUILD_ID__) onUpdateAvailable();
    } catch {
      // Offline or transient failure: never treat as a new release.
    }
  };

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') void check();
  };

  const interval = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    stopped = true;
    window.clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
