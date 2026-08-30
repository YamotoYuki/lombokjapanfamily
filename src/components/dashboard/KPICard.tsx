import {
  Eye,
  Mail,
  TrendingDown,
  TrendingUp,
  Users,
  BarChart3,
  type LucideIcon,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import type { KpiMetric } from '@/types/dashboard';

const iconMap: Record<KpiMetric['icon'], LucideIcon> = {
  views: Eye,
  subscribers: Users,
  contacts: Mail,
  pv: BarChart3,
};

interface KPICardProps {
  metric: KpiMetric;
}

export default function KPICard({ metric }: KPICardProps) {
  const Icon = iconMap[metric.icon];
  const isUp = metric.trend === 'up';

  return (
    <Card hoverable className="group relative overflow-hidden">
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-youtube-red/10 transition-transform duration-500 group-hover:scale-125" />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-muted">{metric.label}</p>
          <p className="mt-3 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {metric.value}
          </p>
          <p
            className={[
              'mt-2 inline-flex max-w-full flex-wrap items-center gap-1 text-xs font-medium',
              isUp ? 'text-success' : 'text-youtube-red',
            ].join(' ')}
          >
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span className="break-words">{metric.change}</span>
            <span className="text-muted"> vs last month</span>
          </p>
        </div>
        <div className="shrink-0 rounded-2xl bg-youtube-red/15 p-3 text-youtube-red ring-1 ring-youtube-red/25 transition-colors group-hover:bg-youtube-red/25">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}
