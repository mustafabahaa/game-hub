import { Box, ButtonBase, Tooltip } from '@mui/material';
import { NavLink, useNavigate } from 'react-router-dom';
import { Gamepad2, Store, Users, Globe, Plus } from 'lucide-react';

const ITEMS = [
  { path: '/', label: 'Vault', icon: Gamepad2 },
  { path: '/providers', label: 'Providers', icon: Store },
  { path: '/friends', label: 'Friends', icon: Users },
  { path: '/community', label: 'Community', icon: Globe },
];

/** Fitpal-style fixed navigation rail for desktop and tablet workspaces. */
export function DesktopNav() {
  const navigate = useNavigate();

  return (
    <Box
      component="aside"
      aria-label="Workspace sidebar"
      sx={{
        display: { xs: 'none', md: 'flex' },
        position: 'fixed', inset: '0 auto 0 0', width: 72, zIndex: 1200,
        bgcolor: 'background.surfaceOffWhite', borderRight: '1px solid', borderColor: 'divider',
        flexDirection: 'column', alignItems: 'center', px: 1.25, py: 2.25,
      }}
    >
      <Tooltip title="GameHub" placement="right">
        <ButtonBase component={NavLink} to="/" aria-label="GameHub home" sx={{ width: 48, height: 48, mb: 2, borderRadius: 2, '&:hover': { opacity: 0.8 } }}>
          <Box component="img" src="/logo-black.png" alt="" sx={{ width: 30, height: 30, objectFit: 'contain', filter: (theme) => theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
        </ButtonBase>
      </Tooltip>

      <Box component="nav" aria-label="Desktop navigation" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.25 }}>
        {ITEMS.map(({ path, label, icon: Icon }) => (
          <Tooltip key={path} title={label} placement="right" disableFocusListener>
            <ButtonBase
              component={NavLink}
              to={path}
              end={path === '/'}
              aria-label={label}
              sx={{
                width: 48, height: 48, borderRadius: 3, color: 'text.secondary',
                '&.active': { bgcolor: 'action.selected', color: 'text.primary' },
                '&:not(.active):hover': { bgcolor: 'action.hover', color: 'text.primary' },
                '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'text.primary', outlineOffset: 2 },
              }}
            >
              <Icon size={22} strokeWidth={1.8} />
            </ButtonBase>
          </Tooltip>
        ))}
      </Box>

      <Tooltip title="Add account" placement="right" disableFocusListener>
        <ButtonBase
          onClick={() => navigate('/?action=add-account')}
          aria-label="Add account"
          sx={{
            width: 48, height: 48, mb: 2, borderRadius: '50%',
            bgcolor: 'text.primary', color: 'background.default',
            '&:hover': { opacity: 0.82 },
            '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'text.primary', outlineOffset: 2 },
          }}
        >
          <Plus size={22} strokeWidth={1.8} />
        </ButtonBase>
      </Tooltip>
    </Box>
  );
}
