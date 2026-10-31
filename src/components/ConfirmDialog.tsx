import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, type SxProps, type Theme } from '@mui/material';
import { TriangleAlert } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
}

/** Destructive confirmation dialog using the shared neutral surface system. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Box sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: 2 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
              bgcolor: 'action.selected',
              color: 'error.main',
            }}
          >
            <TriangleAlert size={20} />
          </Box>
          <Box>
            <DialogTitle sx={{ p: 0, mb: 1, fontWeight: 800 }}>{title}</DialogTitle>
            <DialogContent sx={{ p: 0 }}>
              <Typography variant="body2" color="text.secondary">
                {message}
              </Typography>
            </DialogContent>
          </Box>
        </Box>
        <DialogActions sx={{ px: 2, pb: 2, pt: 1 }}>
          <Button onClick={onClose} variant="outlined">
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            variant="contained"
            color="error"
          >
            {confirmLabel}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

export type { SxProps, Theme };
