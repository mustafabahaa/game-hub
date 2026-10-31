import { Box, Typography, Button } from '@mui/material';

/** Shown when VITE_FIREBASE_* env vars are missing. */
export function ConfigErrorScreen() {
  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'grid',
        placeItems: 'center',
        p: 3,
        bgcolor: 'background.default',
      }}
    >
      <Box sx={{ maxWidth: 480, textAlign: 'center' }}>
        <Typography variant="overline" color="error.main" sx={{ display: 'block', mb: 2 }}>
          Configuration Error
        </Typography>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Firebase isn't configured
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          The app needs <code>VITE_FIREBASE_*</code> environment variables to run. Copy
          <code>.env.example</code> to <code>.env</code> and fill in your Firebase project's
          web config, then restart the dev server.
        </Typography>
        <Button variant="contained" color="primary" href="https://console.firebase.google.com/" target="_blank" rel="noreferrer">
          Open Firebase Console
        </Button>
      </Box>
    </Box>
  );
}
