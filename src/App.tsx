import { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@monochrome-ui/design-system';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useAppContext } from '@/hooks/useAppContext';
import { createAppTheme } from '@/theme';
import { isFirebaseConfigured } from '@/libs/appConfig';
import { AppShell } from '@/components/app-shell/AppShell';
import { AppLoadingScreen } from '@/components/app-shell/AppLoadingScreen';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';
import { McpAuthorizePage } from '@/features/auth/McpAuthorizePage';
import { SystemStatusPage } from '@/components/SystemStatusPage';
import { AppErrorBoundary } from '@/components/AppErrorBoundary';

// Lazy-load every route page so the main bundle stays small.
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const AccountDetailPage = lazy(() => import('@/features/accounts/AccountDetailPage').then((m) => ({ default: m.AccountDetailPage })));
const ProvidersPage = lazy(() => import('@/features/providers/ProvidersPage').then((m) => ({ default: m.ProvidersPage })));
const ProviderDetailPage = lazy(() => import('@/features/providers/ProviderDetailPage').then((m) => ({ default: m.ProviderDetailPage })));

export default function App() {
  const { resolvedMode } = useThemeMode();
  const { user, isAuthLoading } = useAppContext();
  const theme = useMemo(() => createAppTheme(resolvedMode), [resolvedMode]);

  // Guard: Firebase env not configured.
  if (!isFirebaseConfigured) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ConfigErrorScreen />
      </ThemeProvider>
    );
  }

  // Auth still resolving.
  if (isAuthLoading) {
    return <AppLoadingScreen theme={theme} />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppErrorBoundary>
          <Routes>
            <Route path="/mcp/authorize" element={user ? <McpAuthorizePage /> : <AuthScreen />} />
            {user ? (
              <>
                <Route element={<AppShell />}>
                  <Route index element={<Suspense fallback={<AppLoadingScreen theme={theme} />}><Dashboard /></Suspense>} />
                  <Route path="accounts/:id" element={<Suspense fallback={<AppLoadingScreen theme={theme} />}><AccountDetailPage /></Suspense>} />
                  <Route path="providers" element={<Suspense fallback={<AppLoadingScreen theme={theme} />}><ProvidersPage /></Suspense>} />
                  <Route path="providers/:id" element={<Suspense fallback={<AppLoadingScreen theme={theme} />}><ProviderDetailPage /></Suspense>} />
                  <Route path="auth" element={<AuthScreen />} />
                </Route>
                <Route path="*" element={<SystemStatusPage status="notFound" />} />
              </>
            ) : (
              <>
                <Route path="/" element={<AuthScreen />} />
                <Route path="/accounts/:id" element={<AuthScreen />} />
                <Route path="/providers" element={<AuthScreen />} />
                <Route path="/providers/:id" element={<AuthScreen />} />
                <Route path="*" element={<SystemStatusPage status="notFound" />} />
              </>
            )}
          </Routes>
        </AppErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  );
}
