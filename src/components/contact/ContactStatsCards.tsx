import { Briefcase, CheckCircle2, Clock3, Mail, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui';
import type { ContactStats } from '@/types/contact';

interface ContactStatsCardsProps {
  stats?: ContactStats;
  isLoading?: boolean;
}

export default function ContactStatsCards({
  stats,
  isLoading = false,
}: ContactStatsCardsProps) {
  const cards = [
    {
      label: '総問い合わせ数',
      value: stats?.total ?? 0,
      icon: Mail,
      accent: 'text-white bg-white/10',
    },
    {
      label: '未対応',
      value: stats?.new_count ?? 0,
      icon: Clock3,
      accent: 'text-youtube-red bg-youtube-red/15',
    },
    {
      label: '対応中',
      value: stats?.in_progress_count ?? 0,
      icon: Sparkles,
      accent: 'text-warning bg-warning/15',
    },
    {
      label: '完了',
      value: stats?.completed_count ?? 0,
      icon: CheckCircle2,
      accent: 'text-success bg-success/15',
    },
    {
      label: '今月',
      value: stats?.monthly_count ?? 0,
      icon: Mail,
      accent: 'text-gold bg-gold/15',
    },
    {
      label: '企業案件系',
      value: stats?.sponsor_related_count ?? 0,
      icon: Briefcase,
      accent: 'text-gold bg-gold/15',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ label, value, icon: Icon, accent }) => (
        <Card key={label} hoverable>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {isLoading ? '—' : value.toLocaleString('ja-JP')}
              </p>
            </div>
            <div className={['rounded-2xl p-3', accent].join(' ')}>
              <Icon size={18} />
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
