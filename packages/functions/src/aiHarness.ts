import { HttpsError } from 'firebase-functions/v2/https';
import { runCodexHarness } from '@monochrome-ai/core';
import { withProviderCredential } from './aiCredentialStore.js';

export type ClientTool = { name: string; description: string; schema: object };
export type HarnessRequest = {
  system: string;
  prompt: string | { role: 'user'; content: Array<{ type: 'text'; text: string } | { type: 'image'; image: string }> };
  tools?: ClientTool[];
  signal?: AbortSignal;
  onText?: (text: string) => Promise<void>;
  onTool?: (call: { id: string; name: string; input: unknown }, signal: AbortSignal) => Promise<{ result?: unknown; error?: boolean }>;
};

export async function runHarness(uid: string, request: HarnessRequest): Promise<string> {
  return withProviderCredential(uid, 'codex', async (credential, save) => {
    if (!credential) throw new HttpsError('failed-precondition', 'Connect your ChatGPT Codex account in GameHub settings first.');
    try {
      return await runCodexHarness({
        credential: credential as Record<string, unknown>,
        saveCredential: (value) => save(value as typeof credential),
        model: process.env.GAMEHUB_CODEX_MODEL || 'gpt-6-luna',
        system: request.system,
        prompt: typeof request.prompt === 'string' ? request.prompt : [request.prompt],
        tools: request.tools ?? [],
        toolPolicy: { activeTools: (request.tools ?? []).map((tool) => tool.name) },
        signal: request.signal,
        onText: request.onText,
        onTool: request.onTool,
      });
    } catch (error) {
      if (request.signal?.aborted) throw new HttpsError('cancelled', 'Request cancelled');
      if (error instanceof Error && /empty response/i.test(error.message))
        throw new HttpsError('unavailable', 'The GameHub assistant returned an empty response. Try again.');
      throw classifyHarnessError(error);
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
