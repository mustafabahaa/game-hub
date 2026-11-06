import { BrandMark, Box, CssBaseline, ThemeProvider, type Theme } from '@monochrome-ui/design-system';

export function AppLoadingScreen({ theme }: { theme: Theme }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box role="status" aria-label="Loading GameHub" sx={{ display: 'grid', minHeight: '100dvh', placeItems: 'center', p: 3 }}>
        <BrandMark src="/logo-black.png" alt="GameHub" size={72} />
      </Box>
    </ThemeProvider>
  );
}
