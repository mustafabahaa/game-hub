import { useState, type MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { alpha, useTheme } from '@mui/material/styles';
import { AppBar, Toolbar, Box, Typography, IconButton, Menu, MenuItem, Avatar, Stack, Tooltip, Divider, ListItemIcon, ListItemText } from '@mui/material';
import { LogOut, Moon, Sun } from 'lucide-react';
import { useAppContext } from '@/hooks/useAppContext';
import { useThemeMode } from '@/hooks/useThemeMode';
import { GameHubAssistant } from '@/components/GameHubAssistant';
import { GameHubMcpDialog } from '@/components/GameHubMcpDialog';
import { areGamehubFunctionsEnabled } from '@/config/firebase';

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
      sx={{
        pt: { xs: 'calc(env(safe-area-inset-top, 0px) + 4px)', md: 0 },
        bgcolor: (currentTheme) => alpha(currentTheme.palette.background.default, 0.88),
        backdropFilter: 'blur(16px)', borderBottom: '1px solid', borderColor: 'divider', zIndex: 1100,
      }}
    >
      <Toolbar sx={{ px: { xs: 2, sm: 3, md: 4 }, minHeight: { xs: 62, sm: 68, md: 64 } }}>
          <Box sx={{ width: '100%', maxWidth: 1360, mx: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Stack
            component="button" type="button" direction="row" spacing={1.25} alignItems="center"
            onClick={() => navigate('/')} aria-label="GameHub home"
            sx={{
              display: { xs: 'flex', md: 'none' }, flexShrink: 0, minWidth: 0, cursor: 'pointer',
              bgcolor: 'transparent', border: 0, p: 0, color: 'inherit',
              '&:focus-visible': { outline: '2px solid', outlineColor: 'text.primary', outlineOffset: 4 },
            }}
          >
            <Box component="img" src="/logo-black.png" alt="" sx={{ height: 34, width: 34, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
            <Typography sx={{ fontSize: 24, lineHeight: '30px', fontWeight: 800, letterSpacing: '-0.01em', color: 'text.primary' }}>GameHub</Typography>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1.25} sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Workspace</Typography>
            <Typography aria-hidden sx={{ fontSize: 13, color: 'text.secondary' }}>/</Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 600, color: 'text.primary' }}>{section}</Typography>
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
              <IconButton onClick={(event: MouseEvent<HTMLElement>) => setMenuEl(event.currentTarget)} aria-label="Account menu" sx={{ p: 0.5, width: 40, height: 40, borderRadius: 999, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'action.hover', borderColor: 'text.disabled' } }}>
                <Avatar src={user?.photoURL ?? undefined} sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', filter: user?.photoURL ? 'grayscale(1)' : undefined, fontSize: 13, fontWeight: 700 }}>
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
          paper: { sx: { width: { xs: 'min(240px, calc(100vw - 32px))', sm: 240 }, mt: 1, overflow: 'hidden', borderRadius: '16px', border: '1px solid', borderColor: 'divider' } },
          list: { sx: { py: 1, px: 0.5 } },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5 }}>
          <Avatar src={user?.photoURL ?? undefined} sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: 'primary.main', color: 'primary.contrastText', filter: user?.photoURL ? 'grayscale(1)' : undefined, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
            {!user?.photoURL ? initials : null}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700, fontSize: 14, color: 'text.primary' }} noWrap>{user?.displayName || 'GameHub account'}</Typography>
            <Typography sx={{ fontSize: 12, color: 'text.secondary' }} noWrap>{user?.email}</Typography>
          </Box>
        </Box>
        <Divider sx={{ my: 1, mx: 1.5 }} />
        <MenuItem onClick={() => { setMenuEl(null); void logout(); }} sx={{ mx: 0.5, my: 0.5, minHeight: 44, borderRadius: 2 }}>
          <ListItemIcon sx={{ minWidth: 36 }}><LogOut size={18} /></ListItemIcon>
          <ListItemText primary="Sign out" slotProps={{ primary: { fontSize: 14, fontWeight: 600 } }} />
        </MenuItem>
      </Menu>
    </AppBar>
  );
}
