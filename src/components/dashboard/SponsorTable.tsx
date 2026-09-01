import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import SponsorStatusBadge from '@/components/sponsors/SponsorStatusBadge';
import {
  formatSponsorAmount,
  type Sponsor,
} from '@/types/sponsor';

interface SponsorTableProps {
  items: Sponsor[];
  isLoading?: boolean;
  inProgressCount?: number;
  monthlyRevenue?: number;
  yearlyRevenue?: number;
}

export default function SponsorTable({
  items,
  isLoading,
  inProgressCount,
  monthlyRevenue,
  yearlyRevenue,
}: SponsorTableProps) {
  const { t } = useTranslation();

  return (
    <Card className="h-full overflow-hidden">
      <SectionHeader
        title={t('admin.dashboard.sponsors')}
        subtitle={
          typeof inProgressCount === 'number'
            ? t('admin.dashboard.sponsorsSubtitle', {
                count: inProgressCount,
                month: formatSponsorAmount(monthlyRevenue ?? 0),
                year: formatSponsorAmount(yearlyRevenue ?? 0),
              })
            : t('admin.dashboard.sponsorsDefault')
        }
        actionLabel={t('admin.dashboard.manageDeals')}
        actionTo="/admin/sponsors"
      />
      {isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted">
                <th className="pb-3 pr-3 font-medium">
                  {t('admin.dashboard.colCompany')}
                </th>
                <th className="pb-3 pr-3 font-medium">
                  {t('admin.dashboard.colProject')}
                </th>
                <th className="pb-3 pr-3 font-medium">
                  {t('admin.dashboard.colAmount')}
                </th>
                <th className="pb-3 pr-3 font-medium">
                  {t('admin.common.state')}
                </th>
                <th className="pb-3 font-medium">
                  {t('admin.dashboard.colVideoUrl')}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="py-3 pr-3 font-medium text-white">
                    {item.company_name}
                  </td>
                  <td className="py-3 pr-3 text-muted">{item.project_name}</td>
                  <td className="py-3 pr-3 text-gold">
                    {formatSponsorAmount(item.amount)}
                  </td>
                  <td className="py-3 pr-3">
                    <SponsorStatusBadge status={item.status} />
                  </td>
                  <td className="py-3">
                    {item.youtube_url ? (
                      <a
                        href={item.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-white"
                      >
                        {t('admin.dashboard.open')}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-muted">
                        {t('admin.common.dash')}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-sm text-muted">
                    {t('admin.dashboard.noDeals')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
