import { Box, ButtonBase, Typography } from '@mui/material';
import { NavLink } from 'react-router-dom';
import { Gamepad2, Store, Users, Globe } from 'lucide-react';

const ITEMS = [
  { path: '/', label: 'Vault', icon: Gamepad2 },
  { path: '/providers', label: 'Providers', icon: Store },
  { path: '/friends', label: 'Friends', icon: Users },
  { path: '/community', label: 'Community', icon: Globe },
];

/** Full-width, safe-area aware mobile navigation matching Fitpal. */
export function BottomNav() {
  return (
    <Box
      component="nav"
      aria-label="Main navigation"
      sx={{
        display: { xs: 'block', md: 'none' }, position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 1100, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider',
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <Box sx={{ display: 'flex', maxWidth: 560, mx: 'auto', height: 72 }}>
        {ITEMS.map(({ path, label, icon: Icon }) => (
          <ButtonBase
            key={path}
            component={NavLink}
            to={path}
            end={path === '/'}
            sx={{
              flex: 1, minWidth: 0, minHeight: 48, px: 1, py: 1,
              display: 'flex', flexDirection: 'column', gap: 0.5, position: 'relative',
              color: 'text.secondary', '&.active': { color: 'text.primary' },
              '&.active::after': { content: '""', position: 'absolute', bottom: 5, width: 20, height: 2, bgcolor: 'text.primary', borderRadius: 1 },
              '&:hover': { bgcolor: 'action.hover' },
              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'text.primary', outlineOffset: -4 },
            }}
          >
            <Icon size={23} strokeWidth={1.7} />
            <Typography component="span" sx={{ fontSize: 11, fontWeight: 600, lineHeight: 1.4, color: 'inherit' }}>{label}</Typography>
          </ButtonBase>
        ))}
      </Box>
    </Box>
  );
}
