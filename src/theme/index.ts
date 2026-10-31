import { createTheme, type Theme } from '@mui/material/styles';
import './types';
import { designTokens, modeTokens, buildPalette } from './palette';
import { buildTypography } from './typography';
import { buildComponents } from './overrides';

export { designTokens } from './palette';
export { fontFamily } from './typography';
export type { ModeTokens } from './palette';
export type { PaletteColorKey } from './paletteKeys';
export { isPaletteColorKey } from './paletteKeys';

/**
 * Create the GameHub MUI theme for a mode by composing the palette,
 * typography, and component overrides modules.
 */
export function createAppTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: buildPalette(mode),
    typography: buildTypography(modeTokens(mode)),
    // MUI sx numeric radii are multipliers of shape.borderRadius. Keep the
    // 4px Fitpal base so sx={{ borderRadius: 4 }} resolves to the 16px card token.
    shape: { borderRadius: designTokens.radius.subtle },
    components: buildComponents(mode),
  });
}
