import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import {
  adminBannerTitle,
  type NotificationBanner,
} from '@/types/notificationBanner';

interface NotificationBannerTableProps {
  items: NotificationBanner[];
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

function formatWindow(item: NotificationBanner) {
  const start = item.publish_start_at
    ? new Date(item.publish_start_at).toLocaleString()
    : '—';
  const end = item.publish_end_at
    ? new Date(item.publish_end_at).toLocaleString()
    : '—';
  return `${start} 〜 ${end}`;
}

export default function NotificationBannerTable({
  items,
  onDelete,
  deletingId,
}: NotificationBannerTableProps) {
  if (items.length === 0) {
    return (
      <Card className="px-4 py-8 text-center text-sm text-muted">
        通知バナーはまだありません。
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item.id} className="px-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-semibold text-white">
                  {adminBannerTitle(item) || '（無題）'}
                </h3>
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider',
                    item.is_active
                      ? 'bg-youtube-red/20 text-red-200'
                      : 'bg-white/10 text-muted',
                  ].join(' ')}
                >
                  {item.is_active ? '有効' : '無効'}
                </span>
              </div>
              <p className="line-clamp-2 text-sm text-muted">
                {item.message_ja || '（メッセージなし）'}
              </p>
              <p className="text-xs text-muted">公開期間: {formatWindow(item)}</p>
              {item.link_url ? (
                <p className="truncate text-xs text-gold">{item.link_url}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                to={`/admin/notification-banners/${item.id}/edit`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/40 bg-gold px-3 py-2 text-sm font-medium text-primary-bg transition-all hover:bg-amber-500"
              >
                <Pencil size={14} />
                編集
              </Link>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={deletingId === item.id}
                onClick={() => onDelete(item.id)}
              >
                <Trash2 size={14} />
                削除
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
