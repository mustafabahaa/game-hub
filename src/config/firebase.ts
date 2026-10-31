import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

export const isFirebaseReady = isFirebaseConfigured;
export const areGamehubFunctionsEnabled = import.meta.env.VITE_GAMEHUB_FUNCTIONS_ENABLED === 'true';

let firebaseApp: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured) {
  // Idempotent init — safe under Vite HMR.
  firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  auth = getAuth(firebaseApp);

  // Persistent IndexedDB cache powers offline reads + write buffering, matching
  // the kippa/fitpal pattern. ignoreUndefinedProperties keeps our TS-shaped docs happy.
  db = initializeFirestore(firebaseApp, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
    ignoreUndefinedProperties: true,
  });

  storage = getStorage(firebaseApp);
}

function requireInstance<T>(instance: T | undefined, name: string): T {
  if (!instance) {
    throw new Error(
      `${name} is not initialized. Check that VITE_FIREBASE_* env vars are set.`,
    );
  }
  return instance;
}

export function requireAuth(): Auth {
  return requireInstance(auth, 'Firebase Auth');
}

export function requireDb(): Firestore {
  return requireInstance(db, 'Firestore');
}

export function requireStorage(): FirebaseStorage {
  return requireInstance(storage, 'Firebase Storage');
}

export { firebaseApp, auth, db, storage };
