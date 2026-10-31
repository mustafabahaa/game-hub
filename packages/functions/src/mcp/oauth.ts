import express from 'express';
import { randomBytes } from 'node:crypto';
import { getAuth } from 'firebase-admin/auth';
import { onRequest } from 'firebase-functions/v2/https';
import { mcpAuthRouter } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { z } from 'zod';
import { GamehubOAuthProvider, hash, publicUrl, resourceUrl } from './oauthProvider.js';
import { getFirestore } from 'firebase-admin/firestore';
import { getApps, initializeApp } from 'firebase-admin/app';
if (!getApps().length) initializeApp();
const getDb = () => getFirestore();

const consentInput = z
  .object({
    requestId: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    decision: z.enum(['approve', 'deny']),
  })
  .strict();

type PendingAuthorization = {
  clientId: string;
  clientName: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  resource: string;
  scopes: string[];
  expiresAt: number;
  used: boolean;
};

export function createOAuthApp() {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'POST' && req.path === '/mcp-auth/consent' && req.headers.origin !== publicUrl()) {
      res.status(403).json({ error: 'forbidden_origin', message: 'Open the consent page from GameHub.' });
      return;
    }
    next();
  });
  app.use(express.json({ limit: '8kb' }));
  app.get('/mcp-auth/consent', async (req, res) => {
    const requestId = z
      .string()
      .regex(/^[A-Za-z0-9_-]{43}$/)
      .safeParse(req.query.request);
    if (!requestId.success) {
      res.status(400).json({ error: 'invalid_request', message: 'Invalid connection request.' });
      return;
    }
    try {
      const snapshot = await getDb().collection('gamehubMcpOAuthRequests').doc(hash(requestId.data)).get();
      const pending = snapshot.data() as PendingAuthorization | undefined;
      if (!pending || pending.used || pending.expiresAt <= Date.now()) {
        res.status(400).json({
          error: 'invalid_request',
          message: 'This connection request has expired. Start again in your client.',
        });
        return;
      }
      res.json({
        clientName: pending.clientName || 'MCP client',
        redirectUri: pending.redirectUri,
        scopes: pending.scopes,
        expiresAt: pending.expiresAt,
      });
    } catch {
      res.status(500).json({ error: 'server_error', message: 'Could not load the connection request.' });
    }
  });
  app.post('/mcp-auth/consent', async (req, res) => {
    const input = consentInput.safeParse(req.body);
    if (!input.success) {
      res.status(400).json({ error: 'invalid_request', message: 'Invalid consent request.' });
      return;
    }
    const bearer = /^Bearer (\S+)$/.exec(req.headers.authorization ?? '')?.[1];
    if (!bearer) {
      res.status(401).json({ error: 'unauthorized', message: 'Sign in to GameHub to continue.' });
      return;
    }
    let uid: string;
    try {
      // Initialize the default Admin app before getAuth() resolves its instance.
      getDb();
      uid = (await getAuth().verifyIdToken(bearer, true)).uid;
    } catch {
      res.status(401).json({ error: 'unauthorized', message: 'Sign in to GameHub again to continue.' });
      return;
    }
    const { requestId, decision } = input.data;
    const db = getDb();
    const requestRef = db.collection('gamehubMcpOAuthRequests').doc(hash(requestId));
    const code = randomBytes(32).toString('base64url');
    try {
      const redirectUrl = await db.runTransaction(async (transaction) => {
        const request = (await transaction.get(requestRef)).data() as PendingAuthorization | undefined;
        if (!request || request.used || request.expiresAt <= Date.now() || request.resource !== resourceUrl()) {
          throw new Error('invalid_request');
        }
        const redirect = new URL(request.redirectUri);
        if (request.state) redirect.searchParams.set('state', request.state);
        transaction.update(requestRef, { used: true });
        if (decision === 'deny') {
          redirect.searchParams.set('error', 'access_denied');
        } else {
          transaction.create(db.collection('gamehubMcpOAuthCodes').doc(hash(code)), {
            userId: uid,
            clientId: request.clientId,
            redirectUri: request.redirectUri,
            codeChallenge: request.codeChallenge,
            resource: request.resource,
            scopes: request.scopes,
            expiresAt: Date.now() + 60_000,
            used: false,
          });
          redirect.searchParams.set('code', code);
        }
        return redirect.href;
      });
      res.json({ redirectUrl });
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      res.status(message === 'invalid_request' ? 400 : 500).json({
        error: 'invalid_request',
        message: 'This request could not be completed. Start the connection again.',
      });
    }
  });
  app.use(
    mcpAuthRouter({
      provider: new GamehubOAuthProvider(),
      issuerUrl: new URL(publicUrl()),
      resourceServerUrl: new URL(resourceUrl()),
      scopesSupported: ['gamehub:read', 'gamehub:write', 'offline_access'],
      resourceName: 'GameHub',
    }),
  );
  app.use((req, res) => res.status(404).json({ error: 'not_found', path: req.path }));
  return app;
}

let oauthApp: ReturnType<typeof createOAuthApp> | undefined;
export const gamehubMcpAuth = onRequest(
  { invoker: 'public', cors: false, timeoutSeconds: 60, memory: '256MiB' },
  (req, res) => {
    oauthApp ??= createOAuthApp();
    oauthApp(req, res);
  },
);
