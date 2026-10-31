import { BrandLoadingScreen, CssBaseline, ThemeProvider, type Theme } from '@monochrome-ui/design-system';

export function AppLoadingScreen({ theme }: { theme: Theme }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrandLoadingScreen logoSrc="/logo-black.png" appName="GameHub" />
    </ThemeProvider>
  );
}
