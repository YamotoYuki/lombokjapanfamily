import { Link } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  adminAnnouncementTitle,
  announcementSummary,
  localizedAnnouncementContent,
  type Announcement,
} from '@/types/announcement';

interface AnnouncementTableProps {
  items: Announcement[];
  onDelete: (id: string) => void;
  deletingId?: string | null;
}

function formatDate(value?: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('ja-JP');
}

export default function AnnouncementTable({
  items,
  onDelete,
  deletingId,
}: AnnouncementTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wide text-muted">
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
                <td className="px-4 py-3 text-xs uppercase tracking-wide text-gold">
                  {item.category}
                </td>
                <td className="px-4 py-3 text-muted">
                  {formatDate(item.published_at)}
                </td>
                <td className="px-4 py-3">
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
                    <span className="ml-2 rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold">
                      注目
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Link to={`/admin/announcements/${item.id}/edit`}>
                      <Button type="button" variant="ghost" size="sm">
                        <Pencil size={14} />
                        編集
                      </Button>
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
