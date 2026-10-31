/**
 * Generic Firestore data-access layer.
 *
 * Two path shapes:
 * - Per-user (private): `users/{uid}/{collection}/{docId}` — accounts, games
 *   (nested under accounts), etc.
 * - Global (public/social): top-level collections — `providers`, `profiles`,
 *   `friendRequests`, `publicGames`, `sharedAccounts`.
 */
import {
  doc,
  getDoc as fsGetDoc,
  getDocs,
  setDoc as fsSetDoc,
  deleteDoc as fsDeleteDoc,
  collection,
  query,
  orderBy,
  limit as fsLimit,
  startAfter,
  where,
  onSnapshot,
  type DocumentData,
  type Unsubscribe,
  type WhereFilterOp,
  type OrderByDirection,
  type QueryDocumentSnapshot,
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

export type PageCursor = QueryDocumentSnapshot<DocumentData>;

export interface CursorPage<T> {
  items: T[];
  nextCursor: PageCursor | null;
  hasMore: boolean;
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

/** Fetch one cursor-based page without reading the rest of a collection. */
export async function listDocsPage<T>(
  collectionPath: string,
  pageSize: number,
  options: Omit<ListOptions, 'limit'>,
  cursor?: PageCursor | null,
): Promise<CursorPage<T>> {
  const db = requireDb();
  const constraints = [];
  if (options.wheres) {
    for (const w of options.wheres) constraints.push(where(w.field, w.op, w.value as never));
  }
  if (options.orderField) constraints.push(orderBy(options.orderField, options.orderDirection ?? 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(fsLimit(pageSize + 1));

  const snap = await getDocs(query(collection(db, collectionPath), ...constraints));
  const hasMore = snap.docs.length > pageSize;
  const pageDocs = snap.docs.slice(0, pageSize);
  return {
    items: pageDocs.map((d) => ({ id: d.id, ...d.data() }) as T),
    nextCursor: hasMore ? pageDocs[pageDocs.length - 1] ?? null : null,
    hasMore,
  };
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

/* ---------- realtime (onSnapshot) — replaces Supabase realtime ---------- */

/** Watch a whole collection; callback fires on every change. */
export function watchCollection<T>(
  collectionPath: string,
  cb: (items: T[]) => void,
  options?: ListOptions,
): Unsubscribe {
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
  const q = query(collection(db, collectionPath), ...constraints);
  return onSnapshot(
    q,
    (snap) => cb(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as T)),
  );
}

/** Watch a single doc by path. */
export function watchPath<T>(path: string, cb: (item: T | undefined) => void): Unsubscribe {
  const db = requireDb();
  return onSnapshot(doc(db, path), (snap) =>
    cb(snap.exists() ? ({ id: snap.id, ...snap.data() } as T) : undefined),
  );
}
