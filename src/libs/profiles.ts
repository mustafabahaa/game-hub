/**
 * User profiles — global, PUBLIC read; owner write.
 * `profiles/{uid}`. Upserted on first dashboard visit (ensurePublicProfile).
 */
import { getDocById, setDocById, listDocs, listDocsPage, type PageCursor } from './db';
import type { UserProfile } from '@/domain/types';

const COLLECTION = 'profiles';

export const profilesLib = {
  async get(uid: string): Promise<UserProfile | undefined> {
    return getDocById<UserProfile>(COLLECTION, uid);
  },

  /** Upsert a profile, preserving any existing fields (username especially). */
  async ensure(uid: string, partial: Partial<UserProfile>): Promise<void> {
    const existing = await this.get(uid);
    const username =
      existing?.username ??
      partial.username ??
      this.generateUsername(partial.displayName ?? partial.uid ?? uid);
    await setDocById(COLLECTION, uid, {
      uid,
      username,
      displayName: partial.displayName ?? existing?.displayName ?? null,
      avatarUrl: partial.avatarUrl ?? existing?.avatarUrl ?? null,
      bio: partial.bio ?? existing?.bio ?? null,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    });
  },

  async update(uid: string, partial: Partial<UserProfile>): Promise<void> {
    await setDocById(COLLECTION, uid, { uid, ...partial });
  },

  /** Search profiles by username/displayName (ilike). Firestore has no ILIKE;
   *  we do a >= / < prefix range per field client-side and merge. */
  async search(queryText: string, excludeUid?: string): Promise<UserProfile[]> {
    const q = queryText.trim();
    if (!q) return [];
    const lower = q.toLowerCase();
    const byName = await listDocs<UserProfile>(COLLECTION, {
      wheres: [
        { field: 'username', op: '>=', value: lower },
        { field: 'username', op: '<=', value: lower + '\uf8ff' },
      ],
    });
    // Firestore can't OR two range filters in one query, so we also fetch a
    // displayName prefix range and merge/dedupe client-side.
    const byDisplay = await listDocs<UserProfile>(COLLECTION, {
      wheres: [
        { field: 'displayName', op: '>=', value: q },
        { field: 'displayName', op: '<=', value: q + '\uf8ff' },
      ],
    });
    const map = new Map<string, UserProfile>();
    for (const p of [...byName, ...byDisplay]) {
      if (excludeUid && p.uid === excludeUid) continue;
      map.set(p.uid, p);
    }
    return Array.from(map.values()).slice(0, 10);
  },

  /** Look up several profiles by uid. */
  async getMany(uids: string[]): Promise<UserProfile[]> {
    if (uids.length === 0) return [];
    // Firestore `in` is capped at 30 values — batch it.
    const results: UserProfile[] = [];
    for (let i = 0; i < uids.length; i += 30) {
      const batch = uids.slice(i, i + 30);
      const found = await listDocs<UserProfile>(COLLECTION, {
        wheres: [{ field: 'uid', op: 'in', value: batch }],
      });
      results.push(...found);
    }
    return results;
  },

  /** Read a small ordered page of public profiles for the Community feed. */
  async getPage(cursor: PageCursor | null, pageSize: number) {
    return listDocsPage<UserProfile>(COLLECTION, pageSize, {
      orderField: 'uid',
      orderDirection: 'asc',
    }, cursor);
  },

  generateUsername(seed: string): string {
    const base = (seed.split('@')[0] || 'player').replace(/[^a-z0-9]/gi, '').toLowerCase().slice(0, 12) || 'player';
    const hex = Math.random().toString(16).slice(2, 8);
    return `${base}_${hex}`;
  },
};
