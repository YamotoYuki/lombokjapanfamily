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
  return (
    <Card className="overflow-hidden !p-0">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-sm font-medium text-white">人気ページ TOP10</p>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-muted">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">ページ</th>
                <th className="px-4 py-3">PV</th>
                <th className="px-4 py-3">UU</th>
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
