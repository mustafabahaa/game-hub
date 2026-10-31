import { Suspense, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { TopBar } from './TopBar';
import { DesktopNav } from './DesktopNav';
import { BottomNav } from './BottomNav';

const PAGE_TITLES: Record<string, string> = {
  '/': 'GameHub — Your Vault',
  '/providers': 'GameHub — Providers',
  '/friends': 'GameHub — Friends',
  '/community': 'GameHub — Community',
};

/** Layout route — renders the nav chrome and the active page via <Outlet/>. */
export function AppShell() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Best-effort document title.
  const base = pathname.split('/')[1] || '';
  const title = PAGE_TITLES[`/${base}`] ?? (base.startsWith('providers') ? 'GameHub — Provider' : base === 'accounts' ? 'GameHub — Account' : 'GameHub');
  if (typeof document !== 'undefined') document.title = title;

  return (
    <Box
      sx={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100dvh',
        pb: { xs: 'calc(96px + env(safe-area-inset-bottom, 0px))', md: 0 },
        pl: { md: '72px' },
        overflowX: 'clip',
        isolation: 'isolate',
      }}
    >
      <DesktopNav />
      <TopBar />
      <Suspense
        fallback={
          <Box component="main" sx={{ display: 'grid', placeItems: 'center', minHeight: '50vh', maxWidth: 1440, mx: 'auto', px: { xs: 2, md: 4 } }}>
            <CircularProgress />
          </Box>
        }
      >
        <Box component="main" id="main-content" sx={{ py: { xs: 2.5, sm: 4 }, px: { xs: 2, sm: 3, md: 4, lg: 5 }, width: '100%', maxWidth: 1440, minWidth: 0, mx: 'auto' }}>
          <Outlet />
        </Box>
      </Suspense>
      <BottomNav />
    </Box>
  );
}
