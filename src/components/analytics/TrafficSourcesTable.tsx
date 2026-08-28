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
  return (
    <Card className="overflow-hidden !p-0">
      <div className="border-b border-white/10 px-4 py-3">
        <p className="text-sm font-medium text-white">流入元 TOP10</p>
      </div>
      {isLoading ? (
        <p className="px-4 py-6 text-sm text-muted">読み込み中...</p>
      ) : items.length === 0 ? (
        <p className="px-4 py-6 text-sm text-muted">データがありません</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted">
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Medium</th>
                <th className="px-4 py-3">Sessions</th>
                <th className="px-4 py-3">Users</th>
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
      )}
    </Card>
  );
}
