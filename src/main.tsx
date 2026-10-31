import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SnackbarProvider } from 'notistack';
import { AppProvider } from '@/contexts/AppContext';
import { ThemeModeProvider } from '@/hooks/ThemeModeProvider';
import App from './App';
import './main.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60_000,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <ThemeModeProvider>
          <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <App />
          </SnackbarProvider>
        </ThemeModeProvider>
      </AppProvider>
    </QueryClientProvider>
  </StrictMode>,
);
