/**
 * Auth helpers — Google sign-in (popup → redirect fallback), session watch, logout.
 * Modeled on fitpal's authLib.
 */
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged as fsOnAuthStateChanged,
  signOut as fsSignOut,
  type User,
} from 'firebase/auth';
import { requireAuth } from '@/config/firebase';

export interface GameHubUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string | null;
}

function toGameHubUser(user: User): GameHubUser {
  return {
    uid: user.uid,
    displayName: user.displayName ?? (user.email?.split('@')[0] ?? 'Player'),
    email: user.email ?? '',
    photoURL: user.photoURL,
  };
}

async function hasOwnerClaim(user: User, forceRefresh = false): Promise<boolean> {
  const token = await user.getIdTokenResult(forceRefresh);
  return token.claims.owner === true;
}

function withTimeout<T>(promise: Promise<T>, milliseconds: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('Owner access verification timed out.')), milliseconds);
    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

function accessDeniedError() {
  return Object.assign(new Error('This Google account is not authorized to use GameHub.'), { code: 'gamehub/access-denied' });
}

export const authLib = {
  /** Read the current session token for first-party consent endpoints. */
  async getCurrentIdToken(): Promise<string | null> {
    return (await requireAuth().currentUser?.getIdToken()) ?? null;
  },
  /** Subscribe to auth state. Returns an unsubscribe fn. */
  onAuthStateChanged(cb: (user: GameHubUser | null, denied?: boolean) => void) {
    return fsOnAuthStateChanged(requireAuth(), async (user) => {
      if (!user) { cb(null); return; }
      try {
        if (await withTimeout(hasOwnerClaim(user), 8_000)) { cb(toGameHubUser(user)); return; }
        cb(null, true);
        await fsSignOut(requireAuth());
      } catch (error) {
        console.error('Could not verify GameHub owner access:', error);
        cb(null);
        await fsSignOut(requireAuth()).catch(() => undefined);
      }
    });
  },

  /** Google sign-in via popup, falling back to redirect on iOS Safari popup-block. */
  async signInWithGoogle(): Promise<GameHubUser | null> {
    const a = requireAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(a, provider);
      if (!(await withTimeout(hasOwnerClaim(result.user, true), 8_000))) {
        await fsSignOut(a);
        throw accessDeniedError();
      }
      return toGameHubUser(result.user);
    } catch (error) {
      const code = (error as { code?: string })?.code;
      if (code === 'auth/popup-blocked' || code === 'auth/cancel-popup-request') {
        await signInWithRedirect(a, provider);
        return null; // result picked up by handleRedirectResult() on next mount
      }
      throw error;
    }
  },

  /** Call once on mount to resolve a redirect sign-in (iOS Safari flow). */
  async handleRedirectResult(): Promise<GameHubUser | null> {
    try {
      const result = await getRedirectResult(requireAuth());
      if (result?.user && !(await withTimeout(hasOwnerClaim(result.user, true), 8_000))) {
        await fsSignOut(requireAuth());
        throw accessDeniedError();
      }
      return result?.user ? toGameHubUser(result.user) : null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await fsSignOut(requireAuth());
  },
};
