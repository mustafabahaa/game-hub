import { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, CircularProgress } from '@mui/material';
import { useThemeMode } from '@/hooks/useThemeMode';
import { useAppContext } from '@/hooks/useAppContext';
import { createAppTheme } from '@/theme';
import { isFirebaseConfigured } from '@/config/firebase';
import { AppShell } from '@/components/app-shell/AppShell';
import { AuthScreen } from '@/features/auth/AuthScreen';
import { ConfigErrorScreen } from '@/components/ConfigErrorScreen';
import { McpAuthorizePage } from '@/features/auth/McpAuthorizePage';

// Lazy-load every route page so the main bundle stays small.
const Dashboard = lazy(() => import('@/features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const AccountDetailPage = lazy(() => import('@/features/accounts/AccountDetailPage').then((m) => ({ default: m.AccountDetailPage })));
const ProvidersPage = lazy(() => import('@/features/providers/ProvidersPage').then((m) => ({ default: m.ProvidersPage })));
const ProviderDetailPage = lazy(() => import('@/features/providers/ProviderDetailPage').then((m) => ({ default: m.ProviderDetailPage })));
const FriendsPage = lazy(() => import('@/features/friends/FriendsPage').then((m) => ({ default: m.FriendsPage })));
const CommunityPage = lazy(() => import('@/features/community/CommunityPage').then((m) => ({ default: m.CommunityPage })));
const CommunityProfilePage = lazy(() => import('@/features/community/CommunityProfilePage').then((m) => ({ default: m.CommunityProfilePage })));

function AppLoadingScreen() {
  return (
    <Box sx={{ position: 'fixed', inset: 0, display: 'grid', placeItems: 'center', bgcolor: 'background.default', zIndex: 9999 }}>
      <CircularProgress />
    </Box>
  );
}

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
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppLoadingScreen />
      </ThemeProvider>
    );
  }

  // Unauthenticated → show the auth screen with the neon background.
  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthScreen />
      </ThemeProvider>
    );
  }

  // Authenticated → full router tree.
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/mcp/authorize" element={<McpAuthorizePage />} />
          <Route element={<AppShell />}>
            <Route index element={<Suspense fallback={<AppLoadingScreen />}><Dashboard /></Suspense>} />
            <Route path="accounts/:id" element={<Suspense fallback={<AppLoadingScreen />}><AccountDetailPage /></Suspense>} />
            <Route path="providers" element={<Suspense fallback={<AppLoadingScreen />}><ProvidersPage /></Suspense>} />
            <Route path="providers/:id" element={<Suspense fallback={<AppLoadingScreen />}><ProviderDetailPage /></Suspense>} />
            <Route path="friends" element={<Suspense fallback={<AppLoadingScreen />}><FriendsPage /></Suspense>} />
            <Route path="community" element={<Suspense fallback={<AppLoadingScreen />}><CommunityPage /></Suspense>} />
            <Route path="community/:ownerUid" element={<Suspense fallback={<AppLoadingScreen />}><CommunityProfilePage /></Suspense>} />
            <Route path="auth" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
