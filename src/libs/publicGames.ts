/**
 * Public games feed — `publicGames/{gameId}`.
 * Replaces the Supabase `public_user_games` SQL VIEW. Denormalized at write time.
 */
import { listDocs, listDocsPage, setDocById, deleteDocById, type PageCursor } from './db';
import type { PublicGameDoc } from '@/domain/types';

const COLLECTION = 'publicGames';

export const publicGamesLib = {
  /** Write/update the public mirror of a game. */
  async upsert(doc: PublicGameDoc): Promise<void> {
    await setDocById(COLLECTION, doc.gameId, doc);
  },

  async remove(gameId: string): Promise<void> {
    await deleteDocById(COLLECTION, gameId);
  },

  /** Load a bounded game preview for one user. */
  async getOwnerPreview(ownerUid: string, limit: number): Promise<PublicGameDoc[]> {
    return listDocs<PublicGameDoc>(COLLECTION, {
      wheres: [{ field: 'ownerUid', op: '==', value: ownerUid }],
      limit,
    });
  },

  /** Cursor-paginate every public game for the selected user. */
  async getOwnerPage(ownerUid: string, cursor: PageCursor | null, pageSize: number) {
    return listDocsPage<PublicGameDoc>(COLLECTION, pageSize, {
      wheres: [{ field: 'ownerUid', op: '==', value: ownerUid }],
    }, cursor);
  },
};
