/**
 * Friends data-access.
 *
 * Friend requests: global `friendRequests/{requestId}`.
 * Friendships: `friendships/{uid}/friends/{friendUid}` — bi-directional pair,
 * exactly like the Supabase `friendships` table stored two rows per link.
 */
import { listDocs, setDocById, deleteDocById, deleteByPath } from './db';
import type { FriendRequest, FriendRequestStatus } from '@/domain/types';

const REQUESTS_COLLECTION = 'friendRequests';

export const friendsLib = {
  friendshipsCollectionPath(uid: string): string {
    return `friendships/${uid}/friends`;
  },

  /* ---------- friend requests ---------- */

  async listIncoming(uid: string): Promise<FriendRequest[]> {
    return listDocs<FriendRequest>(REQUESTS_COLLECTION, {
      wheres: [
        { field: 'receiverId', op: '==', value: uid },
        { field: 'status', op: '==', value: 'pending' },
      ],
      orderField: 'createdAt',
      orderDirection: 'desc',
    });
  }

  ,

  async listOutgoing(uid: string): Promise<FriendRequest[]> {
    return listDocs<FriendRequest>(REQUESTS_COLLECTION, {
      wheres: [
        { field: 'senderId', op: '==', value: uid },
        { field: 'status', op: '==', value: 'pending' },
      ],
      orderField: 'createdAt',
      orderDirection: 'desc',
    });
  },

  async send(senderId: string, receiverId: string): Promise<string> {
    const id = crypto.randomUUID();
    await setDocById(REQUESTS_COLLECTION, id, {
      senderId,
      receiverId,
      status: 'pending',
      respondedAt: null,
      createdAt: new Date().toISOString(),
    });
    return id;
  },

  async respond(request: FriendRequest, status: Exclude<FriendRequestStatus, 'pending'>): Promise<void> {
    const now = new Date().toISOString();
    await setDocById(REQUESTS_COLLECTION, request.id, { status, respondedAt: now });

    if (status === 'accepted') {
      // Write the bi-directional friendship pair.
      const nowIso = now;
      await setDocById(this.friendshipsCollectionPath(request.receiverId), request.senderId, {
        friendUid: request.senderId,
        createdAt: nowIso,
      });
      await setDocById(this.friendshipsCollectionPath(request.senderId), request.receiverId, {
        friendUid: request.receiverId,
        createdAt: nowIso,
      });
    }
  },

  async cancel(request: FriendRequest): Promise<void> {
    await setDocById(REQUESTS_COLLECTION, request.id, {
      status: 'canceled',
      respondedAt: new Date().toISOString(),
    });
  },

  /* ---------- friendships ---------- */

  async listFriendUids(uid: string): Promise<string[]> {
    const docs = await listDocs<{ friendUid: string }>(this.friendshipsCollectionPath(uid));
    return docs.map((d) => d.friendUid);
  },

  async removeFriend(uid: string, friendUid: string): Promise<void> {
    // Remove both directions.
    await deleteByPath(`${this.friendshipsCollectionPath(uid)}/${friendUid}`);
    await deleteByPath(`${this.friendshipsCollectionPath(friendUid)}/${uid}`);
    await deleteDocById(REQUESTS_COLLECTION, `${uid}_${friendUid}`).catch(() => {});
    await deleteDocById(REQUESTS_COLLECTION, `${friendUid}_${uid}`).catch(() => {});
  },
};
