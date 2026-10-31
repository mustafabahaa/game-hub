import { SystemStatusPage } from '@/components/SystemStatusPage';

/** Shown when VITE_FIREBASE_* environment variables are missing. */
export function ConfigErrorScreen() {
  return <SystemStatusPage status="configuration" actionLabel="Open Firebase Console" actionHref="https://console.firebase.google.com/" />;
}
