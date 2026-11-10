/**
 * Generic Firestore data-access layer.
 *
 * Two path shapes:
 * - Per-user (private): `users/{uid}/{collection}/{docId}` — accounts, games
 *   (nested under accounts), etc.
 * - User-owned provider directory entries: `providers` docs include `userId`
 *   and are filtered and security-ruled to that owner.
 */
import {
  doc,
  getDoc as fsGetDoc,
  getDocs,
  setDoc as fsSetDoc,
  updateDoc as fsUpdateDoc,
  deleteDoc as fsDeleteDoc,
  collection,
  query,
  orderBy,
  limit as fsLimit,
  where,
  type DocumentData,
  type WhereFilterOp,
  type OrderByDirection,
} from 'firebase/firestore';
import { requireDb } from '@/config/firebase';

/* ---------- per-user path helpers ---------- */

export function userCollectionPath(uid: string, collectionName: string): string {
  return `users/${uid}/${collectionName}`;
}

export function userDocPath(uid: string, collectionName: string, docId: string): string {
  return `users/${uid}/${collectionName}/${docId}`;
}

/* ---------- generic primitives ---------- */

export type FilterOp = WhereFilterOp;
export interface WhereClause {
  field: string;
  op: FilterOp;
  value: unknown;
}

/** Read a single doc by full path. Returns undefined if missing. */
export async function getByPath<T>(path: string): Promise<T | undefined> {
  const db = requireDb();
  const ref = doc(db, path);
  const snap = await fsGetDoc(ref);
  return snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : undefined;
}

export async function getDocById<T>(
  collectionPath: string,
  docId: string,
): Promise<T | undefined> {
  return getByPath<T>(`${collectionPath}/${docId}`);
}

export interface ListOptions {
  wheres?: WhereClause[];
  orderField?: string;
  orderDirection?: OrderByDirection;
  limit?: number;
}

/** List a collection with optional filters + ordering. */
export async function listDocs<T>(
  collectionPath: string,
  options?: ListOptions,
): Promise<T[]> {
  const db = requireDb();
  const constraints = [];
  if (options?.wheres) {
    for (const w of options.wheres) {
      constraints.push(where(w.field, w.op, w.value as never));
    }
  }
  if (options?.orderField) {
    constraints.push(orderBy(options.orderField, options.orderDirection ?? 'desc'));
  }
  if (options?.limit) constraints.push(fsLimit(options.limit));
  const q = query(collection(db, collectionPath), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T);
}

/** Upsert a doc by id (merge: true, fitpal convention). */
export async function setDocById<T extends DocumentData>(
  collectionPath: string,
  docId: string,
  data: T,
): Promise<void> {
  const db = requireDb();
  await fsSetDoc(doc(db, collectionPath, docId), data, { merge: true });
}

export async function updateDocById(collectionPath: string, docId: string, data: DocumentData): Promise<void> {
  await fsUpdateDoc(doc(requireDb(), collectionPath, docId), data);
}

/** Upsert a doc by full path. */
export async function setByPath(data: DocumentData, path: string): Promise<void> {
  const db = requireDb();
  await fsSetDoc(doc(db, path), data, { merge: true });
}

export async function deleteDocById(collectionPath: string, docId: string): Promise<void> {
  const db = requireDb();
  await fsDeleteDoc(doc(db, collectionPath, docId));
}

export async function deleteByPath(path: string): Promise<void> {
  const db = requireDb();
  await fsDeleteDoc(doc(db, path));
}
