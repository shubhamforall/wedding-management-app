import { Dialog } from './Dialog';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  isLoading?: boolean;
  danger?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  isLoading,
  danger,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} type="button">
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} isLoading={isLoading} type="button">
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
