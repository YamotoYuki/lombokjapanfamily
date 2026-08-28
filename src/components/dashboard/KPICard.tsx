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
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm text-muted">{metric.label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {metric.value}
          </p>
          <p
            className={[
              'mt-2 inline-flex items-center gap-1 text-xs font-medium',
              isUp ? 'text-success' : 'text-youtube-red',
            ].join(' ')}
          >
            {isUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {metric.change}
            <span className="text-muted"> vs last month</span>
          </p>
        </div>
        <div className="rounded-2xl bg-youtube-red/15 p-3 text-youtube-red ring-1 ring-youtube-red/25 transition-colors group-hover:bg-youtube-red/25">
          <Icon size={20} />
        </div>
      </div>
    </Card>
  );
}
