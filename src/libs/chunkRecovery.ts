/**
 * Shared stale-asset recovery for GameHub. lazyWithRetry handles React.lazy
 * imports; this module adds the Vite preload-error listener and the guarded
 * one-time reload used by both paths. See lazyWithRetry.ts for background.
 */
const RELOAD_FLAG = 'gamehub-chunk-reloaded';

// Message fragments browsers emit when a code-split chunk fails to load.
// Covers Chromium, Firefox, and Safari phrasings.
const CHUNK_ERROR_HINTS = [
  'Failed to fetch dynamically imported module',
  'error loading dynamically imported module',
  'Importing a module script failed',
  'Loading chunk',
  'Loading CSS chunk',
  'Unable to preload CSS',
];

export function isChunkLoadError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return CHUNK_ERROR_HINTS.some((hint) => error.message.includes(hint));
}

/** Reload at most once per session for a stale-chunk failure. */
export function reloadOnceForStaleAssets(): boolean {
  if (sessionStorage.getItem(RELOAD_FLAG)) return false;
  sessionStorage.setItem(RELOAD_FLAG, 'true');
  window.location.reload();
  return true;
}

/** A dynamic import succeeded, so the running build matches the deployment. */
export function clearStaleAssetReloadFlag(): void {
  sessionStorage.removeItem(RELOAD_FLAG);
}

/**
 * Vite dispatches `vite:preloadError` when a module preload (including CSS
 * for a dynamic import) fails outside React.lazy. Recover once via reload;
 * otherwise leave the error to the nearest error boundary instead of
 * reloading forever.
 */
export function installVitePreloadErrorHandler(): void {
  // Vite assigns `payload` directly on the dispatched event.
  window.addEventListener('vite:preloadError', (event) => {
    if (isChunkLoadError((event as Event & { payload?: unknown }).payload)) reloadOnceForStaleAssets();
  });
}
