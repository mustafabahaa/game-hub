/**
 * Provider records live in the top-level collection for compatibility, but
 * every read is scoped to the creating user and enforced by Firestore rules.
 */
import { listDocs, getDocById, setDocById, deleteDocById } from './db';
import { uploadImage, deleteByUrl } from './storage';
import type { Provider, ProviderFormData } from '@/domain/types';

const COLLECTION = 'providers';

export const providersLib = {
  async getAll(uid: string): Promise<Provider[]> {
    return listDocs<Provider>(COLLECTION, {
      wheres: [{ field: 'userId', op: '==', value: uid }],
      orderField: 'name',
      orderDirection: 'asc',
    });
  },

  async getById(uid: string, id: string): Promise<Provider | undefined> {
    const provider = await getDocById<Provider>(COLLECTION, id);
    if (provider?.userId !== uid) return undefined;
    return provider;
  },

  async create(uid: string, form: ProviderFormData): Promise<string> {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    let photoUrl: string | null = null;
    if (form.photo) {
      photoUrl = await uploadImage(`users/${uid}/providerPhotos/${id}.jpg`, form.photo);
    }
    await setDocById(COLLECTION, id, {
      userId: uid,
      name: form.name,
      website: form.website ?? null,
      whatsapp: form.whatsapp ?? null,
      facebook: form.facebook ?? null,
      instagram: form.instagram ?? null,
      notes: form.notes ?? null,
      photoUrl,
      createdAt: now,
      updatedAt: now,
    });
    return id;
  },

  async update(uid: string, id: string, form: ProviderFormData, existing?: Provider): Promise<void> {
    let photoUrl = existing?.photoUrl ?? null;
    if (form.photo) {
      // new photo — replace the old one
      if (photoUrl) await deleteByUrl(photoUrl);
      photoUrl = await uploadImage(`users/${uid}/providerPhotos/${id}.jpg`, form.photo);
    }
    await setDocById(COLLECTION, id, {
      userId: uid,
      name: form.name,
      website: form.website ?? null,
      whatsapp: form.whatsapp ?? null,
      facebook: form.facebook ?? null,
      instagram: form.instagram ?? null,
      notes: form.notes ?? null,
      photoUrl,
      updatedAt: new Date().toISOString(),
    });
  },

  async delete(provider: Provider): Promise<void> {
    await deleteByUrl(provider.photoUrl);
    await deleteDocById(COLLECTION, provider.id);
  },
};
