import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import {
  adminAnnouncementTitle,
  announcementSummary,
  localizedAnnouncementContent,
  type Announcement,
  type AnnouncementCategory,
} from '@/types/announcement';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';

interface AnnouncementTableProps {
  items: Announcement[];
  onDelete: (id: string) => void;
  deletingId?: string | null;
  viewMode?: ViewMode;
}

function formatAdminDate(value: string | undefined) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (hh === '00' && mm === '00') {
    return `${y}/${m}/${d}`;
  }
  return `${y}/${m}/${d} ${hh}:${mm}`;
}

function StatusBadges({ item }: { item: Announcement }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-row flex-nowrap items-center gap-2">
      <span
        className={[
          'inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1',
          item.is_published
            ? 'bg-success/15 text-success ring-success/30'
            : 'bg-white/10 text-muted ring-white/10',
        ].join(' ')}
      >
        {item.is_published
          ? t('admin.common.published')
          : t('admin.common.unpublished')}
      </span>
      {item.is_featured ? (
        <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-medium text-gold ring-1 ring-gold/30">
          {t('admin.common.featured')}
        </span>
      ) : null}
    </div>
  );
}

function categoryLabel(
  t: (key: string) => string,
  category: AnnouncementCategory | string,
) {
  return t(`admin.announcements.categories.${category}`) || category;
}

const actionBtnClass =
  'inline-flex h-9 min-w-[4.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-3 text-xs text-muted transition-colors hover:border-gold/40 hover:text-gold disabled:opacity-40';

const deleteBtnClass =
  'inline-flex h-9 min-w-[4.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-3 text-xs text-muted transition-colors hover:border-youtube-red/40 hover:text-white disabled:opacity-40';

export default function AnnouncementTable({
  items,
  onDelete,
  deletingId,
  viewMode = 'table',
}: AnnouncementTableProps) {
  const { t } = useTranslation();

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
                <p className="whitespace-nowrap text-xs text-gold">
                  {categoryLabel(t, item.category)}
                </p>
                <h3 className="line-clamp-2 text-base font-semibold text-white">
                  {title || t('admin.common.dash')}
                </h3>
                {summary ? (
                  <p className="line-clamp-2 text-sm text-muted">{summary}</p>
                ) : null}
                <p className="whitespace-nowrap text-xs text-muted">
                  {t('admin.announcements.publishedAtLabel', {
                    date: formatAdminDate(item.published_at),
                  })}
                </p>
                <StatusBadges item={item} />
              </div>
              <div className="mt-auto flex gap-2">
                <Link
                  to={`/admin/announcements/${item.id}/edit`}
                  className={`${actionBtnClass} flex-1`}
                >
                  {t('admin.common.edit')}
                </Link>
                <button
                  type="button"
                  className={`${deleteBtnClass} flex-1`}
                  disabled={deletingId === item.id}
                  onClick={() => onDelete(item.id)}
                >
                  {t('admin.common.deleteShort')}
                </button>
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[1100px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[45%]" />
          <col className="w-[10%]" />
          <col className="w-[12%]" />
          <col className="w-[15%]" />
          <col className="w-[18%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.common.title')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.category')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.publishedAt')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.status')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.actions')}
            </th>
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
                className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
              >
                <td className="px-4 py-3 align-middle">
                  <div className="flex min-w-0 items-start gap-3">
                    {item.featured_image ? (
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-black/30">
                        <img
                          src={item.featured_image}
                          alt=""
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 font-medium text-white">
                        {title || t('admin.common.dash')}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted">
                        {summary || t('admin.common.dash')}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-muted">
                        {item.title_en?.trim() ? (
                          <span className="rounded bg-white/5 px-1.5 py-0.5 whitespace-nowrap">
                            EN
                          </span>
                        ) : null}
                        {item.title_id?.trim() ? (
                          <span className="rounded bg-white/5 px-1.5 py-0.5 whitespace-nowrap">
                            ID
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="min-w-[5.5rem] px-3 py-3 align-middle">
                  <span className="inline-flex whitespace-nowrap text-xs text-gold">
                    {categoryLabel(t, item.category)}
                  </span>
                </td>
                <td className="px-3 py-3 align-middle">
                  <span className="inline-flex whitespace-nowrap text-muted">
                    {formatAdminDate(item.published_at)}
                  </span>
                </td>
                <td className="min-w-[9rem] px-3 py-3 align-middle">
                  <StatusBadges item={item} />
                </td>
                <td className="px-3 py-3 align-middle">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <Link
                      to={`/admin/announcements/${item.id}/edit`}
                      className={actionBtnClass}
                    >
                      {t('admin.common.edit')}
                    </Link>
                    <button
                      type="button"
                      className={deleteBtnClass}
                      disabled={deletingId === item.id}
                      onClick={() => onDelete(item.id)}
                    >
                      {t('admin.common.deleteShort')}
                    </button>
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
