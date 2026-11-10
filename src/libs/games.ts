/** Games data-access — subcollection under each account. */
import { listDocs, setDocById, updateDocById, deleteByPath, userCollectionPath } from './db';
import { deleteByUrl, uploadImage } from './storage';
import type { Game, GameFormData } from '@/domain/types';

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
    form: GameFormData,
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
      ...form,
      providerId: form.providerId || null,
      imageUrl,
      createdAt: new Date().toISOString(),
    });
    return id;
  },

  async update(uid: string, accountId: string, gameId: string, form: Partial<GameFormData>): Promise<void> {
    await updateDocById(this.gamesCollectionPath(uid, accountId), gameId, {
      ...form,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(uid: string, accountId: string, game: Game): Promise<void> {
    await deleteByUrl(game.imageUrl);
    await deleteByPath(`${this.gamesCollectionPath(uid, accountId)}/${game.id}`);
  },
};
