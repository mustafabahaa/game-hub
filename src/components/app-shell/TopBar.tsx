import { useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Box, Typography, IconButton, Menu, MenuItem, Avatar, Stack, BrandButton, Tooltip, Divider, ListItemIcon, ListItemText } from '@monochrome-ui/design-system';
import { LogoutIcon as LogOut, DarkModeIcon as Moon, LightModeIcon as Sun } from '@/components/AppIcon';
import { useAppContext } from '@/hooks/useAppContext';
import { useThemeMode } from '@/hooks/useThemeMode';
import { GameHubAssistant } from '@/components/GameHubAssistant';
import { GameHubMcpDialog } from '@/components/GameHubMcpDialog';
import { areGamehubFunctionsEnabled } from '@/libs/appConfig';
import { BrandMark } from '@monochrome-ui/design-system';

const SECTIONS: Array<[string, string]> = [
  ['/', 'Vault'], ['/providers', 'Providers'],
];

export function TopBar() {
  const { user, logout } = useAppContext();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { setModePref } = useThemeMode();
  const [menuEl, setMenuEl] = useState<HTMLElement | null>(null);
  const section = SECTIONS.find(([path]) => path === '/' ? pathname === '/' : pathname.startsWith(path))?.[1] ?? 'Vault';
  const initials = (user?.displayName ?? 'G').split(' ').map((word) => word[0]).slice(0, 2).join('').toUpperCase();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      variant="shellBar"
      sx={{ pt: { xs: 'calc(env(safe-area-inset-top, 0px) + 4px)', md: 0 }, zIndex: 1100 }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 }, minHeight: { xs: 62, sm: 68, md: 64 } }}>
          <Box sx={{ width: '100%', maxWidth: 1360, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <BrandButton
            component="button" type="button"
            onClick={() => navigate('/')} aria-label="GameHub home"
            sx={{
              display: { xs: 'flex', md: 'none' }, flexShrink: 0, minWidth: 0, cursor: 'pointer',
              flexDirection: 'row', gap: 1.25,
            }}
          >
            <BrandMark src="/logo-black.png" alt="" size={34} />
            <Typography variant="brandWordmark">GameHub</Typography>
          </BrandButton>

          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Typography variant="breadcrumb">Workspace</Typography>
            <Typography aria-hidden variant="breadcrumb">/</Typography>
            <Typography variant="breadcrumbCurrent">{section}</Typography>
          </Stack>

          <Stack direction="row" spacing={0.5} alignItems="center">
            {areGamehubFunctionsEnabled && <GameHubAssistant />}
            {areGamehubFunctionsEnabled && <GameHubMcpDialog />}
            <Tooltip title={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`} disableFocusListener>
              <IconButton
                aria-label={`Switch to ${theme.palette.mode === 'dark' ? 'light' : 'dark'} mode`}
                onClick={() => setModePref(theme.palette.mode === 'dark' ? 'light' : 'dark')}
                sx={{ width: 40, height: 40 }}
              >
                {theme.palette.mode === 'dark' ? <Sun size={20} strokeWidth={1.7} /> : <Moon size={20} strokeWidth={1.7} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Account" disableFocusListener>
              <IconButton variant="userMenuTrigger" onClick={(event: MouseEvent<HTMLElement>) => setMenuEl(event.currentTarget)} aria-label="Account menu">
                <Avatar variant="profile" src={user?.photoURL ?? undefined}>
                  {!user?.photoURL ? initials : null}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Toolbar>

      <Menu
        anchorEl={menuEl}
        open={Boolean(menuEl)}
        onClose={() => setMenuEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: { variant: 'popoverMenuSurface', sx: { width: { xs: 'min(240px, calc(100vw - 32px))', sm: 240 } } },
          list: { sx: { py: 1, px: 0.5 } },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
          <Avatar variant="profile" src={user?.photoURL ?? undefined} sx={{ width: 36, height: 36, flexShrink: 0 }}>
            {!user?.photoURL ? initials : null}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="userName" noWrap>{user?.displayName || 'GameHub account'}</Typography>
            <Typography variant="userDetail" noWrap>{user?.email}</Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 1, mx: 1.5 }} />
        <MenuItem variant="menuAction" onClick={() => { setMenuEl(null); void logout(); }} sx={{ mx: 0.5, my: 0.5, minHeight: 44 }}>
          <ListItemIcon sx={{ minWidth: 36 }}><LogOut size={18} /></ListItemIcon>
          <ListItemText primary="Sign out" slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }} />
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
