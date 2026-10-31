import type { Theme, Components } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { designTokens, modeTokens } from './palette';

/**
 * MUI component overrides — Fitpal's neutral, solid-surface system.
 *
 * Key decisions (from PRODUCT.md "the tool disappears into the task"):
 *  - Cards and papers use solid neutral surfaces, quiet borders, and no lift.
 *  - Primary controls invert black and white with the active theme.
 *  - Inputs, dialogs, and nav controls share the same neutral palette.
 */
export function buildComponents(mode: 'light' | 'dark'): Components<Theme> {
  const t = modeTokens(mode);
  const isDark = mode === 'dark';

  const cardEdge = `1px solid ${t.borderGray}`;

  return {
    MuiCssBaseline: {
      styleOverrides: {
        html: { colorScheme: mode },
        body: {
          backgroundColor: t.surface,
          color: t.textPrimary,
          fontFamily: "'Plus Jakarta Sans', 'Cairo', system-ui, -apple-system, sans-serif",
        },
        // 16px inputs to prevent iOS zoom-on-focus.
        'input, textarea, select': { fontSize: '16px !important' },
        '.notistack-MuiContent-success': { backgroundColor: `${isDark ? '#2A2A2A' : '#0D0D0D'} !important` },
        '@keyframes fadeInUp': {
          '0%': { opacity: 0, transform: 'translateY(8px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },

    MuiPaper: {
      styleOverrides: { root: { backgroundColor: t.surfacePure, backgroundImage: 'none' } },
    },

    MuiAppBar: {
      defaultProps: { elevation: 0, color: 'transparent' },
      styleOverrides: {
        root: { backgroundColor: 'transparent', backgroundImage: 'none', boxShadow: 'none', color: t.textPrimary },
      },
    },

    MuiCard: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          background: t.surfacePure,
          border: cardEdge,
          borderRadius: designTokens.radius.card,
          boxShadow: 'none',
          overflow: 'hidden',
          transition: 'border-color 0.2s ease',
        },
      },
    },

    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: 20,
          '&:last-child': { paddingBottom: 20 },
        },
      },
    },

    MuiCardActions: {
      styleOverrides: {
        root: {
          padding: '12px 20px 20px',
          justifyContent: 'flex-start',
          '& .MuiButton-root': { paddingInline: 16 },
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          minHeight: designTokens.spacing.touchTarget, // 48px
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, transform 0.1s ease',
          '&:hover': { boxShadow: 'none' },
          '&:active': { transform: 'scale(0.97)' },
        },
        containedPrimary: {
          background: isDark ? '#FFFFFF' : '#0D0D0D',
          color: isDark ? '#0D0D0D' : '#FFFFFF',
          borderRadius: designTokens.radius.pill, // pill
          padding: '12px 24px',
          '&:hover': { background: isDark ? '#E5E5E5' : '#262626' },
          '&:active': { background: isDark ? '#E5E5E5' : '#262626' },
          '&.Mui-disabled': { background: alpha(isDark ? '#FFFFFF' : '#0D0D0D', 0.4), color: isDark ? '#0D0D0D' : '#FFFFFF' },
        },
        outlined: {
          borderColor: t.borderGray,
          color: t.textPrimary,
          borderRadius: designTokens.radius.pill,
          backgroundColor: t.surfacePure,
          padding: '12px 16px',
          '&:hover': { backgroundColor: t.surfaceOffWhite, borderColor: t.borderGray },
          '&:active': { backgroundColor: isDark ? t.surfaceContainerHighest : t.surfaceContainerHighest },
        },
        text: {
          color: t.textSecondary,
          borderRadius: designTokens.radius.pill,
          padding: '12px 20px',
          '&:hover': { backgroundColor: alpha(t.textPrimary, isDark ? 0.08 : 0.04) },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          color: t.outline,
          borderRadius: designTokens.radius.pill,
          transition: 'all 0.2s ease-in-out',
          '&:hover': { backgroundColor: t.surfaceOffWhite, color: t.textPrimary },
        },
      },
    },

    MuiAvatar: {
      styleOverrides: {
        circular: { borderRadius: '50%' },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.moderate,
          backgroundColor: t.surfacePure,
          fontSize: '16px',
          '& .MuiOutlinedInput-notchedOutline': { borderColor: t.borderGray, borderWidth: 1 },
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.outline },
          },
          '&.Mui-focused': {
            '& .MuiOutlinedInput-notchedOutline': { borderColor: t.outline, borderWidth: 2 },
          },
        },
        input: { color: t.textPrimary, '&::placeholder': { color: t.textTertiary, opacity: 1 } },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: { color: t.textTertiary, fontSize: '14px', '&.Mui-focused': { color: t.textPrimary } },
      },
    },

    MuiDialog: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(8px)',
            backgroundColor: isDark ? 'rgba(14,17,17,0.7)' : 'rgba(255,255,255,0.6)',
          },
        },
        paper: {
          backgroundColor: t.surfacePure,
          backgroundImage: 'none !important',
          borderRadius: designTokens.radius.card,
          border: cardEdge,
          '& .MuiDialogTitle-root': { fontWeight: 700 },
          '@media (max-width:599.95px)': {
            margin: 16,
            maxHeight: 'calc(100% - 32px)',
          },
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: { padding: '24px 24px 12px', fontSize: 20, lineHeight: '28px', letterSpacing: '-0.02em' },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: { padding: '12px 24px 20px' },
      },
    },
    MuiDialogActions: {
      styleOverrides: {
        root: { padding: '8px 24px 24px', gap: 8 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        root: {
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(8px)',
            backgroundColor: isDark ? 'rgba(14,17,17,0.7)' : 'rgba(255,255,255,0.6)',
          },
        },
        paper: {
          backgroundImage: 'none',
          backgroundColor: t.surfacePure,
          borderTopLeftRadius: designTokens.radius.card,
          borderTopRightRadius: designTokens.radius.card,
          border: `1px solid ${t.borderGray}`,
          '&.MuiDrawer-paperAnchorBottom': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          border: `1px solid ${t.borderGray}`,
          borderRadius: designTokens.radius.pill,
          padding: 4,
          backgroundColor: t.surfacePure,
          gap: 4,
          '& .MuiToggleButtonGroup-grouped': {
            border: 0,
            borderRadius: designTokens.radius.pill,
            margin: 0,
            '&:not(:first-of-type)': { borderRadius: designTokens.radius.pill, borderLeft: 0 },
            '&:not(:last-of-type)': { borderRadius: designTokens.radius.pill },
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          padding: '8px 16px',
          color: t.textSecondary,
          borderRadius: designTokens.radius.pill,
          fontWeight: 600,
          textTransform: 'none',
          '&.Mui-selected': {
            backgroundColor: isDark ? '#FFFFFF' : '#0D0D0D',
            color: isDark ? '#0D0D0D' : '#FFFFFF',
            '&:hover': { backgroundColor: isDark ? '#E5E5E5' : '#262626' },
          },
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        // Popovers and ordinary menus must not dim the whole app. Dialog and
        // drawer backdrops receive their own scoped blur/surface treatment.
        root: { backgroundColor: 'transparent' },
      },
    },

    MuiChip: {
      styleOverrides: {
      root: { fontWeight: 600, fontFamily: "'Plus Jakarta Sans', 'Cairo', sans-serif", borderRadius: designTokens.radius.pill },
        outlined: { borderColor: t.borderGray },
      },
    },

    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 52, height: 28, padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 4,
            '&.Mui-checked': {
              transform: 'translateX(24px)', color: '#fff',
              '& + .MuiSwitch-track': { backgroundColor: isDark ? '#FFFFFF' : '#0D0D0D', opacity: 1 },
            },
          },
          '& .MuiSwitch-thumb': { width: 20, height: 20, boxShadow: 'none' },
          '& .MuiSwitch-track': { borderRadius: 14, backgroundColor: alpha(t.textPrimary, 0.2), opacity: 1 },
        },
      },
    },

    MuiDivider: { styleOverrides: { root: { borderColor: t.borderGray } } },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          fontFamily: "'Plus Jakarta Sans', 'Cairo', sans-serif",
          fontSize: '12.5px', fontWeight: 500,
          backgroundColor: 'rgba(33, 33, 33, 0.95)', color: '#ffffff',
          padding: '8px 12px', borderRadius: '6px', boxShadow: '0px 4px 16px rgba(0,0,0,0.25)',
        },
      },
    },

    MuiCircularProgress: { styleOverrides: { root: { color: t.textPrimary } } },

    MuiFab: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#FFFFFF' : '#0D0D0D', color: isDark ? '#0D0D0D' : '#FFFFFF',
          borderRadius: designTokens.radius.pill,
          boxShadow: 'none',
          transition: 'background-color 0.2s ease',
          '&:hover': { backgroundColor: isDark ? '#E5E5E5' : '#262626', boxShadow: 'none' },
        },
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: designTokens.radius.moderate,
          transition: 'background-color 0.2s ease',
          '&:hover': { backgroundColor: alpha(t.textPrimary, isDark ? 0.08 : 0.04) },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: designTokens.radius.moderate },
        standardInfo: { backgroundColor: t.infoAccent },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: designTokens.radius.card,
          border: `1px solid ${t.borderGray}`,
          boxShadow: isDark ? '0px 8px 24px rgba(0,0,0,0.32)' : '0px 4px 16px rgba(14,23,21,0.08)',
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: { padding: '14px 16px', borderBottom: `1px solid ${t.borderGray}`, backgroundColor: 'transparent' },
        sizeSmall: { padding: '10px 16px' },
        head: { fontWeight: 700, color: t.textPrimary, backgroundColor: 'transparent', padding: '20px 16px' },
      },
    },
  };
}
