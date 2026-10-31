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
const profileFields = (uid: string, data: FirebaseFirestore.DocumentData) => ({
  uid,
  username: data.username ?? null,
  displayName: data.displayName ?? null,
  avatarUrl: data.avatarUrl ?? null,
  bio: data.bio ?? null,
  createdAt: data.createdAt ?? null,
});
const safeAccount = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  accountName: data.accountName ?? '',
  email: data.email ?? '',
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
const safePublicGame = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  gameId: data.gameId ?? id,
  title: data.title ?? '',
  imageUrl: data.imageUrl ?? null,
  platform: data.platform ?? null,
  ownerUid: data.ownerUid ?? null,
  ownerUsername: data.ownerUsername ?? null,
  ownerDisplayName: data.ownerDisplayName ?? null,
  ownerAvatarUrl: data.ownerAvatarUrl ?? null,
  ownerBio: data.ownerBio ?? null,
  createdAt: data.createdAt ?? null,
});
const safeShare = (id: string, data: FirebaseFirestore.DocumentData) => ({
  id,
  ownerId: data.ownerId ?? null,
  ownerName: data.ownerName ?? null,
  recipientId: data.recipientId ?? null,
  account: {
    accountName: data.account?.accountName ?? '',
    email: data.account?.email ?? '',
    platform: data.account?.platform ?? null,
    isPsPlus: Boolean(data.account?.isPsPlus),
  },
  games: Array.isArray(data.games) ? data.games.map((game: Record<string, unknown>) => ({
    id: game.id ?? null, title: game.title ?? '', imageUrl: game.imageUrl ?? null,
  })) : [],
  canViewPassword: Boolean(data.canViewPassword),
  canViewOtp: Boolean(data.canViewOtp),
  createdAt: data.createdAt ?? null,
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
 * Private records are always scoped to `uid`; public social data is explicitly
 * limited to profile/game fields intended for the Community page. Account
 * passwords and OTP values are never returned or accepted by AI tools.
 */
export function createGamehubTools(uid: string, db: Firestore): Record<string, GamehubToolDefinition> {
  const accounts = db.collection(`users/${uid}/accounts`);
  const accountRef = (accountId: string) => accounts.doc(accountId);
  const gamesRef = (accountId: string) => accountRef(accountId).collection('games');
  const providers = db.collection('providers');
  const profiles = db.collection('profiles');
  const receivedShares = db.collection('sharedAccounts');
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
      accountName: z.string().trim().min(1).max(160), email: z.string().trim().email().max(320), platform: platforms,
      accountType: accountTypes.optional(), providerId: z.string().nullable().optional(), isPsPlus: z.boolean().default(false),
      lifecycleType: lifecycleTypes.default('lifetime'), expiresOn: z.string().date().nullable().optional(),
    }).strict(), 'write', async (input) => {
      const id = randomUUID(); const timestamp = now();
      await accountRef(id).set({ ...input, createdAt: timestamp, updatedAt: timestamp });
      return { id, created: true };
    }),
    update_account: define('Update non-secret fields on one of the signed-in user’s accounts. Password and OTP values can only be changed in the app.', z.object({
      accountId: z.string().min(1).max(128), accountName: z.string().trim().min(1).max(160).optional(), email: z.string().trim().email().max(320).optional(),
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
    add_game: define('Add a game title and optional cover URL to one of the signed-in user’s accounts.', z.object({
      accountId: z.string().min(1).max(128), title: z.string().trim().min(1).max(200), imageUrl: httpsUrl.nullable().optional(),
    }).strict(), 'write', async ({ accountId, title, imageUrl }) => {
      await requireAccount(accountId);
      const id = randomUUID();
      await gamesRef(accountId).doc(id).set({ accountId, title, imageUrl: imageUrl ?? null, createdAt: now() });
      return { id, created: true };
    }),
    update_game: define('Update a game title or HTTPS cover URL in one of the signed-in user’s accounts.', z.object({
      accountId: z.string().min(1).max(128), gameId: z.string().min(1).max(128), title: z.string().trim().min(1).max(200).optional(), imageUrl: httpsUrl.nullable().optional(),
    }).strict().refine(({ title, imageUrl }) => title !== undefined || imageUrl !== undefined, 'Provide a title or cover URL to update.'), 'write', async ({ accountId, gameId, ...fields }) => {
      await requireAccount(accountId);
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

    list_providers: define('List public GameHub providers.', z.object({ limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ limit }) => {
      const snap = await providers.orderBy('name').limit(boundedPageSize(limit, 100)).get();
      return snap.docs.map((doc) => safeProvider(doc.id, doc.data()));
    }),
    find_providers: define('Search public GameHub providers by name prefix or matching name.', z.object({ query: z.string().trim().min(1).max(100), limit: z.number().int().min(1).max(50).optional() }).strict(), 'read', async ({ query, limit }) => {
      const snap = await providers.orderBy('name').limit(100).get();
      const needle = query.toLocaleLowerCase();
      return snap.docs.map((doc) => safeProvider(doc.id, doc.data())).filter((provider) => provider.name.toLocaleLowerCase().includes(needle)).slice(0, boundedPageSize(limit, 20));
    }),
    get_provider: define('Read a public GameHub provider.', z.object({ providerId: z.string().min(1).max(128) }).strict(), 'read', async ({ providerId }) => {
      const { snapshot, data } = await requireProvider(providerId);
      return safeProvider(snapshot.id, data);
    }),
    create_provider: define('Create a public provider directory entry owned by the signed-in user.', z.object({
      name: z.string().trim().min(1).max(160), website: httpsUrl.nullable().optional(), whatsapp: z.string().max(80).nullable().optional(),
      facebook: httpsUrl.nullable().optional(), instagram: httpsUrl.nullable().optional(), notes: z.string().max(4000).nullable().optional(), photoUrl: httpsUrl.nullable().optional(),
    }).strict(), 'write', async (fields) => {
      const id = randomUUID(); const timestamp = now();
      await providers.doc(id).set({ ...fields, userId: uid, website: fields.website ?? null, whatsapp: fields.whatsapp ?? null,
        facebook: fields.facebook ?? null, instagram: fields.instagram ?? null, notes: fields.notes ?? null, photoUrl: fields.photoUrl ?? null,
        createdAt: timestamp, updatedAt: timestamp });
      return { id, created: true };
    }),
    update_provider: define('Update a provider directory entry created by the signed-in user.', z.object({
      providerId: z.string().min(1).max(128), name: z.string().trim().min(1).max(160).optional(), website: httpsUrl.nullable().optional(),
      whatsapp: z.string().max(80).nullable().optional(), facebook: httpsUrl.nullable().optional(), instagram: httpsUrl.nullable().optional(),
      notes: z.string().max(4000).nullable().optional(), photoUrl: httpsUrl.nullable().optional(),
    }).strict().refine(({ providerId: _id, ...fields }) => Object.keys(fields).length > 0, 'Provide at least one field to update.'), 'write', async ({ providerId, ...fields }) => {
      const { ref } = await requireOwnedProvider(providerId);
      await ref.update({ ...fields, updatedAt: now() });
      return { id: providerId, updated: true };
    }),
    delete_provider: define('Permanently delete a provider directory entry created by the signed-in user. Requires explicit confirmation.', z.object({ providerId: z.string().min(1).max(128), confirm: confirmed }).strict(), 'delete', async ({ providerId, confirm }) => {
      if (confirm !== true) throw new Error('Explicit confirmation is required.');
      const { ref } = await requireOwnedProvider(providerId);
      await ref.delete();
      return { id: providerId, deleted: true };
    }, true),
    list_provider_ratings: define('List public ratings and short written reviews for a provider.', z.object({ providerId: z.string().min(1).max(128), limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ providerId, limit }) => {
      await requireProvider(providerId);
      const snap = await providers.doc(providerId).collection('ratings').orderBy('createdAt', 'desc').limit(boundedPageSize(limit, 100)).get();
      return snap.docs.map((doc) => ({ id: doc.id, userId: doc.get('userId') ?? doc.id, rating: doc.get('rating'), review: doc.get('review') ?? null, createdAt: doc.get('createdAt') ?? null }));
    }),
    rate_provider: define('Create or update the signed-in user’s rating and optional review for a provider.', z.object({
      providerId: z.string().min(1).max(128), rating: z.number().int().min(1).max(5), review: z.string().max(4000).nullable().optional(),
    }).strict(), 'write', async ({ providerId, rating, review }) => {
      await requireProvider(providerId);
      const ref = providers.doc(providerId).collection('ratings').doc(uid);
      const existing = await ref.get();
      await ref.set({ providerId, userId: uid, rating, review: review ?? null, createdAt: existing.get('createdAt') ?? now() });
      return { providerId, rating, saved: true };
    }),
    list_provider_experiences: define('List public buyer experience posts about a provider.', z.object({ providerId: z.string().min(1).max(128), limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ providerId, limit }) => {
      await requireProvider(providerId);
      const snap = await providers.doc(providerId).collection('reputation').orderBy('createdAt', 'desc').limit(boundedPageSize(limit, 100)).get();
      return snap.docs.map((doc) => ({ id: doc.id, providerId, userId: doc.get('userId'), title: doc.get('title'), body: doc.get('body') ?? null, proofLink: doc.get('proofLink') ?? null, createdAt: doc.get('createdAt') ?? null }));
    }),
    add_provider_experience: define('Post a buyer experience about a provider. Be factual and do not include private personal information.', z.object({
      providerId: z.string().min(1).max(128), title: z.string().trim().min(1).max(180), body: z.string().max(4000).nullable().optional(), proofLink: httpsUrl.nullable().optional(),
    }).strict(), 'write', async ({ providerId, title, body, proofLink }) => {
      await requireProvider(providerId);
      const id = randomUUID();
      await providers.doc(providerId).collection('reputation').doc(id).set({ providerId, userId: uid, title, body: body ?? null, proofLink: proofLink ?? null, createdAt: now() });
      return { id, providerId, created: true };
    }),

    get_my_profile: define('Read the signed-in user’s public GameHub profile.', z.object({}).strict(), 'read', async () => {
      const snapshot = await profiles.doc(uid).get();
      return snapshot.exists ? profileFields(uid, snapshot.data()!) : null;
    }),
    update_my_profile: define('Update the signed-in user’s public GameHub profile.', z.object({
      username: z.string().trim().min(3).max(24).regex(/^[a-zA-Z0-9_]+$/).optional(),
      displayName: z.string().trim().max(80).nullable().optional(), avatarUrl: httpsUrl.nullable().optional(), bio: z.string().max(300).nullable().optional(),
    }).strict().refine((fields) => Object.keys(fields).length > 0, 'Provide at least one profile field to update.'), 'write', async (fields) => {
      const ref = profiles.doc(uid);
      const existing = await ref.get();
      const data = { uid, username: fields.username ?? existing.get('username') ?? `player_${uid.slice(0, 8)}`,
        displayName: fields.displayName === undefined ? existing.get('displayName') ?? null : fields.displayName,
        avatarUrl: fields.avatarUrl === undefined ? existing.get('avatarUrl') ?? null : fields.avatarUrl,
        bio: fields.bio === undefined ? existing.get('bio') ?? null : fields.bio,
        createdAt: existing.get('createdAt') ?? now() };
      await ref.set(data);
      return profileFields(uid, data);
    }),
    search_public_profiles: define('Search public GameHub profiles by username or display-name prefix. The signed-in user is excluded.', z.object({ query: z.string().trim().min(1).max(80), limit: z.number().int().min(1).max(20).optional() }).strict(), 'read', async ({ query, limit }) => {
      const q = query.trim(); const lower = q.toLocaleLowerCase();
      const [byUsername, byDisplayName] = await Promise.all([
        profiles.where('username', '>=', lower).where('username', '<=', `${lower}\uf8ff`).limit(20).get(),
        profiles.where('displayName', '>=', q).where('displayName', '<=', `${q}\uf8ff`).limit(20).get(),
      ]);
      const found = new Map<string, FirebaseFirestore.DocumentData>();
      for (const doc of [...byUsername.docs, ...byDisplayName.docs]) if (doc.id !== uid) found.set(doc.id, doc.data());
      return [...found].map(([id, data]) => profileFields(id, data)).slice(0, boundedPageSize(limit, 20));
    }),
    list_public_profiles: define('List a bounded page of public GameHub community profiles. Use nextCursor for a later page.', z.object({ cursor: z.string().nullable().optional(), limit: z.number().int().min(1).max(20).optional() }).strict(), 'read', async ({ cursor, limit }) => {
      const pageSize = boundedPageSize(limit, 20);
      let query = profiles.orderBy('uid').limit(pageSize + 1);
      if (cursor) query = query.startAfter(cursor);
      const snap = await query.get();
      const hasMore = snap.docs.length > pageSize;
      const docs = snap.docs.slice(0, pageSize);
      return { profiles: docs.map((doc) => profileFields(doc.id, doc.data())), nextCursor: hasMore ? docs[docs.length - 1]?.get('uid') ?? null : null };
    }),
    get_public_profile: define('Read a public community profile and a small preview of its published games.', z.object({ uid: z.string().min(1).max(128), gameLimit: z.number().int().min(1).max(20).optional() }).strict(), 'read', async ({ uid: ownerUid, gameLimit }) => {
      const profile = await profiles.doc(ownerUid).get();
      if (!profile.exists) throw new Error('Profile not found.');
      const games = await db.collection('publicGames').where('ownerUid', '==', ownerUid).orderBy(FieldPath.documentId()).limit(boundedPageSize(gameLimit, 6) + 1).get();
      const limit = boundedPageSize(gameLimit, 6);
      const docs = games.docs.slice(0, limit);
      return { profile: profileFields(ownerUid, profile.data()!), games: docs.map((doc) => safePublicGame(doc.id, doc.data())), hasMoreGames: games.docs.length > limit };
    }),
    list_public_games: define('List a bounded page of a community member’s publicly published games.', z.object({ ownerUid: z.string().min(1).max(128), cursor: z.string().nullable().optional(), limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ ownerUid, cursor, limit }) => {
      const pageSize = boundedPageSize(limit, 20);
      let query = db.collection('publicGames').where('ownerUid', '==', ownerUid).orderBy(FieldPath.documentId()).limit(pageSize + 1);
      if (cursor) query = query.startAfter(cursor);
      const snap = await query.get();
      const hasMore = snap.docs.length > pageSize;
      const docs = snap.docs.slice(0, pageSize);
      return { games: docs.map((doc) => safePublicGame(doc.id, doc.data())), nextCursor: hasMore ? docs[docs.length - 1]?.id ?? null : null };
    }),

    list_friends: define('List the signed-in user’s friends with their public profiles.', z.object({ limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ limit }) => {
      const snap = await db.collection(`friendships/${uid}/friends`).orderBy(FieldPath.documentId()).limit(boundedPageSize(limit, 100)).get();
      const friendships = await Promise.all(snap.docs.map(async (doc) => {
        const friendUid = doc.get('friendUid') ?? doc.id;
        const profile = await profiles.doc(friendUid).get();
        return { friendUid, createdAt: doc.get('createdAt') ?? null, profile: profile.exists ? profileFields(friendUid, profile.data()!) : null };
      }));
      return friendships;
    }),
    list_friend_requests: define('List pending friend requests sent to or by the signed-in user.', z.object({ direction: z.enum(['incoming', 'outgoing']), limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ direction, limit }) => {
      const field = direction === 'incoming' ? 'receiverId' : 'senderId';
      const snap = await db.collection('friendRequests').where(field, '==', uid).where('status', '==', 'pending').orderBy('createdAt', 'desc').limit(boundedPageSize(limit, 100)).get();
      return snap.docs.map((doc) => ({ id: doc.id, senderId: doc.get('senderId'), receiverId: doc.get('receiverId'), status: doc.get('status'), createdAt: doc.get('createdAt') }));
    }),
    send_friend_request: define('Send a friend request to a public GameHub profile.', z.object({ receiverUid: z.string().min(1).max(128) }).strict(), 'write', async ({ receiverUid }) => {
      if (receiverUid === uid) throw new Error('You cannot send a friend request to yourself.');
      if (!(await profiles.doc(receiverUid).get()).exists) throw new Error('Profile not found.');
      if ((await db.doc(`friendships/${uid}/friends/${receiverUid}`).get()).exists) throw new Error('You are already friends.');
      const existing = await db.collection('friendRequests').where('senderId', '==', uid).where('receiverId', '==', receiverUid).where('status', '==', 'pending').limit(1).get();
      if (!existing.empty) return { id: existing.docs[0].id, alreadyPending: true };
      const id = randomUUID();
      await db.collection('friendRequests').doc(id).set({ senderId: uid, receiverId: receiverUid, status: 'pending', respondedAt: null, createdAt: now() });
      return { id, sent: true };
    }),
    respond_to_friend_request: define('Accept or reject a pending friend request sent to the signed-in user.', z.object({ requestId: z.string().min(1).max(128), status: z.enum(['accepted', 'rejected']) }).strict(), 'write', async ({ requestId, status }) => {
      const requestRef = db.collection('friendRequests').doc(requestId);
      await db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(requestRef);
        if (!snapshot.exists || snapshot.get('receiverId') !== uid || snapshot.get('status') !== 'pending') throw new Error('Pending friend request not found.');
        const senderUid = snapshot.get('senderId');
        if (typeof senderUid !== 'string' || senderUid === uid) throw new Error('Invalid friend request.');
        const timestamp = now();
        transaction.update(requestRef, { status, respondedAt: timestamp });
        if (status === 'accepted') {
          transaction.set(db.doc(`friendships/${uid}/friends/${senderUid}`), { friendUid: senderUid, createdAt: timestamp });
          transaction.set(db.doc(`friendships/${senderUid}/friends/${uid}`), { friendUid: uid, createdAt: timestamp });
        }
      });
      return { requestId, status };
    }),
    cancel_friend_request: define('Cancel a pending friend request sent by the signed-in user.', z.object({ requestId: z.string().min(1).max(128) }).strict(), 'write', async ({ requestId }) => {
      const ref = db.collection('friendRequests').doc(requestId);
      const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.get('senderId') !== uid || snapshot.get('status') !== 'pending') throw new Error('Pending friend request not found.');
      await ref.update({ status: 'canceled', respondedAt: now() });
      return { requestId, canceled: true };
    }),
    remove_friend: define('Remove a friend from both users’ friend lists. Requires explicit confirmation.', z.object({ friendUid: z.string().min(1).max(128), confirm: confirmed }).strict(), 'delete', async ({ friendUid, confirm }) => {
      if (confirm !== true) throw new Error('Explicit confirmation is required.');
      if (friendUid === uid) throw new Error('Invalid friend.');
      const ownRef = db.doc(`friendships/${uid}/friends/${friendUid}`);
      if (!(await ownRef.get()).exists) throw new Error('Friend not found.');
      const batch = db.batch();
      batch.delete(ownRef); batch.delete(db.doc(`friendships/${friendUid}/friends/${uid}`));
      await batch.commit();
      return { friendUid, removed: true };
    }, true),

    list_received_shares: define('List account shares received by the signed-in user. Shared passwords and OTP secrets are never returned.', z.object({ limit: z.number().int().min(1).max(100).optional() }).strict(), 'read', async ({ limit }) => {
      const snap = await receivedShares.where('recipientId', '==', uid).orderBy('createdAt', 'desc').limit(boundedPageSize(limit, 100)).get();
      return snap.docs.map((doc) => safeShare(doc.id, doc.data()));
    }),
    share_account: define('Share an account and its game list with one of the signed-in user’s friends, without sharing its password or OTP secret. Requires explicit confirmation.', z.object({ accountId: z.string().min(1).max(128), recipientUid: z.string().min(1).max(128), confirm: confirmed }).strict(), 'write', async ({ accountId, recipientUid, confirm }) => {
      if (confirm !== true) throw new Error('Explicit confirmation is required.');
      if (recipientUid === uid || !(await db.doc(`friendships/${uid}/friends/${recipientUid}`).get()).exists) throw new Error('The recipient must be one of your friends.');
      const account = await requireAccount(accountId);
      const [profile, games] = await Promise.all([
        profiles.doc(uid).get(),
        gamesRef(accountId).orderBy('createdAt', 'asc').limit(100).get(),
      ]);
      const ownerName = profile.get('displayName') ?? profile.get('username') ?? 'GameHub user';
      const id = `${uid}_${accountId}_${recipientUid}`;
      await receivedShares.doc(id).set({ id, ownerId: uid, recipientId: recipientUid, ownerName,
        account: { accountName: account.data.accountName, email: account.data.email, platform: account.data.platform, isPsPlus: Boolean(account.data.isPsPlus), password: null, otpSecret: null },
        games: games.docs.map((doc) => ({ id: doc.id, title: doc.get('title'), imageUrl: doc.get('imageUrl') ?? null })),
        canViewPassword: false, canViewOtp: false, createdAt: now() });
      return { id, shared: true, sharedCredentials: false };
    }, true),
    revoke_account_share: define('Revoke an account share created by the signed-in user. Requires explicit confirmation.', z.object({ shareId: z.string().min(1).max(256), confirm: confirmed }).strict(), 'delete', async ({ shareId, confirm }) => {
      if (confirm !== true) throw new Error('Explicit confirmation is required.');
      const ref = receivedShares.doc(shareId); const snapshot = await ref.get();
      if (!snapshot.exists || snapshot.get('ownerId') !== uid) throw new Error('Share not found.');
      await ref.delete();
      return { shareId, revoked: true };
    }, true),
  };
}
