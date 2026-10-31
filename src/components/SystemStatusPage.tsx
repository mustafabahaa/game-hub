import { Button, SystemStatusLayout } from '@monochrome-ui/design-system';
import { Link } from 'react-router-dom';

export type SystemStatus = 'notFound' | 'error' | 'configuration';

interface SystemStatusPageProps {
  status: SystemStatus;
  description?: string;
  onRetry?: () => void;
  actionLabel?: string;
  actionHref?: string;
}

const statusContent: Record<SystemStatus, { code: string; title: string; description: string }> = {
  notFound: {
    code: '404',
    title: 'Page not found',
    description: 'This page may have moved, or the address may be incorrect.',
  },
  error: {
    code: 'ERROR',
    title: 'Something went wrong',
    description: 'GameHub hit an unexpected problem. Reload the page to try again.',
  },
  configuration: {
    code: 'SETUP',
    title: "GameHub isn't configured",
    description: 'The app needs VITE_FIREBASE_* environment variables. Copy .env.example to .env, add your Firebase web config, then restart the dev server.',
  },
};

export function SystemStatusPage({ status, description, onRetry, actionLabel, actionHref }: SystemStatusPageProps) {
  const content = statusContent[status];
  const action = onRetry ? (
    <Button variant="contained" onClick={onRetry}>{actionLabel ?? 'Reload page'}</Button>
  ) : actionHref ? (
    <Button variant="contained" href={actionHref} target="_blank" rel="noreferrer">{actionLabel ?? 'Open Firebase Console'}</Button>
  ) : (
    <Button component={Link} to="/" variant="contained">Back to GameHub</Button>
  );

  const statusDescription = status === 'configuration'
    ? `${description ?? content.description} Required variables include VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID.`
    : description ?? content.description;

  return (
    <SystemStatusLayout
      logoSrc="/logo-black.png"
      code={content.code}
      title={content.title}
      description={statusDescription}
      action={action}
    />
  );
}
