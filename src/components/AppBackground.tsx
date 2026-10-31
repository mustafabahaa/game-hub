import { Box, type SxProps, type Theme } from '@mui/material';

interface AppBackgroundProps {
  /** Kept as a compatible prop; the shared app canvas is now monochrome. */
  variant?: 'primary' | 'secondary';
  amplitude?: number;
  speed?: number;
  blend?: number;
  sx?: SxProps<Theme>;
}

/** Flat mode-aware background shared with Fitpal's product surfaces. */
export function AppBackground({
  variant: _variant = 'primary',
  amplitude: _amplitude = 1.2,
  speed: _speed = 0.5,
  blend: _blend = 0.6,
  sx,
}: AppBackgroundProps) {
  return (
    <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, bgcolor: 'background.default', pointerEvents: 'none', ...sx }} />
  );
}
