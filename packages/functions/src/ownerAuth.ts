import { HttpsError } from 'firebase-functions/v2/https';

/** Firebase Admin has verified the token; access still requires the server-set owner claim. */
export function requireOwner(request: { auth?: { uid?: string; token?: object } | null }): string {
  if (!request.auth?.uid) throw new HttpsError('unauthenticated', 'Sign in is required.');
  if ((request.auth.token as { owner?: unknown } | undefined)?.owner !== true) throw new HttpsError('permission-denied', 'This GameHub account is not authorized.');
  return request.auth.uid;
}
