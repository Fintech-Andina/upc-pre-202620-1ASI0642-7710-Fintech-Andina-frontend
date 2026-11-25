import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/utils/formatters';

interface ModalDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  maxWidthClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Native <dialog> modal following modern-web-guidance:
 * - Uses showModal() for native top-layer, inert background, Esc handling and focus return.
 * - Omits redundant role="dialog" and aria-modal.
 */
export function ModalDialog({
  open,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  maxWidthClass = 'max-w-4xl',
  children,
  footer,
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [onClose]);

  const handleBackdropPointerDown = (e: React.PointerEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      dialogRef.current?.close();
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onPointerDown={handleBackdropPointerDown}
      className={cn('w-full rounded-2xl shadow-[0_20px_50px_rgba(11,60,93,0.28)]', maxWidthClass)}
    >
      {open && (
        <div className="flex max-h-[calc(100dvh-2.5rem)] flex-col overflow-hidden rounded-2xl bg-white">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-[#e6ebf0] bg-[#edf4ff]/70 px-6 py-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {icon && (
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-[#00694d] text-white shadow-md shadow-[#00694d]/25">
                  {icon}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 id={titleId} className="text-lg sm:text-xl font-bold tracking-tight text-[#121d26]">
                    {title}
                  </h1>
                  {badge}
                </div>
                {subtitle && <p className="mt-0.5 text-xs sm:text-sm text-[#3d4a43]">{subtitle}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar ventana"
              className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#e4effd] text-[#121d26] transition-colors hover:bg-[#d4e5fb]"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e6ebf0] bg-[#edf4ff]/70 px-6 py-4">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
