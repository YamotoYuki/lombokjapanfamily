import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui';
import { formatNumber, type AnalyticsPage } from '@/types/analytics';

interface PopularPagesTableProps {
  items: AnalyticsPage[];
  isLoading?: boolean;
}

export default function PopularPagesTable({
  items,
  isLoading,
}: PopularPagesTableProps) {
  const { t } = useTranslation();
  return (
    <Card className="overflow-hidden !p-0">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-sm font-medium text-white">
          {t('admin.analytics.popularPages')}
        </p>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-muted">{t('admin.common.loading')}</p>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">{t('admin.common.empty')}</p>
      ) : (
        <>
          {/* Mobile/tablet-portrait (<768px): card rows — avoids forcing a
              4-column table into a narrow viewport with tiny text. */}
          <div className="divide-y divide-white/5 md:hidden">
            {items.map((item, index) => (
              <div key={item.page_path} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  <p className="shrink-0 text-xs text-muted">{index + 1}</p>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {item.page_title || item.page_path}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {item.page_path}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex gap-4 pl-5 text-xs">
                  <span className="text-gold">
                    {t('admin.analytics.pv')} {formatNumber(item.pv)}
                  </span>
                  <span className="text-muted">
                    {t('admin.analytics.uu')} {formatNumber(item.active_users)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet/desktop (>=768px): existing table, unchanged. */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-muted">
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">{t('admin.analytics.page')}</th>
                  <th className="px-4 py-3">{t('admin.analytics.pv')}</th>
                  <th className="px-4 py-3">{t('admin.analytics.uu')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.page_path} className="border-b border-white/5">
                    <td className="px-4 py-3 text-muted">{index + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">
                        {item.page_title || item.page_path}
                      </p>
                      <p className="text-xs text-muted">{item.page_path}</p>
                    </td>
                    <td className="px-4 py-3 text-gold">
                      {formatNumber(item.pv)}
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
