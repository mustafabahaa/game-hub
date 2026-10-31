import type { Theme } from '@mui/material/styles';
import { createMonochromeTheme } from '@monochrome-ui/design-system/theme';
import { designTokens } from '@monochrome-ui/design-system/tokens';
import './types';

export { designTokens };
export const fontFamily = designTokens.typography.fontFamily;

/** Apply GameHub's content-only platform labels to the shared theme. */
export function createAppTheme(mode: 'light' | 'dark'): Theme {
  return createMonochromeTheme(mode, {
    palette: {
      text: { primary: mode === 'dark' ? '#FFFFFF' : '#0D0D0D' },
      playStation: { main: '#404040', contrastText: '#FFFFFF' },
      xbox: { main: '#525252', contrastText: '#FFFFFF' },
      pc: { main: '#737373', contrastText: '#FFFFFF' },
      gold: { main: '#8A8A8A', light: '#A3A3A3', contrastText: '#0D0D0D' },
      background: {
        surfaceOffWhite: mode === 'dark' ? designTokens.dark.surfaceOffWhite : designTokens.color.surfaceOffWhite,
      },
    },
  });
}
