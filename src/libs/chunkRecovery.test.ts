// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearStaleAssetReloadFlag,
  installVitePreloadErrorHandler,
  isChunkLoadError,
  reloadOnceForStaleAssets,
} from './chunkRecovery';

const CHUNK_ERROR = new Error('Failed to fetch dynamically imported module: /assets/old.js');

describe('chunkRecovery', () => {
  let reloadSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    sessionStorage.clear();
    reloadSpy = vi.fn();
    vi.stubGlobal('location', { reload: reloadSpy });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('recognizes browser chunk failure phrasings', () => {
    expect(isChunkLoadError(CHUNK_ERROR)).toBe(true);
    expect(isChunkLoadError(new Error('Loading chunk 5 failed'))).toBe(true);
    expect(isChunkLoadError(new Error('Cannot read properties of undefined'))).toBe(false);
    expect(isChunkLoadError('not an error')).toBe(false);
  });

  it('reloads once per session and refuses a second time', () => {
    expect(reloadOnceForStaleAssets()).toBe(true);
    expect(reloadSpy).toHaveBeenCalledOnce();
    expect(reloadOnceForStaleAssets()).toBe(false);
    expect(reloadSpy).toHaveBeenCalledOnce();
  });

  it('re-arms after a successful import clears the flag', () => {
    reloadOnceForStaleAssets();
    clearStaleAssetReloadFlag();
    expect(reloadOnceForStaleAssets()).toBe(true);
  });

  it('recovers from vite preload errors once, and ignores non-chunk payloads', () => {
    installVitePreloadErrorHandler();
    dispatchPreloadError(CHUNK_ERROR);
    expect(reloadSpy).toHaveBeenCalledOnce();

    // Already recovered this session: further preload errors surface instead.
    dispatchPreloadError(CHUNK_ERROR);
    expect(reloadSpy).toHaveBeenCalledOnce();

    dispatchPreloadError(new Error('network offline'));
    expect(reloadSpy).toHaveBeenCalledOnce();
  });
});

function dispatchPreloadError(payload: unknown) {
  const event = new Event('vite:preloadError', { cancelable: true });
  (event as Event & { payload?: unknown }).payload = payload;
  window.dispatchEvent(event);
}
