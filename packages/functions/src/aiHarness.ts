import { fork } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { HttpsError } from 'firebase-functions/v2/https';
import { withProviderCredential, type ProviderCredential } from './aiCredentialStore.js';

export type ClientTool = { name: string; description: string; schema: object };
export type HarnessRequest = {
  system: string;
  prompt: string | { role: 'user'; content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> };
  tools?: ClientTool[];
  signal?: AbortSignal;
  onText?: (text: string) => Promise<void>;
  onTool?: (call: { id: string; name: string; input: unknown }, signal: AbortSignal) => Promise<{ result?: unknown; error?: boolean }>;
};

const sourceDir = dirname(fileURLToPath(import.meta.url));
const runnerPath = join(sourceDir, '../harness-runtime/runner.mjs');

export async function runHarness(uid: string, request: HarnessRequest): Promise<string> {
  return withProviderCredential(uid, 'codex', async (credential, save) => {
    if (!credential) throw new HttpsError('failed-precondition', 'Connect your ChatGPT Codex account in GameHub settings first.');
    request.signal?.throwIfAborted();
    const lifetime = new AbortController();
    const signal = request.signal ? AbortSignal.any([lifetime.signal, request.signal]) : lifetime.signal;
    const home = await mkdtemp(join(tmpdir(), 'gamehub-ai-auth-'));
    await (await import('node:fs/promises')).chmod(home, 0o700);
    const authPath = join(home, 'auth.json');
    let child: ReturnType<typeof fork> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let queue = Promise.resolve();
    let output = '';
    let completed = false;
    let failure: unknown;
    let toolCallCount = 0;
    const stop = () => { child?.kill('SIGTERM'); };
    try {
      await writeFile(authPath, JSON.stringify(credential), { mode: 0o600 });
      child = fork(runnerPath, [], {
        env: {
          PATH: process.env.PATH ?? '/usr/bin:/bin',
          LANG: 'C.UTF-8',
          HOME: home,
          CODEX_HOME: home,
        },
        stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
      });
      const worker = child;
      const exit = new Promise<number | null>((resolve, reject) => { worker.once('error', reject); worker.once('exit', resolve); });
      signal.addEventListener('abort', stop, { once: true });
      timer = setTimeout(() => { failure = new Error('AI request timed out'); lifetime.abort(); }, 210_000);
      child.on('message', (message: { type?: string; text?: string; message?: string; id?: string; name?: string; input?: unknown }) => {
        queue = queue.then(async () => {
          if (message.type === 'text' && typeof message.text === 'string') {
            output += message.text;
            if (output.length > 200_000) throw new Error('AI response too large');
            await request.onText?.(message.text);
          }
          if (message.type === 'error') failure = new Error(message.message || 'Harness failed');
          if (message.type === 'done') completed = true;
          if (message.type === 'tool-call') {
            toolCallCount += 1;
            if (toolCallCount > 12) throw new Error('AI tool-call limit reached for this turn');
            if (!message.id || !message.name || !request.tools?.some((tool) => tool.name === message.name) || !request.onTool)
              throw new Error('Unknown AI tool');
            const result = await request.onTool({ id: message.id, name: message.name, input: message.input }, signal);
            if (worker.connected) worker.send({ type: 'tool-result', id: message.id, ...result });
          }
        }).catch((error) => { failure = error; stop(); });
      });
      request.signal?.throwIfAborted();
      child.send({ type: 'start', model: process.env.GAMEHUB_CODEX_MODEL || 'gpt-6-luna', system: request.system, prompt: request.prompt, tools: request.tools ?? [] });
      const code = await exit;
      lifetime.abort();
      await queue;
      if (request.signal?.aborted) throw new HttpsError('cancelled', 'Request cancelled');
      if (failure || !completed || code !== 0) throw classifyHarnessError(failure);
      if (!output.trim()) throw new HttpsError('unavailable', 'The GameHub assistant returned an empty response. Try again.');
      return output;
    } finally {
      clearTimeout(timer);
      signal.removeEventListener('abort', stop);
      lifetime.abort();
      stop();
      try {
        // Codex may rotate credentials even if the model request failed.
        await (await import('node:fs/promises')).chmod(authPath, 0o600);
        await save(JSON.parse(await readFile(authPath, 'utf8')) as ProviderCredential);
      } finally { await rm(home, { recursive: true, force: true }); }
    }
  });
}

export function classifyHarnessError(error: unknown): HttpsError {
  if (error instanceof HttpsError) return error;
  const text = error instanceof Error ? error.message : String(error);
  if (/usage limit|purchase more credits|rate.?limit|resource.?exhausted|\b429\b/i.test(text))
    return new HttpsError('resource-exhausted', 'Your ChatGPT Codex usage limit has been reached. Try again after it resets.', providerRetryDetails(error));
  if (/\b401\b|\b403\b|unauthorized|forbidden|refresh.?token|token.*expired/i.test(text))
    return new HttpsError('failed-precondition', 'Reconnect ChatGPT Codex in GameHub settings and try again.');
  return new HttpsError('unavailable', 'The GameHub assistant could not complete this request. Please try again.');
}

function providerRetryDetails(error: unknown): { retryAfterMs?: number; resetAt?: string; source: string } {
  const node = error as { message?: unknown; responseBody?: unknown } | undefined;
  const values = [node?.message, node?.responseBody].filter((value): value is string => typeof value === 'string');
  const parsed = values.flatMap((value) => { try { const json = JSON.parse(value); return [json, json?.error, json?.details]; } catch { return []; } });
  const raw = values.join(' ');
  const seconds = /(?:retry(?:-after|\s+in)?|try again in)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*s/i.exec(raw)?.[1];
  const reset = parsed.map((item) => item?.resetAt ?? item?.reset_at ?? item?.headers?.['retry-after']).find(Boolean);
  const numeric = typeof reset === 'number' ? reset : typeof reset === 'string' && /^\d+(?:\.\d+)?$/.test(reset) ? Number(reset) : undefined;
  const resetAt = numeric && numeric > 1_000_000_000 ? new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric).toISOString() : undefined;
  const retryAfterMs = seconds ? Math.ceil(Number(seconds) * 1000) : numeric && numeric <= 1_000_000_000 ? numeric * 1000 : undefined;
  return { ...(retryAfterMs ? { retryAfterMs } : {}), ...(resetAt ? { resetAt } : {}), source: 'provider' };
}
