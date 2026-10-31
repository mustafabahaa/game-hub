/**
 * Provider reputation posts — subcollection `providers/{pid}/reputation/{postId}`.
 * Append-only posts (client-generated uuid ids).
 */
import { listDocs, setDocById } from './db';
import type { ReputationPost } from '@/domain/types';

export const reputationLib = {
  collection(providerId: string): string {
    return `providers/${providerId}/reputation`;
  },

  async list(providerId: string): Promise<ReputationPost[]> {
    return listDocs<ReputationPost>(this.collection(providerId), {
      orderField: 'createdAt',
      orderDirection: 'desc',
    });
  },

  async create(
    providerId: string,
    userId: string,
    title: string,
    body?: string | null,
    proofLink?: string | null,
  ): Promise<string> {
    const id = crypto.randomUUID();
    await setDocById(this.collection(providerId), id, {
      providerId,
      userId,
      title,
      body: body ?? null,
      proofLink: proofLink ?? null,
      createdAt: new Date().toISOString(),
    });
    return id;
  },
};
