import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Paper, Typography } from '@monochrome-ui/design-system';
import type { SxProps, Theme } from '@mui/material/styles';
import { WarningIcon as TriangleAlert } from '@/components/AppIcon';
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
          <Paper elevation={0} variant="dangerIconBadge">
            <TriangleAlert size={20} />
          </Paper>
          <Box>
            <DialogTitle sx={{ p: 0, mb: 1 }}><Typography variant="dialogTitle" component="span">{title}</Typography></DialogTitle>
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
