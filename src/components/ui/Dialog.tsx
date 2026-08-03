import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Card } from './Card';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function Dialog({ open, onClose, title, description, children }: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center">
      <button
        aria-label="Close dialog"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <Card className="relative z-10 w-full max-w-md rounded-b-none p-6 sm:rounded-b-[var(--radius-lg)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-text">{title}</h2>
            {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg-subtle hover:text-text"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </Card>
    </div>,
    document.body
  );
}
