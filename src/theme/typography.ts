import type { ThemeOptions } from '@mui/material/styles';
import type { ModeTokens } from './palette';

/** Shared with Fitpal so sibling apps use the same font stack. */
export const fontFamily =
  "'Plus Jakarta Sans', 'Cairo', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

/**
 * Build MUI typography for a mode using Fitpal's clear, compact hierarchy.
 */
export function buildTypography(t: ModeTokens): NonNullable<ThemeOptions['typography']> {
  return {
    fontFamily,
    h1: { fontFamily, fontSize: '36px', lineHeight: '44px', fontWeight: 700, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: t.textPrimary },
    h2: { fontFamily, fontSize: '28px', lineHeight: '36px', fontWeight: 650, letterSpacing: '-0.025em', fontVariantNumeric: 'tabular-nums', color: t.textPrimary },
    h3: { fontFamily, fontSize: '22px', lineHeight: '30px', fontWeight: 650, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: t.textPrimary },
    h4: { fontFamily, fontSize: '18px', lineHeight: '26px', fontWeight: 600, color: t.textPrimary },
    h5: { fontFamily, fontSize: '16px', lineHeight: '24px', fontWeight: 600, color: t.textPrimary },
    h6: { fontFamily, fontSize: '15px', lineHeight: '22px', fontWeight: 600, color: t.textPrimary },
    body1: { fontFamily, fontSize: '14.5px', lineHeight: '22px', fontWeight: 400, letterSpacing: '-0.01em', color: t.textSecondary },
    body2: { fontFamily, fontSize: '13.5px', lineHeight: '20px', fontWeight: 450, letterSpacing: '-0.005em', fontVariantNumeric: 'tabular-nums', color: t.textSecondary },
    button: { fontFamily, fontSize: '14px', lineHeight: '20px', fontWeight: 600, letterSpacing: '-0.01em', textTransform: 'none' as const },
    caption: { fontFamily, fontSize: '12px', fontWeight: 500, color: t.textTertiary },
    overline: { fontFamily, fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' as const, color: t.textTertiary },
  };
}
