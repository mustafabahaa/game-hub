/**
 * Account sharing — global `sharedAccounts/{shareId}`.
 * Denormalized snapshot the recipient can read directly (Firestore has no joins,
 * and the owner's private docs are unreadable by the recipient by rule).
 */
import { listDocs, setDocById, deleteDocById } from './db';
import type { Account, SharedAccountDoc } from '@/domain/types';

const COLLECTION = 'sharedAccounts';

export const sharesLib = {
  /** Share (or update a share of) an account with a friend. Upsert keyed on owner+recipient+account. */
  async share(
    account: Account,
    ownerId: string,
    ownerName: string,
    recipientId: string,
    canViewPassword: boolean,
    canViewOtp: boolean,
  ): Promise<string> {
    const id = `${ownerId}_${account.id}_${recipientId}`;
    await setDocById(COLLECTION, id, {
      id,
      ownerId,
      recipientId,
      ownerName,
      account: {
        accountName: account.accountName,
        email: account.email,
        platform: account.platform,
        isPsPlus: account.isPsPlus,
        // Permission-gated credential fields:
        password: canViewPassword ? account.password : null,
        otpSecret: canViewOtp ? account.otpSecret : null,
      },
      games: (account.games ?? []).map((g) => ({ id: g.id, title: g.title, imageUrl: g.imageUrl ?? null })),
      canViewPassword,
      canViewOtp,
      createdAt: new Date().toISOString(),
    });
    return id;
  },

  /** Accounts shared WITH the current user. */
  async listReceived(recipientId: string): Promise<SharedAccountDoc[]> {
    return listDocs<SharedAccountDoc>(COLLECTION, {
      wheres: [{ field: 'recipientId', op: '==', value: recipientId }],
      orderField: 'createdAt',
      orderDirection: 'desc',
    });
  },

  async revoke(shareId: string): Promise<void> {
    await deleteDocById(COLLECTION, shareId);
  },
};
