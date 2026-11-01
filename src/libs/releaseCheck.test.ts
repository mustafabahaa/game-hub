// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { startReleaseCheck } from './releaseCheck';

function htmlWithBuildId(id: string) {
  return `<!doctype html><html><head><meta name="build-id" content="${id}" /></head><body></body></html>`;
}

function stubFetch(html: string) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve({ ok: true, text: () => Promise.resolve(html) })),
  );
}

describe('startReleaseCheck', () => {
  beforeEach(() => {
    vi.stubGlobal('__BUILD_ID__', 'v1');
    document.documentElement.setAttribute('data-build', 'test');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reports an update when the deployed build id differs', async () => {
    stubFetch(htmlWithBuildId('v2'));
    const onUpdate = vi.fn();
    startReleaseCheck(onUpdate);

    document.dispatchEvent(new Event('visibilitychange'));
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledOnce());
  });

  it('stays silent when the deployment matches the running build', async () => {
    stubFetch(htmlWithBuildId('v1'));
    const onUpdate = vi.fn();
    startReleaseCheck(onUpdate);

    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('treats network failures as offline, not a release', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))));
    const onUpdate = vi.fn();
    startReleaseCheck(onUpdate);

    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('stops checking after the returned cleanup runs', async () => {
    stubFetch(htmlWithBuildId('v2'));
    const onUpdate = vi.fn();
    const stop = startReleaseCheck(onUpdate);
    stop();

    document.dispatchEvent(new Event('visibilitychange'));
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(onUpdate).not.toHaveBeenCalled();
  });
});
