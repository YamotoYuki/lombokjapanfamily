import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import {
  adminAnnouncementTitle,
  announcementSummary,
  ANNOUNCEMENT_CATEGORY_LABELS,
  localizedAnnouncementContent,
  type Announcement,
} from '@/types/announcement';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';

interface AnnouncementTableProps {
  items: Announcement[];
  onDelete: (id: string) => void;
  deletingId?: string | null;
  viewMode?: ViewMode;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ja-JP');
}

function StatusBadges({ item }: { item: Announcement }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <span
        className={[
          'rounded-full px-2.5 py-1 text-[11px] font-medium',
          item.is_published
            ? 'bg-success/15 text-success'
            : 'bg-white/10 text-muted',
        ].join(' ')}
      >
        {item.is_published ? '公開' : '非公開'}
      </span>
      {item.is_featured ? (
        <span className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold">
          注目
        </span>
      ) : null}
    </div>
  );
}

export default function AnnouncementTable({
  items,
  onDelete,
  deletingId,
  viewMode = 'table',
}: AnnouncementTableProps) {
  if (viewMode === 'card') {
    return (
      <div className="grid gap-3 p-3 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => {
          const title = adminAnnouncementTitle(item);
          const summary = announcementSummary(
            localizedAnnouncementContent(item, 'ja'),
            100,
          );
          return (
            <Card key={item.id} className="flex flex-col gap-3 !p-4">
              {item.featured_image ? (
                <div className="flex h-28 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-black/30">
                  <img
                    src={item.featured_image}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
              ) : null}
              <div className="min-w-0 space-y-2">
                <p className="text-xs text-gold">
                  {ANNOUNCEMENT_CATEGORY_LABELS[item.category] ?? item.category}
                </p>
                <h3 className="break-words text-base font-semibold text-white">
                  {title || '—'}
                </h3>
                {summary ? (
                  <p className="line-clamp-2 text-sm text-muted">{summary}</p>
                ) : null}
                <p className="text-xs text-muted">
                  公開日: {formatDate(item.published_at)}
                </p>
                <StatusBadges item={item} />
              </div>
              <div className="mt-auto flex flex-col gap-2 sm:flex-row">
                <Link
                  to={`/admin/announcements/${item.id}/edit`}
                  className="touch-target inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-3 text-sm font-medium text-white transition-all hover:bg-surface"
                >
                  <Pencil size={14} />
                  編集
                </Link>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  disabled={deletingId === item.id}
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 size={14} />
                  削除
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3">画像</th>
            <th className="px-4 py-3">タイトル</th>
            <th className="px-4 py-3">カテゴリ</th>
            <th className="px-4 py-3">公開日</th>
            <th className="px-4 py-3">状態</th>
            <th className="px-4 py-3 text-right">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const title = adminAnnouncementTitle(item);
            const summary = announcementSummary(
              localizedAnnouncementContent(item, 'ja'),
              80,
            );
            return (
              <tr
                key={item.id}
                className="border-b border-white/5 text-sm text-white/90"
              >
                <td className="px-4 py-3">
                  {item.featured_image ? (
                    <div className="flex h-14 w-20 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                      <img
                        src={item.featured_image}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-white">{title || '—'}</div>
                  <div className="mt-1 line-clamp-1 text-xs text-muted">
                    {summary || '—'}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted">
                    {item.title_en?.trim() ? (
                      <span className="rounded bg-white/5 px-1.5 py-0.5">EN</span>
                    ) : null}
                    {item.title_id?.trim() ? (
                      <span className="rounded bg-white/5 px-1.5 py-0.5">ID</span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gold">
                  {ANNOUNCEMENT_CATEGORY_LABELS[item.category] ?? item.category}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(item.published_at)}
                </td>
                <td className="px-4 py-3">
                  <StatusBadges item={item} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      to={`/admin/announcements/${item.id}/edit`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-transparent px-3 py-2 text-sm font-medium text-white transition-all hover:bg-surface"
                    >
                      <Pencil size={14} />
                      編集
                    </Link>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 size={14} />
                      削除
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
