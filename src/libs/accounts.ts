/**
 * Accounts data-access. Private per-user: `users/{uid}/accounts/{accountId}`,
 * with games as a subcollection `users/{uid}/accounts/{accountId}/games/{gameId}`.
 *
 * IDs are generated client-side with crypto.randomUUID(), matching the
 * kippa/fitpal convention.
 */
import {
  listDocs,
  setDocById,
  updateDocById,
  deleteDocById,
  deleteByPath,
  userCollectionPath,
} from './db';
import { deleteByUrl } from './storage';
import type {
  Account,
  AccountFormData,
  Game,
} from '@/domain/types';

export const accountsLib = {
  accountsCollection(uid: string): string {
    return userCollectionPath(uid, 'accounts');
  },

  /** List all of a user's accounts with their games eager-loaded. */
  async getAll(uid: string): Promise<Account[]> {
    const accounts = await listDocs<Account>(this.accountsCollection(uid), {
      orderField: 'createdAt',
      orderDirection: 'desc',
    });
    // Eager-load games subcollection for each account.
    const withGames = await Promise.all(
      accounts.map(async (a) => {
        const games = await listDocs<Game>(
          `${userCollectionPath(uid, 'accounts')}/${a.id}/games`,
          { orderField: 'createdAt', orderDirection: 'asc' },
        );
        return { ...a, games };
      }),
    );
    return withGames;
  },

  async create(uid: string, form: AccountFormData): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    await setDocById(this.accountsCollection(uid), id, {
      ...form,
      email: null,
      notes: null,
      password: null,
      otpSecret: null,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },

  async update(uid: string, id: string, form: Partial<AccountFormData>): Promise<void> {
    await updateDocById(this.accountsCollection(uid), id, {
      ...form,
      email: null,
      notes: null,
      password: null,
      otpSecret: null,
      updatedAt: new Date().toISOString(),
    });
  },

  /** Delete an account + all its game covers (storage + docs). */
  async delete(uid: string, account: Account): Promise<void> {
    const coll = this.accountsCollection(uid);
    // Clean up game cover images first.
    for (const g of account.games ?? []) {
      await deleteByUrl(g.imageUrl);
      await deleteByPath(`${coll}/${account.id}/games/${g.id}`);
    }
    await deleteDocById(coll, account.id);
  },
};
