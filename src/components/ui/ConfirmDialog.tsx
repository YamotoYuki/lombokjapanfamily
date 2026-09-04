import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  detail?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirming?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Admin confirm modal (matches Contact delete dialog styling).
 * Esc / backdrop click cancel while not confirming.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  detail,
  confirmLabel,
  cancelLabel,
  confirming = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [submitting, setSubmitting] = useState(false);
  const busy = confirming || submitting;

  useEffect(() => {
    if (!open) setSubmitting(false);
  }, [open]);

  useEffect(() => {
    if (confirming) setSubmitting(true);
    if (!confirming) setSubmitting(false);
  }, [confirming]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (busy) return;
      onCancel();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, busy, onCancel]);

  if (!open) return null;

  const handleConfirm = () => {
    if (busy) return;
    setSubmitting(true);
    void Promise.resolve(onConfirm()).catch(() => {
      setSubmitting(false);
    });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId} className="text-lg font-semibold text-white">
          {title ?? t('admin.common.deleteConfirmTitle')}
        </h3>
        <p className="mt-2 text-sm text-muted">
          {description ?? t('admin.common.deleteConfirmBody')}
        </p>
        <p className="mt-2 text-sm text-muted">
          {t('admin.common.deleteConfirmIrreversible')}
        </p>
        {detail ? (
          <p className="mt-2 break-words text-xs text-muted">{detail}</p>
        ) : null}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="ghost"
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={() => {
              if (!busy) onCancel();
            }}
          >
            {cancelLabel ?? t('admin.common.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            className="w-full sm:w-auto"
            disabled={busy}
            onClick={handleConfirm}
          >
            {busy
              ? t('admin.common.deleting')
              : (confirmLabel ?? t('admin.common.delete'))}
          </Button>
        </div>
      </div>
    </div>
  );
}
