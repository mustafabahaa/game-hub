import { useState } from 'react';
import { Box, Typography, Button, Alert, Stack, CircularProgress } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useAppContext } from '@/hooks/useAppContext';

function GoogleIcon() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

/** Centered, low-distraction sign-in surface matching Fitpal's entry screen. */
export function AuthScreen() {
  const { loginWithGoogle } = useAppContext();
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError((e as Error)?.message ?? 'Failed to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', px: 3, py: 4 }}>
      <Stack spacing={4} alignItems="center" sx={{ width: '100%', maxWidth: 360 }}>
        <Stack spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
          <Box component="img" src="/logo-black.png" alt="GameHub" sx={{ width: 64, height: 64, objectFit: 'contain', filter: theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)' }} />
          <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>GameHub</Typography>
        </Stack>

        <Box sx={{ width: '100%', textAlign: 'center' }}>
          <Typography variant="h2" sx={{ fontSize: 28, fontWeight: 600 }}>Sign in</Typography>
          <Typography variant="body1" sx={{ mt: 0.5 }}>to continue to GameHub</Typography>
        </Box>

        <Box sx={{ width: '100%', py: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Button
            fullWidth
            variant="outlined"
            onClick={handleSignIn}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <GoogleIcon />}
            sx={{ height: 48, '&:hover': { bgcolor: 'action.hover', borderColor: 'divider' } }}
          >
            {loading ? 'Connecting…' : 'Continue with Google'}
          </Button>
          <Typography variant="body2" sx={{ mt: 4, textAlign: 'center' }}>
            Your data stays private to you.
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
