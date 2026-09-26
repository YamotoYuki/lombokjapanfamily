import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { formatNumber, type AnalyticsSource } from '@/types/analytics';

interface TrafficSourcesTableProps {
  items: AnalyticsSource[];
  isLoading?: boolean;
}

export default function TrafficSourcesTable({
  items,
  isLoading,
}: TrafficSourcesTableProps) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden !p-0">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-sm font-medium text-white">
          {t('admin.analytics.trafficSources')}
        </p>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-muted">{t('admin.common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">{t('admin.common.empty')}</p>
      ) : (
        <>
          {/* Mobile/tablet-portrait (<768px): card rows, same reasoning as
              PopularPagesTable — a 5-column table has no room to breathe
              below md. */}
          <div className="divide-y divide-white/5 md:hidden">
            {items.slice(0, 10).map((item, index) => (
              <div
                key={`${item.source}-${item.medium}-${index}`}
                className="px-4 py-3"
              >
                <div className="flex items-start gap-2">
                  <p className="shrink-0 text-xs text-muted">{index + 1}</p>
                  <p className="truncate text-sm font-medium text-white">
                    {item.source || '(direct)'}
                    <span className="text-muted"> / {item.medium || '(none)'}</span>
                  </p>
                </div>
                <div className="mt-2 flex gap-4 pl-5 text-xs">
                  <span className="text-gold">
                    {t('admin.analytics.sessionsCol')} {formatNumber(item.sessions)}
                  </span>
                  <span className="text-muted">
                    {t('admin.analytics.usersCol')} {formatNumber(item.active_users)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet/desktop (>=768px): existing table, unchanged. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t('admin.analytics.source')}</th>
                  <th className="px-4 py-3">{t('admin.analytics.medium')}</th>
                  <th className="px-4 py-3">{t('admin.analytics.sessionsCol')}</th>
                  <th className="px-4 py-3">{t('admin.analytics.usersCol')}</th>
                </tr>
              </thead>
              <tbody>
                {items.slice(0, 10).map((item, index) => (
                  <tr
                    key={`${item.source}-${item.medium}-${index}`}
                    className="border-b border-white/5"
                  >
                    <td className="px-4 py-3 text-muted">{index + 1}</td>
                    <td className="px-4 py-3 text-white">
                      {item.source || '(direct)'}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {item.medium || '(none)'}
                    </td>
                    <td className="px-4 py-3 text-gold">
                      {formatNumber(item.sessions)}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {formatNumber(item.active_users)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Card>
  );
}
