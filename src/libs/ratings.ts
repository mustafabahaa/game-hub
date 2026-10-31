/**
 * Provider ratings — subcollection `providers/{pid}/ratings/{userUid}`.
 * One rating per user per provider (doc id = user uid → upsert).
 */
import { listDocs, setDocById } from './db';
import type { ProviderRating } from '@/domain/types';

export const ratingsLib = {
  collection(providerId: string): string {
    return `providers/${providerId}/ratings`;
  },

  async list(providerId: string): Promise<ProviderRating[]> {
    return listDocs<ProviderRating>(this.collection(providerId), {
      orderField: 'createdAt',
      orderDirection: 'desc',
    });
  },

  /** Upsert the current user's rating (doc id = user uid). */
  async upsert(providerId: string, userId: string, rating: number, review?: string | null): Promise<void> {
    const existing = await listDocs<ProviderRating>(this.collection(providerId), {
      wheres: [{ field: 'userId', op: '==', value: userId }],
    });
    const createdAt = existing[0]?.createdAt ?? new Date().toISOString();
    await setDocById(this.collection(providerId), userId, {
      providerId,
      userId,
      rating,
      review: review ?? null,
      createdAt,
    });
  },
};
