import { randomBytes } from 'node:crypto';
import { decryptJsonCredential, encryptJsonCredential } from '@monochrome-ai/core';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';

export const gamehubAiEncryptionKey = defineSecret('GAMEHUB_AI_ENCRYPTION_KEY');
export type AiProvider = 'codex';
export type ProviderCredential = Record<string, unknown>;

type StoredCredential = {
  provider: AiProvider;
  ciphertext: string;
  iv: string;
  tag: string;
  updatedAt: number;
  lock?: { id: string; until: number } | null;
};

const COLLECTION = 'gamehubAiCredentials';
const LEASE_MS = 2 * 60 * 1000;
const HEARTBEAT_MS = 20 * 1000;

function keyBytes(): Buffer {
  const raw = gamehubAiEncryptionKey.value() || process.env.GAMEHUB_AI_ENCRYPTION_KEY;
  if (!raw) throw new Error('GAMEHUB_AI_ENCRYPTION_KEY is not configured');
  const key = /^[0-9a-f]{64}$/i.test(raw) ? Buffer.from(raw, 'hex') : Buffer.from(raw, 'base64');
  if (key.length !== 32) throw new Error('GAMEHUB_AI_ENCRYPTION_KEY must be a 32-byte base64 or hex value');
  return key;
}

function encrypt(value: ProviderCredential, uid: string, provider: AiProvider) {
  return encryptJsonCredential(value, keyBytes(), `${uid}:${provider}`);
}

function decrypt(stored: StoredCredential, uid: string, provider: AiProvider): ProviderCredential {
  return decryptJsonCredential(stored, keyBytes(), `${uid}:${provider}`);
}

function ref(uid: string, provider: AiProvider) {
  return getFirestore().collection(COLLECTION).doc(`${uid}_${provider}`);
}
function assertUid(uid: string) {
  if (!uid || uid.length > 128 || !/^[A-Za-z0-9:_-]+$/.test(uid)) throw new Error('Invalid user id');
}

export async function hasProviderCredential(uid: string, provider: AiProvider): Promise<boolean> {
  assertUid(uid);
  const value = (await ref(uid, provider).get()).data() as StoredCredential | undefined;
  return Boolean(value?.ciphertext && value.iv && value.tag);
}

/** Runs a credential operation under a Firestore lease; credentials never leave this module. */
export async function withProviderCredential<T>(
  uid: string,
  provider: AiProvider,
  callback: (credential: ProviderCredential | null, save: (next: ProviderCredential) => Promise<void>) => Promise<T>,
): Promise<T> {
  assertUid(uid);
  const document = ref(uid, provider);
  const lockId = randomBytes(18).toString('hex');
  let current: StoredCredential | undefined;
  await getFirestore().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(document);
    const value = snapshot.data() as StoredCredential | undefined;
    if (value?.lock && value.lock.until > Date.now() && value.lock.id !== lockId)
      throw new HttpsError('aborted', 'Your AI connection is busy. Wait for the current request to finish.');
    current = value;
    transaction.set(document, { ...(value ?? { provider }), provider, lock: { id: lockId, until: Date.now() + LEASE_MS } }, { merge: true });
  });
  let latest: ProviderCredential | null = null;
  let stopped = false;
  const heartbeat = setInterval(() => {
    if (stopped) return;
    void getFirestore().runTransaction(async (transaction) => {
      const value = (await transaction.get(document)).data() as StoredCredential | undefined;
      if (value?.lock?.id === lockId) transaction.update(document, { 'lock.until': Date.now() + LEASE_MS });
    }).catch(() => undefined);
  }, HEARTBEAT_MS);
  const save = async (next: ProviderCredential) => {
    latest = next;
    const encrypted = encrypt(next, uid, provider);
    await getFirestore().runTransaction(async (transaction) => {
      const value = (await transaction.get(document)).data() as StoredCredential | undefined;
      if (value?.lock?.id !== lockId) throw new Error('GameHub AI credential lock expired');
      transaction.update(document, { ...encrypted, provider, updatedAt: Date.now(), lock: { id: lockId, until: Date.now() + LEASE_MS } });
    });
  };
  try {
    latest = current?.ciphertext ? decrypt(current, uid, provider) : null;
    return await callback(latest, save);
  } finally {
    stopped = true;
    clearInterval(heartbeat);
    const encrypted = latest ? encrypt(latest, uid, provider) : undefined;
    await getFirestore().runTransaction(async (transaction) => {
      const value = (await transaction.get(document)).data() as StoredCredential | undefined;
      if (value?.lock?.id !== lockId) return;
      if (encrypted) transaction.update(document, { ...encrypted, provider, updatedAt: Date.now(), lock: null });
      else transaction.update(document, { lock: null });
    }).catch(() => undefined);
  }
}

export async function disconnectProviderCredential(uid: string, provider: AiProvider) {
  assertUid(uid);
  const document = ref(uid, provider);
  await getFirestore().runTransaction(async (transaction) => {
    const value = (await transaction.get(document)).data() as StoredCredential | undefined;
    if (value?.lock && value.lock.until > Date.now()) throw new HttpsError('aborted', 'Your AI connection is busy. Wait for the current request to finish.');
    transaction.delete(document);
  });
}
