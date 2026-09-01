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
        <div className="overflow-x-auto">
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
      )}
    </Card>
  );
}
