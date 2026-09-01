import { useTranslation } from 'react-i18next';
import SponsorStatusBadge from '@/components/sponsors/SponsorStatusBadge';
import { Button, LinkButton } from '@/components/ui';
import {
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
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
        {t('admin.sponsors.empty')}
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
                <dt className="text-muted">{t('admin.common.type')}</dt>
                <dd className="text-white">
                  {t(`admin.sponsors.types.${item.project_type}`)}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t('admin.common.amount')}</dt>
                <dd className="text-gold">{formatSponsorAmount(item.amount)}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('admin.common.deadline')}</dt>
                <dd className="text-white">
                  {item.due_date || t('admin.common.dash')}
                </dd>
              </div>
              <div>
                <dt className="text-muted">{t('admin.common.assignee')}</dt>
                <dd className="text-white">
                  {item.contact_person || t('admin.common.dash')}
                </dd>
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
                  {t(`admin.sponsors.statuses.${status}`)}
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
                {t('admin.common.detail')}
              </LinkButton>
              <LinkButton
                to={`/admin/sponsors/${item.id}/edit`}
                size="sm"
                variant="ghost"
                className="flex-1"
              >
                {t('admin.common.edit')}
              </LinkButton>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="flex-1"
                disabled={busyId === item.id}
                onClick={() => onDelete(item)}
              >
                {t('admin.common.delete')}
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
            <th className="px-4 py-3 font-medium">
              {t('admin.common.companyName')}
            </th>
            <th className="px-4 py-3 font-medium">
              {t('admin.common.projectName')}
            </th>
            <th className="px-4 py-3 font-medium">
              {t('admin.sponsors.projectType')}
            </th>
            <th className="px-4 py-3 font-medium">{t('admin.common.status')}</th>
            <th className="px-4 py-3 font-medium">{t('admin.common.amount')}</th>
            <th className="px-4 py-3 font-medium">
              {t('admin.common.deadline')}
            </th>
            <th className="px-4 py-3 font-medium">
              {t('admin.sponsors.publishDate')}
            </th>
            <th className="px-4 py-3 font-medium">
              {t('admin.common.assignee')}
            </th>
            <th className="px-4 py-3 font-medium">
              {t('admin.common.actions')}
            </th>
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
                {t(`admin.sponsors.types.${item.project_type}`)}
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
                        {t(`admin.sponsors.statuses.${status}`)}
                      </option>
                    ))}
                  </select>
                </div>
              </td>
              <td className="px-4 py-3 text-gold">
                {formatSponsorAmount(item.amount)}
              </td>
              <td className="px-4 py-3 text-muted">
                {item.due_date || t('admin.common.dash')}
              </td>
              <td className="px-4 py-3 text-muted">
                {item.publish_date || t('admin.common.dash')}
              </td>
              <td className="px-4 py-3 text-muted">
                {item.contact_person || t('admin.common.dash')}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <LinkButton
                    to={`/admin/sponsors/${item.id}`}
                    size="sm"
                    variant="ghost"
                  >
                    {t('admin.common.detail')}
                  </LinkButton>
                  <LinkButton
                    to={`/admin/sponsors/${item.id}/edit`}
                    size="sm"
                    variant="ghost"
                  >
                    {t('admin.common.edit')}
                  </LinkButton>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => onDelete(item)}
                  >
                    {t('admin.common.delete')}
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
