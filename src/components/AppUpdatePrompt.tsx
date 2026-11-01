import { useEffect, useRef } from 'react';
import { closeSnackbar, useSnackbar } from 'notistack';
import { Button } from '@monochrome-ui/design-system';
import { startReleaseCheck } from '@/libs/releaseCheck';

/**
 * Prompts the user when a newer deployment is detected (see releaseCheck.ts).
 * GameHub has no service worker, so accepting the prompt reloads the page to
 * pick up fresh HTML; the reload only ever happens on explicit user action,
 * so unsaved work and active operations are never interrupted.
 */
export function AppUpdatePrompt() {
  const { enqueueSnackbar } = useSnackbar();
  const dismissedRef = useRef(false);

  useEffect(() => {
    return startReleaseCheck(() => {
      if (dismissedRef.current) return;
      enqueueSnackbar('A new version of GameHub is available.', {
        key: 'app-update-available',
        variant: 'default',
        persist: true,
        action: (snackbarId) => (
          <>
            <Button
              size="small"
              variant="text"
              color="inherit"
              onClick={() => {
                dismissedRef.current = true;
                closeSnackbar(snackbarId);
              }}
            >
              Later
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => {
                closeSnackbar(snackbarId);
                window.location.reload();
              }}
            >
              Update
            </Button>
          </>
        ),
      });
    });
  }, [enqueueSnackbar]);

  return null;
}
