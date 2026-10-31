/** Games data-access — subcollection under each account. */
import { listDocs, setDocById, deleteByPath, userCollectionPath } from './db';
import { deleteByUrl, uploadImage } from './storage';
import type { Game } from '@/domain/types';

export const gamesLib = {
  gamesCollectionPath(uid: string, accountId: string): string {
    return `${userCollectionPath(uid, 'accounts')}/${accountId}/games`;
  },

  async getAll(uid: string, accountId: string): Promise<Game[]> {
    return listDocs<Game>(this.gamesCollectionPath(uid, accountId), {
      orderField: 'createdAt',
      orderDirection: 'asc',
    });
  },

  async create(
    uid: string,
    accountId: string,
    title: string,
    imageFile: File | null,
  ): Promise<string> {
    const id = crypto.randomUUID();
    let imageUrl: string | null = null;
    if (imageFile) {
      const path = `users/${uid}/gameImages/${accountId}/${id}.jpg`;
      imageUrl = await uploadImage(path, imageFile);
    }
    await setDocById(this.gamesCollectionPath(uid, accountId), id, {
      accountId,
      title,
      imageUrl,
      createdAt: new Date().toISOString(),
    });
    return id;
  },

  async delete(uid: string, accountId: string, game: Game): Promise<void> {
    await deleteByUrl(game.imageUrl);
    await deleteByPath(`${this.gamesCollectionPath(uid, accountId)}/${game.id}`);
  },
};
