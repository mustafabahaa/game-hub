import { Box, MobileNavigationItem, Paper, Typography } from '@monochrome-ui/design-system';
import { NavLink } from 'react-router-dom';
import { GamepadIcon as Gamepad2, ShopIcon as Store } from '@/components/AppIcon';
const ITEMS = [
  { path: '/', label: 'Vault', icon: Gamepad2 },
  { path: '/providers', label: 'Providers', icon: Store },
];

/** Full-width, safe-area aware mobile navigation matching Fitpal. */
export function BottomNav() {
  return (
    <Paper
      elevation={0}
      variant="mobileDock"
      component="nav"
      aria-label="Main navigation"
    >
      <Box sx={{ display: 'flex', maxWidth: 560, mx: 'auto', height: 72 }}>
        {ITEMS.map(({ path, label, icon: Icon }) => (
          <MobileNavigationItem
            key={path}
            component={NavLink}
            to={path}
            end={path === '/'}
          >
            <Icon size={23} strokeWidth={1.7} />
            <Typography component="span" variant="navigationLabel">{label}</Typography>
          </MobileNavigationItem>
        ))}
      </Box>
    </Paper>
  );
}
