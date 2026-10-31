import { Box, BrandButton, NavigationAction, NavigationItem, Paper, Tooltip } from '@monochrome-ui/design-system';
import { NavLink, useNavigate } from 'react-router-dom';
import { GamepadIcon as Gamepad2, ShopIcon as Store, AddIcon as Plus } from '@/components/AppIcon';
import { BrandMark } from '@monochrome-ui/design-system';
const ITEMS = [
  { path: '/', label: 'Vault', icon: Gamepad2 },
  { path: '/providers', label: 'Providers', icon: Store },
];

/** Fitpal-style fixed navigation rail for desktop and tablet workspaces. */
export function DesktopNav() {
  const navigate = useNavigate();

  return (
    <Paper
      elevation={0}
      variant="desktopRail"
      component="aside"
      aria-label="Workspace sidebar"
      sx={{ px: 1.25, py: 2.25 }}
    >
      <Tooltip title="GameHub" placement="right">
        <BrandButton component={NavLink} to="/" aria-label="GameHub home" sx={{ mb: 2 }}>
          <BrandMark src="/logo-black.png" alt="" />
        </BrandButton>
      </Tooltip>

      <Box component="nav" aria-label="Desktop navigation" sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.25 }}>
        {ITEMS.map(({ path, label, icon: Icon }) => (
          <Tooltip key={path} title={label} placement="right" disableFocusListener>
            <NavigationItem
              component={NavLink}
              to={path}
              end={path === '/'}
              aria-label={label}
            >
              <Icon size={22} strokeWidth={1.8} />
            </NavigationItem>
          </Tooltip>
        ))}
      </Box>

      <Tooltip title="Add account" placement="right" disableFocusListener>
        <NavigationAction
          onClick={() => navigate('/?action=add-account')}
          aria-label="Add account"
          sx={{ mb: 2 }}
        >
          <Plus size={22} strokeWidth={1.8} />
        </NavigationAction>
      </Tooltip>
    </Paper>
  );
}
