import SponsorStatusBadge from '@/components/sponsors/SponsorStatusBadge';
import { Button, LinkButton } from '@/components/ui';
import {
  SPONSOR_STATUS_LABEL,
  SPONSOR_TYPE_LABEL,
  formatSponsorAmount,
  type Sponsor,
  type SponsorStatus,
} from '@/types/sponsor';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';

interface SponsorTableProps {
  items: Sponsor[];
  busyId?: string | null;
  viewMode?: ViewMode;
  onStatusChange: (item: Sponsor, status: SponsorStatus) => void;
  onDelete: (item: Sponsor) => void;
}

const STATUS_OPTIONS: SponsorStatus[] = [
  'proposal',
  'negotiating',
  'contracted',
  'production',
  'review',
  'published',
  'completed',
  'cancelled',
];

export default function SponsorTable({
  items,
  busyId,
  viewMode = 'table',
  onStatusChange,
  onDelete,
}: SponsorTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
        案件はまだありません。
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className="grid gap-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-white">
                  {item.company_name}
                </h3>
                <p className="mt-1 text-xs text-muted">{item.project_name}</p>
              </div>
              <SponsorStatusBadge status={item.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div>
                <dt className="text-muted">種別</dt>
                <dd className="text-white">
                  {SPONSOR_TYPE_LABEL[item.project_type]}
                </dd>
              </div>
              <div>
                <dt className="text-muted">金額</dt>
                <dd className="text-gold">{formatSponsorAmount(item.amount)}</dd>
              </div>
              <div>
                <dt className="text-muted">締切</dt>
                <dd className="text-white">{item.due_date || '—'}</dd>
              </div>
              <div>
                <dt className="text-muted">担当</dt>
                <dd className="text-white">{item.contact_person || '—'}</dd>
              </div>
            </dl>
            <select
              value={item.status}
              disabled={busyId === item.id}
              onChange={(event) =>
                onStatusChange(item, event.target.value as SponsorStatus)
              }
              className="touch-input mt-3 w-full rounded-xl border border-white/10 bg-primary-bg/70 px-3 text-sm text-white outline-none"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {SPONSOR_STATUS_LABEL[status]}
                </option>
              ))}
            </select>
            <div className="mt-3 flex flex-wrap gap-2">
              <LinkButton
                to={`/admin/sponsors/${item.id}`}
                size="sm"
                variant="ghost"
                className="flex-1"
              >
                詳細
              </LinkButton>
              <LinkButton
                to={`/admin/sponsors/${item.id}/edit`}
                size="sm"
                variant="ghost"
                className="flex-1"
              >
                編集
              </LinkButton>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="flex-1"
                disabled={busyId === item.id}
                onClick={() => onDelete(item)}
              >
                削除
              </Button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium">会社名</th>
            <th className="px-4 py-3 font-medium">案件名</th>
            <th className="px-4 py-3 font-medium">案件種別</th>
            <th className="px-4 py-3 font-medium">状態</th>
            <th className="px-4 py-3 font-medium">金額</th>
            <th className="px-4 py-3 font-medium">締切</th>
            <th className="px-4 py-3 font-medium">公開日</th>
            <th className="px-4 py-3 font-medium">担当者</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-white/5">
              <td className="px-4 py-3 font-medium text-white">
                {item.company_name}
              </td>
              <td className="px-4 py-3 text-muted">{item.project_name}</td>
              <td className="px-4 py-3 text-muted">
                {SPONSOR_TYPE_LABEL[item.project_type]}
              </td>
              <td className="px-4 py-3">
                <div className="space-y-2">
                  <SponsorStatusBadge status={item.status} />
                  <select
                    value={item.status}
                    disabled={busyId === item.id}
                    onChange={(event) =>
                      onStatusChange(
                        item,
                        event.target.value as SponsorStatus,
                      )
                    }
                    className="w-full rounded-xl border border-white/10 bg-primary-bg/70 px-2 py-1 text-xs text-white outline-none"
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {SPONSOR_STATUS_LABEL[status]}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td className="px-4 py-3 text-gold">
                {formatSponsorAmount(item.amount)}
              </td>
              <td className="px-4 py-3 text-muted">{item.due_date || '—'}</td>
              <td className="px-4 py-3 text-muted">
                {item.publish_date || '—'}
              </td>
              <td className="px-4 py-3 text-muted">
                {item.contact_person || '—'}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <LinkButton
                    to={`/admin/sponsors/${item.id}`}
                    size="sm"
                    variant="ghost"
                  >
                    詳細
                  </LinkButton>
                  <LinkButton
                    to={`/admin/sponsors/${item.id}/edit`}
                    size="sm"
                    variant="ghost"
                  >
                    編集
                  </LinkButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => onDelete(item)}
                  >
                    削除
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
