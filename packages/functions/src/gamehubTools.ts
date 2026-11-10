import { randomUUID } from 'node:crypto';
import { FieldPath, type Firestore } from 'firebase-admin/firestore';
import { z } from 'zod';

type ToolAccess = 'read' | 'write' | 'delete';
type ToolInput = Record<string, any>;

export type GamehubToolDefinition = {
  description: string;
  inputSchema: z.ZodObject<any>;
  access: ToolAccess;
  requiresConfirmation?: boolean;
  execute: (input: ToolInput) => Promise<unknown>;
};

const platforms = z.enum(['PlayStation', 'Xbox', 'PC']);
const accountTypes = z.enum(['Primary', 'Secondary', 'Full']).nullable();
const lifecycleTypes = z.enum(['lifetime', 'expires_on']);
const httpsUrl = z.string().url().refine((value) => new URL(value).protocol === 'https:', 'Use an HTTPS URL.');
const confirmed = z.literal(true).describe('Must be true only after the user explicitly confirmed this exact action.');
const safeAccount = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  accountName: data.accountName ?? '',
  email: data.email ?? '',
  notes: data.notes ?? null,
  platform: data.platform ?? null,
  accountType: data.accountType ?? null,
  providerId: data.providerId ?? null,
  isPsPlus: Boolean(data.isPsPlus),
  lifecycleType: data.lifecycleType ?? 'lifetime',
  expiresOn: data.expiresOn ?? null,
  hasPassword: Boolean(data.password),
  hasOtpSecret: Boolean(data.otpSecret),
  createdAt: data.createdAt ?? null,
  updatedAt: data.updatedAt ?? null,
});
const safeGame = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  accountId: data.accountId ?? null,
  title: data.title ?? '',
  providerId: data.providerId ?? null,
  notes: data.notes ?? null,
  imageUrl: data.imageUrl ?? null,
  createdAt: data.createdAt ?? null,
});
const safeProvider = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  userId: data.userId ?? null,
  name: data.name ?? '',
  website: data.website ?? null,
  whatsapp: data.whatsapp ?? null,
  facebook: data.facebook ?? null,
  instagram: data.instagram ?? null,
  notes: data.notes ?? null,
  photoUrl: data.photoUrl ?? null,
  createdAt: data.createdAt ?? null,
  updatedAt: data.updatedAt ?? null,
});
function define(
  description: string,
  inputSchema: z.ZodObject<any>,
  access: ToolAccess,
  execute: GamehubToolDefinition['execute'],
  requiresConfirmation = false,
): GamehubToolDefinition {
  return { description, inputSchema, access, execute, ...(requiresConfirmation ? { requiresConfirmation: true } : {}) };
}

/**
 * One server-side GameHub tool registry shared by MCP and the in-app assistant.
 * Private records are always scoped to `uid`. Account passwords and OTP
 * values are never returned or accepted by AI tools.
 */
export function createGamehubTools(uid: string, db: Firestore): Record<string, GamehubToolDefinition> {
  const accounts = db.collection(`users/${uid}/accounts`);
  const accountRef = (accountId: string) => accounts.doc(accountId);
  const gamesRef = (accountId: string) => accountRef(accountId).collection('games');
  const providers = db.collection('providers');
  const now = () => new Date().toISOString();

  const requireAccount = async (accountId: string) => {
    const ref = accountRef(accountId);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new Error('Account not found.');
    return { ref, snapshot, data: snapshot.data()! };
  };
  const requireProvider = async (providerId: string) => {
    const ref = providers.doc(providerId);
    const snapshot = await ref.get();
    if (!snapshot.exists) throw new Error('Provider not found.');
    return { ref, snapshot, data: snapshot.data()! };
  };
  const requireOwnedProvider = async (providerId: string) => {
    const provider = await requireProvider(providerId);
    if (provider.data.userId !== uid) throw new Error('You can only change providers you created.');
    return provider;
  };
  const boundedPageSize = (value: number | undefined, fallback = 20) => Math.max(1, Math.min(100, value ?? fallback));

  return {
    list_accounts: define('List the signed-in user’s accounts. Password and OTP values are never returned.', z.object({ limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ limit }) => {
      const snap = await accounts.orderBy('createdAt', 'desc').limit(boundedPageSize(limit, 100)).get();
      return snap.docs.map((doc) => safeAccount(doc.id, doc.data()));
    }),
    get_account: define('Read one of the signed-in user’s accounts and its saved games. Password and OTP values are never returned.', z.object({ accountId: z.string().min(1).max(128) }).strict(), 'read', async ({ accountId }) => {
      const account = await requireAccount(accountId);
      const games = await gamesRef(accountId).orderBy('createdAt', 'asc').limit(100).get();
      return { ...safeAccount(account.snapshot.id, account.data), games: games.docs.map((doc) => safeGame(doc.id, doc.data())) };
    }),
    create_account: define('Create an account for the signed-in user. Credentials must be added or changed in the app for security.', z.object({
      accountName: z.string().trim().min(1).max(160), email: z.string().trim().email().max(320).nullable().optional(), notes: z.string().max(4000).nullable().optional(), platform: platforms,
      accountType: accountTypes.optional(), providerId: z.string().nullable().optional(), isPsPlus: z.boolean().default(false),
      lifecycleType: lifecycleTypes.default('lifetime'), expiresOn: z.string().date().nullable().optional(),
    }).strict(), 'write', async (input) => {
      const id = randomUUID(); const timestamp = now();
      await accountRef(id).set({ ...input, createdAt: timestamp, updatedAt: timestamp });
      return { id, created: true };
    }),
    update_account: define('Update non-secret fields on one of the signed-in user’s accounts. Password and OTP values can only be changed in the app.', z.object({
      accountId: z.string().min(1).max(128), accountName: z.string().trim().min(1).max(160).optional(), email: z.string().trim().email().max(320).nullable().optional(), notes: z.string().max(4000).nullable().optional(),
      platform: platforms.optional(), accountType: accountTypes.optional(), providerId: z.string().nullable().optional(), isPsPlus: z.boolean().optional(),
      lifecycleType: lifecycleTypes.optional(), expiresOn: z.string().date().nullable().optional(),
    }).strict(), 'write', async ({ accountId, ...fields }) => {
      const { ref } = await requireAccount(accountId);
      await ref.update({ ...fields, updatedAt: now() });
      return { id: accountId, updated: true };
    }),
    delete_account: define('Permanently delete one of the signed-in user’s accounts and its game records. Requires explicit confirmation.', z.object({ accountId: z.string().min(1).max(128), confirm: confirmed }).strict(), 'delete', async ({ accountId, confirm }) => {
      if (confirm !== true) throw new Error('Explicit confirmation is required.');
      const { ref } = await requireAccount(accountId);
      let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;
      while (true) {
        let query = gamesRef(accountId).orderBy(FieldPath.documentId()).limit(400);
        if (cursor) query = query.startAfter(cursor);
        const page = await query.get();
        if (page.empty) break;
        const batch = db.batch(); page.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit(); cursor = page.docs[page.docs.length - 1];
        if (page.size < 400) break;
      }
      await ref.delete();
      return { id: accountId, deleted: true };
    }, true),
    list_games: define('List saved games for one of the signed-in user’s accounts.', z.object({ accountId: z.string().min(1).max(128), limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ accountId, limit }) => {
      await requireAccount(accountId);
      const snap = await gamesRef(accountId).orderBy('createdAt', 'asc').limit(boundedPageSize(limit, 100)).get();
      return snap.docs.map((doc) => safeGame(doc.id, doc.data()));
    }),
    add_game: define('Add a game title, optional notes, provider, and cover URL to one of the signed-in user’s accounts.', z.object({
      accountId: z.string().min(1).max(128), title: z.string().trim().min(1).max(200), notes: z.string().max(4000).nullable().optional(), providerId: z.string().nullable().optional(), imageUrl: httpsUrl.nullable().optional(),
    }).strict(), 'write', async ({ accountId, title, imageUrl, notes, providerId }) => {
      await requireAccount(accountId);
      if (providerId) await requireOwnedProvider(providerId);
      const id = randomUUID();
      await gamesRef(accountId).doc(id).set({ accountId, title, notes: notes ?? null, providerId: providerId ?? null, imageUrl: imageUrl ?? null, createdAt: now() });
      return { id, created: true };
    }),
    update_game: define('Update a game title, notes, provider, or HTTPS cover URL in one of the signed-in user’s accounts.', z.object({
      accountId: z.string().min(1).max(128), gameId: z.string().min(1).max(128), title: z.string().trim().min(1).max(200).optional(), notes: z.string().max(4000).nullable().optional(), providerId: z.string().nullable().optional(), imageUrl: httpsUrl.nullable().optional(),
    }).strict().refine(({ title, notes, imageUrl, providerId }) => title !== undefined || notes !== undefined || providerId !== undefined || imageUrl !== undefined, 'Provide a title, notes, provider, or cover URL to update.'), 'write', async ({ accountId, gameId, ...fields }) => {
      await requireAccount(accountId);
      if (fields.providerId) await requireOwnedProvider(fields.providerId);
      const ref = gamesRef(accountId).doc(gameId);
      const snapshot = await ref.get();
      if (!snapshot.exists) throw new Error('Game not found.');
      await ref.update(fields);
      return { id: gameId, updated: true };
    }),
    delete_game: define('Permanently delete a game from one of the signed-in user’s accounts. Requires explicit confirmation.', z.object({
      accountId: z.string().min(1).max(128), gameId: z.string().min(1).max(128), confirm: confirmed,
    }).strict(), 'delete', async ({ accountId, gameId, confirm }) => {
      if (confirm !== true) throw new Error('Explicit confirmation is required.');
      await requireAccount(accountId);
      const ref = gamesRef(accountId).doc(gameId);
      if (!(await ref.get()).exists) throw new Error('Game not found.');
      await ref.delete();
      return { id: gameId, deleted: true };
    }, true),

    list_providers: define('List the signed-in user’s saved providers.', z.object({ limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ limit }) => {
      const snap = await providers.where('userId', '==', uid).orderBy('name').limit(boundedPageSize(limit, 100)).get();
      return snap.docs.map((doc) => safeProvider(doc.id, doc.data()));
    }),
    find_providers: define('Search the signed-in user’s saved providers by name.', z.object({ query: z.string().trim().min(1).max(100), limit: z.number().int().min(1).max(50).optional() }).strict(), 'read', async ({ query, limit }) => {
      const snap = await providers.where('userId', '==', uid).orderBy('name').limit(100).get();
      const needle = query.toLocaleLowerCase();
      return snap.docs.map((doc) => safeProvider(doc.id, doc.data())).filter((provider) => provider.name.toLocaleLowerCase().includes(needle)).slice(0, boundedPageSize(limit, 20));
    }),
    get_provider: define('Read one of the signed-in user’s saved providers.', z.object({ providerId: z.string().min(1).max(128) }).strict(), 'read', async ({ providerId }) => {
      const { snapshot, data } = await requireOwnedProvider(providerId);
      return safeProvider(snapshot.id, data);
    }),
    create_provider: define('Save a provider to the signed-in user’s private directory.', z.object({
      name: z.string().trim().min(1).max(160), website: httpsUrl.nullable().optional(), whatsapp: z.string().max(80).nullable().optional(),
      facebook: httpsUrl.nullable().optional(), instagram: httpsUrl.nullable().optional(), notes: z.string().max(4000).nullable().optional(), photoUrl: httpsUrl.nullable().optional(),
    }).strict(), 'write', async (fields) => {
      const id = randomUUID(); const timestamp = now();
      await providers.doc(id).set({ ...fields, userId: uid, website: fields.website ?? null, whatsapp: fields.whatsapp ?? null,
        facebook: fields.facebook ?? null, instagram: fields.instagram ?? null, notes: fields.notes ?? null, photoUrl: fields.photoUrl ?? null,
        createdAt: timestamp, updatedAt: timestamp });
      return { id, created: true };
    }),
    update_provider: define('Update a provider in the signed-in user’s private directory.', z.object({
      providerId: z.string().min(1).max(128), name: z.string().trim().min(1).max(160).optional(), website: httpsUrl.nullable().optional(),
      whatsapp: z.string().max(80).nullable().optional(), facebook: httpsUrl.nullable().optional(), instagram: httpsUrl.nullable().optional(),
      notes: z.string().max(4000).nullable().optional(), photoUrl: httpsUrl.nullable().optional(),
    }).strict().refine(({ providerId: _id, ...fields }) => Object.keys(fields).length > 0, 'Provide at least one field to update.'), 'write', async ({ providerId, ...fields }) => {
      const { ref } = await requireOwnedProvider(providerId);
      await ref.update({ ...fields, updatedAt: now() });
      return { id: providerId, updated: true };
    }),
    delete_provider: define('Permanently delete one of the signed-in user’s saved providers. Requires explicit confirmation.', z.object({ providerId: z.string().min(1).max(128), confirm: confirmed }).strict(), 'delete', async ({ providerId, confirm }) => {
      if (confirm !== true) throw new Error('Explicit confirmation is required.');
      const { ref } = await requireOwnedProvider(providerId);
      await ref.delete();
      return { id: providerId, deleted: true };
    }, true),

  };
}
