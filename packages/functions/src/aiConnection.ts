import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { createRequire } from 'node:module';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { z } from 'zod';
import { runHarness, type ClientTool } from './aiHarness.js';
import { createGamehubTools } from './gamehubTools.js';
import { requireOwner } from './ownerAuth.js';
import {
  disconnectProviderCredential, gamehubAiEncryptionKey, hasProviderCredential, vercelSandboxToken, withProviderCredential,
} from './aiCredentialStore.js';

type ProviderRequest = { provider?: string };
const provider = (value: string | undefined): 'codex' => {
  if (value && value !== 'codex') throw new HttpsError('invalid-argument', 'Unsupported AI provider');
  return 'codex';
};
function userId(request: { auth?: { uid?: string } }) {
  return requireOwner(request);
}
const runtimeRequire = createRequire(import.meta.url);

function waitForToolApproval(reference: FirebaseFirestore.DocumentReference, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let unsubscribe = () => {};
    const timeout = setTimeout(() => finish(false), 90_000);
    const abort = () => finish(undefined, new HttpsError('cancelled', 'Assistant request cancelled'));
    const finish = (approved?: boolean, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe();
      signal.removeEventListener('abort', abort);
      if (error) reject(error);
      else resolve(approved === true);
    };
    signal.addEventListener('abort', abort, { once: true });
    if (signal.aborted) { abort(); return; }
    unsubscribe = reference.onSnapshot((snapshot) => {
      const data = snapshot.data();
      if (!data || data.expiresAt <= Date.now() || data.state === 'denied' || data.state === 'expired') finish(false);
      else if (data.state === 'approved') finish(true);
    }, (error) => finish(undefined, error));
  });
}

async function runDeviceLogin(home: string, signal: AbortSignal, onDevice: (url: string, code: string) => Promise<void>) {
  signal.throwIfAborted();
  const binary = process.env.GAMEHUB_CODEX_BIN || join(dirname(runtimeRequire.resolve('@openai/codex/package.json')), 'bin', 'codex.js');
  const child = spawn(process.execPath, [binary, 'login', '--device-auth', '-c', 'cli_auth_credentials_store="file"'], {
    env: { PATH: process.env.PATH ?? '/usr/bin:/bin', LANG: 'C.UTF-8', HOME: home, CODEX_HOME: home },
    stdio: ['ignore', 'pipe', 'pipe'], detached: true,
  });
  let output = '';
  let sent = false;
  let deviceMessage: Promise<void> | undefined;
  const consume = (chunk: Buffer) => {
    output += chunk.toString().replace(/\u001b\[[0-9;]*m/g, '');
    if (output.length > 32_000) output = output.slice(-32_000);
    if (!sent) {
      const url = output.match(/https:\/\/(?:auth\.openai\.com|chatgpt\.com)\/codex\/device/)?.[0];
      const code = output.match(/\b[A-Z0-9]{4,8}(?:-[A-Z0-9]{4,8}){1,2}\b/)?.[0];
      if (url && code) {
        sent = true;
        deviceMessage = onDevice(url, code);
        void deviceMessage.catch(() => child.kill('SIGTERM'));
      }
    }
  };
  child.stdout.on('data', consume);
  child.stderr.on('data', consume);
  const abort = () => { try { if (child.pid) process.kill(-child.pid, 'SIGTERM'); } catch { child.kill('SIGTERM'); } };
  signal.addEventListener('abort', abort, { once: true });
  try {
    const result = await new Promise<{ code: number | null }>((resolve, reject) => {
      child.once('error', reject);
      child.once('close', (code) => resolve({ code }));
    });
    if (signal.aborted) throw new HttpsError('cancelled', 'Connection cancelled');
    if (result.code !== 0) throw new HttpsError('failed-precondition', 'Codex login failed');
    if (deviceMessage) await deviceMessage;
  } finally { signal.removeEventListener('abort', abort); }
}

async function readAuth(home: string) {
  for (const filename of ['auth.json', 'credentials.json']) {
    try {
      const path = join(home, filename);
      await fs.chmod(path, 0o600);
      return JSON.parse(await fs.readFile(path, 'utf8')) as Record<string, unknown>;
    } catch { /* try next */ }
  }
  throw new HttpsError('failed-precondition', 'Codex login completed without credentials');
}

export const getGamehubAiConnection = onCall({ secrets: [gamehubAiEncryptionKey] }, async (request) => {
  const uid = userId(request);
  const selected = provider((request.data as ProviderRequest | undefined)?.provider);
  return { provider: selected, connected: await hasProviderCredential(uid, selected) };
});

export const startGamehubAiConnection = onCall(
  { secrets: [gamehubAiEncryptionKey], timeoutSeconds: 600, memory: '512MiB', concurrency: 1, maxInstances: 2 },
  async (request, response) => {
    const uid = userId(request);
    const selected = provider((request.data as ProviderRequest | undefined)?.provider);
    if (!request.acceptsStreaming || !response) throw new HttpsError('failed-precondition', 'Streaming is required for device login');
    if (!request.auth?.token.email_verified) throw new HttpsError('permission-denied', 'Verify your email before connecting AI.');
    const home = await fs.mkdtemp(join(tmpdir(), 'gamehub-codex-'));
    await fs.chmod(home, 0o700);
    const attemptId = randomUUID();
    const attempt = getFirestore().collection('gamehubAiLoginAttempts').doc(attemptId);
    await attempt.create({ uid, cancel: false, expiresAt: Date.now() + 600_000 });
    const controller = new AbortController();
    const abort = () => controller.abort();
    response.signal.addEventListener('abort', abort, { once: true });
    if (response.signal.aborted) controller.abort();
    const unsubscribe = attempt.onSnapshot((snapshot) => { if (snapshot.data()?.cancel === true) controller.abort(); }, () => controller.abort());
    try {
      await runDeviceLogin(home, controller.signal, async (verificationUrl, code) => {
        if (!controller.signal.aborted) await response.sendChunk({ type: 'device', verificationUrl, code, attemptId });
      });
      const credential = await readAuth(home);
      await withProviderCredential(uid, selected, async (_existing, save) => { await save(credential); });
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      throw new HttpsError('internal', 'Unable to connect Codex');
    } finally {
      response.signal.removeEventListener('abort', abort);
      unsubscribe();
      await attempt.delete().catch(() => undefined);
      await fs.rm(home, { recursive: true, force: true }).catch(() => undefined);
    }
    await response.sendChunk({ type: 'connected', provider: selected, connected: true });
    return { type: 'connected', provider: selected, connected: true };
  },
);

export const cancelGamehubAiConnection = onCall(async (request) => {
  const uid = userId(request);
  const attemptId = request.data?.attemptId;
  if (typeof attemptId !== 'string' || !/^[0-9a-f-]{36}$/.test(attemptId)) throw new HttpsError('invalid-argument', 'Invalid connection attempt');
  const ref = getFirestore().collection('gamehubAiLoginAttempts').doc(attemptId);
  await getFirestore().runTransaction(async (tx) => {
    const data = (await tx.get(ref)).data();
    if (!data || data.uid !== uid) throw new HttpsError('not-found', 'Connection attempt not found');
    tx.update(ref, { cancel: true });
  });
  return { cancelled: true };
});

export const disconnectGamehubAiConnection = onCall({ secrets: [gamehubAiEncryptionKey] }, async (request) => {
  const uid = userId(request);
  const selected = provider((request.data as ProviderRequest | undefined)?.provider);
  try { await disconnectProviderCredential(uid, selected); }
  catch (error) { if (error instanceof HttpsError) throw error; throw new HttpsError('aborted', 'AI provider is busy'); }
  return { provider: selected, connected: false };
});

export const resolveGamehubAiToolApproval = onCall(async (request) => {
  const uid = userId(request);
  const approvalId = request.data?.approvalId;
  const decision = request.data?.decision;
  if (typeof approvalId !== 'string' || !/^[0-9a-f-]{36}$/.test(approvalId) || !['approved', 'denied'].includes(decision)) {
    throw new HttpsError('invalid-argument', 'Invalid assistant action approval.');
  }
  const ref = getFirestore().collection('gamehubAiToolApprovals').doc(approvalId);
  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);
    if (!snapshot.exists || snapshot.get('uid') !== uid || snapshot.get('state') !== 'pending' || snapshot.get('expiresAt') <= Date.now()) {
      throw new HttpsError('not-found', 'This assistant action is no longer waiting for approval.');
    }
    transaction.update(ref, { state: decision, decidedAt: new Date().toISOString() });
  });
  return { resolved: true };
});

export const streamGamehubAiReply = onCall(
  { secrets: [gamehubAiEncryptionKey, vercelSandboxToken], timeoutSeconds: 240, memory: '1GiB', maxInstances: 5 },
  async (request, response) => {
    const uid = userId(request);
    const message = request.data?.message;
    if (typeof message !== 'string' || !message.trim() || message.length > 4_000)
      throw new HttpsError('invalid-argument', 'Send a message up to 4,000 characters.');
    if (!request.acceptsStreaming || !response) throw new HttpsError('failed-precondition', 'Streaming is required for Codex replies.');
    const db = getFirestore();
    const registry = createGamehubTools(uid, db);
    const replyTools: ClientTool[] = Object.entries(registry).map(([name, definition]) => ({
      name,
      description: definition.description,
      // Zod refinements remain enforced server-side; expose their structural
      // object shape to the Codex tool schema, then validate every call below.
      schema: z.toJSONSchema(definition.inputSchema, { target: 'draft-07', unrepresentable: 'any' }),
    }));
    const system = [
      'You are the GameHub assistant. Help the signed-in user organize their game accounts, library, and providers.',
      'Use GameHub tools when relevant. They expose only the signed-in user’s private accounts, games, and saved providers. They never return or accept password or OTP secret values.',
      'For delete tools, pass confirm: true only to request the GameHub confirmation prompt; this field alone never approves the action. The server waits for the user to approve every change in GameHub. Do not say a change is complete until the server returns success.',
      'Keep answers clear and concise.',
    ].join(' ');
    try {
      await runHarness(uid, {
        system,
        prompt: message.trim(),
        tools: replyTools,
        signal: response.signal,
        onText: async (text) => { await response.sendChunk({ type: 'text', text }); },
        onTool: async ({ name, input }, signal) => {
          signal.throwIfAborted();
          const definition = registry[name];
          if (!definition) return { result: { error: 'Unknown tool.' } };
          const parsed = definition.inputSchema.safeParse(input);
          if (!parsed.success) return { result: { error: 'Invalid tool input.' } };
          try {
            if (definition.access !== 'read') {
              const approvalId = randomUUID();
              const approvalRef = db.collection('gamehubAiToolApprovals').doc(approvalId);
              await approvalRef.create({ uid, toolName: name, state: 'pending', expiresAt: Date.now() + 90_000 });
              try {
                await response.sendChunk({ type: 'approval', approvalId, toolName: name, description: definition.description, input: parsed.data });
                const approved = await waitForToolApproval(approvalRef, signal);
                if (!approved) return { result: { approved: false, message: 'The user declined this action. No changes were made.' } };
              } finally {
                await approvalRef.delete().catch(() => undefined);
              }
            }
            return { result: await definition.execute(parsed.data) };
          } catch (error) {
            if (signal.aborted) throw error;
            const message = error instanceof Error ? error.message : 'The tool could not complete.';
            return { result: { error: message } };
          }
        },
      });
      await response.sendChunk({ type: 'done' });
      return { done: true };
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      console.error('gamehub:codex:reply', error instanceof Error ? error.message : error);
      throw new HttpsError('unavailable', 'The GameHub assistant could not answer right now.');
    }
  },
);
