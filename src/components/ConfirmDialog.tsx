import { ConfirmationDialog } from '@monochrome-ui/design-system';
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

/** GameHub delete confirmation composed from the shared dialog presentation. */
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
    <ConfirmationDialog
      open={open}
      title={title}
      description={message}
      confirmLabel={confirmLabel}
      cancelLabel={cancelLabel}
      tone="danger"
      icon={<TriangleAlert size={20} />}
      onConfirm={onConfirm}
      onClose={onClose}
    />
  );
}
