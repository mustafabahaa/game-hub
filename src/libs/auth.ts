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

export const authLib = {
  /** Subscribe to auth state. Returns an unsubscribe fn. */
  onAuthStateChanged(cb: (user: GameHubUser | null) => void) {
    return fsOnAuthStateChanged(requireAuth(), (u) => cb(u ? toGameHubUser(u) : null));
  },

  /** Google sign-in via popup, falling back to redirect on iOS Safari popup-block. */
  async signInWithGoogle(): Promise<GameHubUser | null> {
    const a = requireAuth();
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(a, provider);
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
      return result?.user ? toGameHubUser(result.user) : null;
    } catch {
      return null;
    }
  },

  async logout(): Promise<void> {
    await fsSignOut(requireAuth());
  },
};
