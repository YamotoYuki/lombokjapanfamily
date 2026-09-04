import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ConfirmDialog } from '@/components/ui';

interface AdminDangerZoneProps {
  title?: string;
  description: string;
  buttonLabel?: string;
  deleting?: boolean;
  disabled?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  confirmDetail?: string;
  confirmLabel?: string;
  onDelete: () => void | Promise<void>;
}

/** Shared hard-delete panel for admin edit pages (with confirm modal). */
export default function AdminDangerZone({
  title,
  description,
  buttonLabel,
  deleting = false,
  disabled = false,
  confirmTitle,
  confirmDescription,
  confirmDetail,
  confirmLabel,
  onDelete,
}: AdminDangerZoneProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="rounded-2xl border border-youtube-red/35 bg-youtube-red/5 p-4 sm:p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-youtube-red">
          {title ?? t('admin.common.dangerZone')}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
        <Button
          type="button"
          variant="danger"
          className="mt-4 w-full sm:w-auto"
          disabled={disabled || deleting}
          onClick={() => setOpen(true)}
        >
          <Trash2 size={16} />
          {deleting
            ? t('admin.common.deleting')
            : (buttonLabel ?? t('admin.common.delete'))}
        </Button>
      </section>

      <ConfirmDialog
        open={open}
        title={confirmTitle}
        description={confirmDescription}
        detail={confirmDetail}
        confirmLabel={confirmLabel}
        confirming={deleting}
        onCancel={() => {
          if (!deleting) setOpen(false);
        }}
        onConfirm={() => {
          void onDelete();
        }}
      />
    </>
  );
}
