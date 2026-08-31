import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';

interface AdminDangerZoneProps {
  title?: string;
  description: string;
  buttonLabel?: string;
  deleting?: boolean;
  disabled?: boolean;
  onDelete: () => void;
}

/** Shared hard-delete panel for admin edit pages. */
export default function AdminDangerZone({
  title = '危険な操作',
  description,
  buttonLabel = '削除する',
  deleting = false,
  disabled = false,
  onDelete,
}: AdminDangerZoneProps) {
  return (
    <section className="rounded-2xl border border-youtube-red/35 bg-youtube-red/5 p-4 sm:p-5">
      <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-youtube-red">
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      <Button
        type="button"
        variant="danger"
        className="mt-4 w-full sm:w-auto"
        disabled={disabled || deleting}
        onClick={onDelete}
      >
        <Trash2 size={16} />
        {deleting ? '削除中...' : buttonLabel}
      </Button>
    </section>
  );
}
