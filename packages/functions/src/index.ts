import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
export { gamehubMcpAuth } from './mcp/oauth.js';
export {
  getGamehubAiConnection,
  startGamehubAiConnection,
  cancelGamehubAiConnection,
  disconnectGamehubAiConnection,
  resolveGamehubAiToolApproval,
  streamGamehubAiReply,
} from './aiConnection.js';
import { GamehubOAuthProvider } from './mcp/oauthProvider.js';
import { createGamehubTools } from './gamehubTools.js';

initializeApp();
const db = getFirestore();
const TOKEN_COLLECTION = 'mcpTokens';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000;
type TokenScope = 'read' | 'write';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function requireUid(request: { auth?: { uid: string } | null }): string {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in to manage MCP credentials.');
  return request.auth.uid;
}

export const createGamehubMcpToken = onCall(async (request) => {
  const uid = requireUid(request);
  const scope: TokenScope = request.data?.scope === 'write' ? 'write' : 'read';
  const id = randomUUID();
  const token = `gh_${randomBytes(32).toString('base64url')}`;
  await db.doc(`users/${uid}/${TOKEN_COLLECTION}/${id}`).set({
    keyHash: hashToken(token),
    scope,
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + TOKEN_TTL_MS,
  });
  // The raw credential is returned once and is never persisted.
  return { id, token, scope };
});

export const listGamehubMcpTokens = onCall(async (request) => {
  const uid = requireUid(request);
  const snapshot = await db.collection(`users/${uid}/${TOKEN_COLLECTION}`).get();
  return { tokens: snapshot.docs.map((doc) => ({ id: doc.id, scope: doc.get('scope'), createdAt: doc.get('createdAt'), expiresAt: doc.get('expiresAt') })) };
});

export const revokeGamehubMcpToken = onCall(async (request) => {
  const uid = requireUid(request);
  const id = request.data?.id;
  if (typeof id !== 'string' || !id) throw new HttpsError('invalid-argument', 'A token id is required.');
  await db.doc(`users/${uid}/${TOKEN_COLLECTION}/${id}`).delete();
  return { revoked: true };
});

type McpIdentity = { uid: string; scope: TokenScope };
const oauthProvider = new GamehubOAuthProvider();
async function authenticate(req: { headers: Record<string, string | string[] | undefined> }): Promise<McpIdentity | null> {
  const header = req.headers.authorization;
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (token.startsWith('gamehub_')) {
    try {
      const auth = await oauthProvider.verifyAccessToken(token);
      const uid = auth.extra?.userId;
      if (typeof uid !== 'string') return null;
      return { uid, scope: auth.scopes.includes('gamehub:write') ? 'write' : 'read' };
    } catch {
      return null;
    }
  }
  if (!token.startsWith('gh_')) return null;
  const matches = await db.collectionGroup(TOKEN_COLLECTION).where('keyHash', '==', hashToken(token)).limit(1).get();
  if (matches.empty) return null;
  const record = matches.docs[0];
  // Derive identity from the user's Firestore path instead of trusting fields
  // in the record: owner-only client writes must not let one user mint access
  // to another user's data by forging a userId field.
  const path = record.ref.path.split('/');
  const userId = path.length === 4 && path[0] === 'users' && path[2] === TOKEN_COLLECTION ? path[1] : null;
  const scope = record.get('scope');
  const expiresAt = record.get('expiresAt');
  if (typeof userId !== 'string' || (scope !== 'read' && scope !== 'write') || typeof expiresAt !== 'number' || expiresAt <= Date.now()) return null;
  try {
    if ((await getAuth().getUser(userId)).disabled) return null;
  } catch {
    return null;
  }
  return { uid: userId, scope };
}

function makeServer(identity: McpIdentity) {
  const server = new McpServer({ name: 'gamehub', version: '1.0.0' });
  const canWrite = identity.scope === 'write';
  const tools = createGamehubTools(identity.uid, db);
  const registerDynamicTool = server.registerTool.bind(server) as unknown as (
    name: string,
    config: {
      description: string;
      _meta: { securitySchemes: Array<{ type: 'oauth2'; scopes: string[] }> };
      inputSchema: Record<string, unknown>;
      annotations: { readOnlyHint: boolean; destructiveHint: boolean; idempotentHint: boolean; openWorldHint: boolean };
    },
    handler: (input: Record<string, unknown>) => Promise<{ content: [{ type: 'text'; text: string }]; isError?: boolean }>,
  ) => void;
  for (const [name, definition] of Object.entries(tools)) {
    const isRead = definition.access === 'read';
    if (!isRead && !canWrite) continue;
    registerDynamicTool(
      name,
      {
        description: definition.description,
        _meta: { securitySchemes: [{ type: 'oauth2', scopes: isRead ? ['gamehub:read'] : ['gamehub:read', 'gamehub:write'] }] },
        inputSchema: definition.inputSchema.shape as Record<string, unknown>,
        annotations: { readOnlyHint: isRead, destructiveHint: !isRead, idempotentHint: isRead, openWorldHint: true },
      },
      async (input: Record<string, unknown>) => {
        try {
          const parsed = definition.inputSchema.safeParse(input);
          if (!parsed.success) {
            return { content: [{ type: 'text', text: 'Invalid tool input.' }], isError: true };
          }
          const result = await definition.execute(parsed.data);
          return { content: [{ type: 'text', text: JSON.stringify(result ?? { ok: true }) }] };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'The tool could not complete.';
          return { content: [{ type: 'text', text: message }], isError: true };
        }
      },
    );
  }
  return server;
}

export const gamehubMcp = onRequest({ cors: false }, async (req, res) => {
  if (req.method !== 'POST') { res.set('Allow', 'POST').status(405).send('Method Not Allowed'); return; }
  let identity: McpIdentity | null;
  try { identity = await authenticate(req); } catch { res.status(503).send('Authentication service unavailable'); return; }
  if (!identity) { res.status(401).set('WWW-Authenticate', 'Bearer').send('Unauthorized'); return; }
  const server = makeServer(identity);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on('close', () => { void transport.close(); void server.close(); });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch {
    if (!res.headersSent) res.status(500).send('MCP request failed');
  }
});
