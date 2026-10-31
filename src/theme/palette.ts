import './types';
import type { PaletteOptions, ThemeOptions } from '@mui/material/styles';

/**
 * GameHub design tokens — Fitpal's monochrome design system, with platform
 * accent keys retained for data compatibility and mapped to neutral tones.
 *
 * Identity decisions:
 *  - Neutral surfaces and inverted black/white primary controls, matching Fitpal.
 *  - Platform keys remain available to avoid breaking existing account views.
 */
export const designTokens = {
  color: {
    primary: '#0D0D0D',
    primaryContainer: '#0D0D0D',
    onPrimary: '#FFFFFF',
    primaryFixed: '#E5E5E5',
    primaryFixedDim: '#D4D4D4',

    // Secondary (cyan — the signature accent end)
    secondary: '#5D5D5D',
    secondaryContainer: '#737373',
    onSecondary: '#FFFFFF',

    // Tertiary (neutral slate — used sparingly)
    tertiary: '#737373',
    tertiaryContainer: '#A3A3A3',

    // Semantic
    success: '#5D5D5D',
    warning: '#525252',
    error: '#BA1A1A',
    onError: '#FFFFFF',

    // Platform accents (content-driven, NOT chrome)
    playStation: '#404040',
    xbox: '#525252',
    pc: '#737373',
    gold: '#8A8A8A',
    goldLight: '#A3A3A3',

    // Surfaces (light)
    surface: '#FFFFFF',
    surfacePure: '#ffffff',
    surfaceOffWhite: '#F9F9F9',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#F7F7F8',
    surfaceContainer: '#EFEFEF',
    surfaceContainerHigh: '#E9E9E9',
    surfaceContainerHighest: '#E4E4E4',
    surfaceDim: '#E9E9E9',
    infoAccent: '#F7F7F8',

    // Text (light)
    textPrimary: '#0D0D0D',
    textSecondary: '#666666',
    textTertiary: '#8F8F8F',
    disabled: '#A3A3A3',

    // Borders (light)
    borderGray: '#EAEAEA',
    outline: '#5D5D5D',
    outlineVariant: '#D4D4D4',
  },

  // Dark-mode overrides (only the mode-dependent subset)
  dark: {
    surface: '#212121',
    surfacePure: '#2A2A2A',
    surfaceOffWhite: '#171717',
    surfaceContainerLow: '#262626',
    surfaceContainer: '#2F2F2F',
    surfaceContainerHigh: '#383838',
    surfaceContainerHighest: '#414141',
    infoAccent: '#2F2F2F',

    textPrimary: '#ECECEC',
    textSecondary: '#B4B4B4',
    textTertiary: '#8F8F8F',
    disabled: '#6E6E6E',

    borderGray: '#333333',
    outline: '#A3A3A3',
    outlineVariant: '#414141',
  },

  // Elevation shadows (kippa)
  shadow: {
    raised: 'rgba(0, 0, 0, 0.12) 0px 2px 6px 0px, rgb(218, 220, 224) 0px -1px 0px 0px inset',
    lifted: 'rgba(0, 0, 0, 0.15) 0px 4px 12px 0px',
  },

  // Spacing (4px base)
  spacing: {
    base: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    cardPadding: 24,
    touchTarget: 48,
  },

  // Radius
  radius: {
    none: 0,
    subtle: 4,
    moderate: 12,
    card: 16,
    pill: 999,
  },
} as const;

export interface ModeTokens {
  surface: string;
  surfacePure: string;
  surfaceOffWhite: string;
  surfaceContainerLow: string;
  surfaceContainer: string;
  surfaceContainerHigh: string;
  surfaceContainerHighest: string;
  infoAccent: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  disabled: string;
  borderGray: string;
  outline: string;
  outlineVariant: string;
}

export function modeTokens(mode: 'light' | 'dark'): ModeTokens {
  if (mode === 'dark') {
    const d = designTokens.dark;
    return {
      surface: d.surface,
      surfacePure: d.surfacePure,
      surfaceOffWhite: d.surfaceOffWhite,
      surfaceContainerLow: d.surfaceContainerLow,
      surfaceContainer: d.surfaceContainer,
      surfaceContainerHigh: d.surfaceContainerHigh,
      surfaceContainerHighest: d.surfaceContainerHighest,
      infoAccent: d.infoAccent,
      textPrimary: d.textPrimary,
      textSecondary: d.textSecondary,
      textTertiary: d.textTertiary,
      disabled: d.disabled,
      borderGray: d.borderGray,
      outline: d.outline,
      outlineVariant: d.outlineVariant,
    };
  }
  const c = designTokens.color;
  return {
    surface: c.surface,
    surfacePure: c.surfacePure,
    surfaceOffWhite: c.surfaceOffWhite,
    surfaceContainerLow: c.surfaceContainerLow,
    surfaceContainer: c.surfaceContainer,
    surfaceContainerHigh: c.surfaceContainerHigh,
    surfaceContainerHighest: c.surfaceContainerHighest,
    infoAccent: c.infoAccent,
    textPrimary: c.textPrimary,
    textSecondary: c.textSecondary,
    textTertiary: c.textTertiary,
    disabled: c.disabled,
    borderGray: c.borderGray,
    outline: c.outline,
    outlineVariant: c.outlineVariant,
  };
}

export function buildPalette(mode: 'light' | 'dark'): PaletteOptions {
  const c = designTokens.color;
  const t = modeTokens(mode);
  return {
    mode,
    primary: {
      main: mode === 'dark' ? '#FFFFFF' : '#0D0D0D',
      dark: mode === 'dark' ? '#E5E5E5' : '#262626',
      light: mode === 'dark' ? '#FFFFFF' : '#404040',
      contrastText: mode === 'dark' ? '#0D0D0D' : '#FFFFFF',
    },
    secondary: {
      main: mode === 'dark' ? '#D4D4D4' : '#404040',
      light: c.secondaryContainer,
      contrastText: mode === 'dark' ? '#0D0D0D' : '#FFFFFF',
    },
    success: { main: c.success, contrastText: '#ffffff' },
    warning: { main: c.warning, contrastText: '#1a1a00' },
    error: { main: c.error, contrastText: c.onError },
    info: { main: c.primaryContainer, light: t.infoAccent },
    // Platform content accents (each typed via the augmentation in types.ts).
    playStation: { main: c.playStation, contrastText: '#ffffff' },
    xbox: { main: c.xbox, contrastText: '#ffffff' },
    pc: { main: c.pc, contrastText: '#ffffff' },
    gold: { main: c.gold, light: c.goldLight, contrastText: '#1a1a00' },
    background: {
      default: t.surface,
      paper: t.surfacePure,
      surfaceOffWhite: t.surfaceOffWhite,
    },
    text: {
      primary: t.textPrimary,
      secondary: t.textSecondary,
      disabled: t.disabled,
    },
    divider: t.borderGray,
    action: {
      hover: `rgba(128, 128, 128, ${mode === 'dark' ? 0.16 : 0.06})`,
      selected: `rgba(128, 128, 128, ${mode === 'dark' ? 0.24 : 0.1})`,
    },
  };
}

export type { ThemeOptions };
