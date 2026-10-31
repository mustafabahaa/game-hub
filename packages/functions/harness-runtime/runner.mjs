// A separate process gives every request its own CODEX_HOME, avoiding global
// environment races between concurrently executing Cloud Function requests.
import { createServer } from 'node:net';
import { randomUUID } from 'node:crypto';
import { HarnessAgent } from '@ai-sdk/harness/agent';
import { createCodex } from '@ai-sdk/harness-codex';
import { createVercelNetworkSandboxSession } from '@ai-sdk/sandbox-vercel';
import { jsonSchema } from 'ai';
const pending = new Map();
let started = false;
let activeSandbox;
let activeSession;
let stopping = false;

process.on('SIGTERM', () => {
  if (stopping) return;
  stopping = true;
  void (async () => {
    await activeSession?.destroy?.().catch(() => {});
    await activeSandbox?.destroy?.().catch(() => {});
    process.exit(1);
  })();
});

process.on('message', async (message) => {
  if (message?.type === 'tool-result') {
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      message.error ? waiter.reject(new Error('Client tool failed')) : waiter.resolve(message.result);
    }
    return;
  }
  if (message?.type !== 'start' || started) return;
  started = true;
  let sandbox;
  let session;
  let stage = 'bootstrap';
  try {
    const port = await freePort();
    sandbox = await createVercelNetworkSandboxSession({
      token: process.env.VERCEL_API_TOKEN,
      teamId: process.env.VERCEL_SANDBOX_TEAM_ID,
      projectId: process.env.VERCEL_SANDBOX_PROJECT_ID,
      runtime: 'node24',
      ports: [port],
      timeout: 4 * 60 * 1000,
      networkPolicy: {
        allow: ['auth.openai.com', 'chatgpt.com', 'registry.npmjs.org', 'registry.npmjs.com'],
      },
    });
    activeSandbox = sandbox;
    stage = 'agent';
    const harness = createCodex({
      auth: 'direct',
      startupTimeoutMs: 45000,
      reasoningEffort: 'medium',
      codexConfig: { cli_auth_credentials_store: 'file' },
    });
    const tools = Object.fromEntries(
      message.tools.map((definition) => [
        definition.name,
        {
          description: definition.description,
          inputSchema: jsonSchema(definition.schema),
          execute: (input) =>
            new Promise((resolve, reject) => {
              const id = randomUUID();
              pending.set(id, { resolve, reject });
              process.send?.({ type: 'tool-call', id, name: definition.name, input });
            }),
        },
      ]),
    );
    const agent = new HarnessAgent({
      harness,
      model: message.model,
      permissionMode: 'allow-all',
      activeTools: Object.keys(tools),
      instructions: message.system,
      tools,
    });
    stage = 'session';
    session = await agent.createSession({ sandboxSession: sandbox, abortSignal: AbortSignal.timeout(120000) });
    activeSession = session;
    stage = 'stream';
    const result = await agent.stream({
      session,
      prompt: typeof message.prompt === 'string' ? message.prompt : [message.prompt],
      abortSignal: AbortSignal.timeout(180000),
    });
    for await (const part of result.stream) {
      if (part.type === 'text-delta') process.send?.({ type: 'text', text: part.text });
      if (part.type === 'error') throw part.error;
      if (part.type === 'tool-error') throw part.error;
    }
    process.send?.({ type: 'done' });
  } catch (error) {
    process.send?.({
      type: 'error',
      stage,
      name: error?.name ?? 'Error',
      code: error?.code,
      message: String(error?.message ?? error ?? 'Unknown harness error').slice(0, 400),
    });
  } finally {
    for (const waiter of pending.values()) waiter.reject(new Error('Request ended'));
    await session?.destroy?.().catch(() => {});
    await sandbox?.destroy?.().catch(() => {});
    process.disconnect?.();
  }
});

function freePort() {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}
