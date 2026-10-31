/**
 * Providers data-access. Providers are GLOBAL (public read) — `providers/{providerId}`.
 * Owner-gated for writes via security rules.
 */
import { listDocs, getDocById, setDocById, deleteDocById } from './db';
import { uploadImage, deleteByUrl } from './storage';
import type { Provider, ProviderFormData } from '@/domain/types';

const COLLECTION = 'providers';

export const providersLib = {
  async getAll(): Promise<Provider[]> {
    return listDocs<Provider>(COLLECTION, {
      orderField: 'name',
      orderDirection: 'asc',
    });
  },

  async getById(id: string): Promise<Provider | undefined> {
    return getDocById<Provider>(COLLECTION, id);
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
