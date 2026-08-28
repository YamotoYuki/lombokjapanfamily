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
  return (
    <Card className="h-full overflow-hidden">
      <SectionHeader
        title="スポンサー案件"
        subtitle={
          typeof inProgressCount === 'number'
            ? `進行中 ${inProgressCount}件 / 今月 ${formatSponsorAmount(monthlyRevenue ?? 0)} / 年間 ${formatSponsorAmount(yearlyRevenue ?? 0)}`
            : '企業タイアップ進捗'
        }
        actionLabel="案件管理"
        actionTo="/admin/sponsors"
      />
      {isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted">
                <th className="pb-3 pr-3 font-medium">会社名</th>
                <th className="pb-3 pr-3 font-medium">案件名</th>
                <th className="pb-3 pr-3 font-medium">金額</th>
                <th className="pb-3 pr-3 font-medium">状態</th>
                <th className="pb-3 font-medium">動画URL</th>
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
                        Open
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-sm text-muted">
                    最近の案件はありません。
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
