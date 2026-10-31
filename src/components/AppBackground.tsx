import { Paper } from '@monochrome-ui/design-system';
import type { SxProps, Theme } from '@mui/material/styles';

interface AppBackgroundProps {
  /** Kept as a compatible prop; the shared app canvas is now monochrome. */
  variant?: 'primary' | 'secondary';
  amplitude?: number;
  speed?: number;
  blend?: number;
  sx?: SxProps<Theme>;
}

/** Flat mode-aware background shared with Fitpal's product surfaces. */
export function AppBackground({ sx }: AppBackgroundProps) {
  return (
    <Paper elevation={0} variant="appBackdrop" sx={sx} />
  );
}
