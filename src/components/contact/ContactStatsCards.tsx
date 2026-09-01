import { Briefcase, CheckCircle2, Clock3, Mail, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
  const { t, i18n } = useTranslation();
  const locale = i18n.resolvedLanguage || i18n.language || 'ja';

  const cards = [
    {
      key: 'total',
      label: t('admin.contact.statsTotal'),
      value: stats?.total ?? 0,
      icon: Mail,
      accent: 'text-white bg-white/10',
    },
    {
      key: 'new',
      label: t('admin.contact.status.new'),
      value: stats?.new_count ?? 0,
      icon: Clock3,
      accent: 'text-youtube-red bg-youtube-red/15',
    },
    {
      key: 'in_progress',
      label: t('admin.contact.status.in_progress'),
      value: stats?.in_progress_count ?? 0,
      icon: Sparkles,
      accent: 'text-warning bg-warning/15',
    },
    {
      key: 'completed',
      label: t('admin.contact.status.completed'),
      value: stats?.completed_count ?? 0,
      icon: CheckCircle2,
      accent: 'text-success bg-success/15',
    },
    {
      key: 'month',
      label: t('admin.common.thisMonth'),
      value: stats?.monthly_count ?? 0,
      icon: Mail,
      accent: 'text-gold bg-gold/15',
    },
    {
      key: 'sponsor',
      label: t('admin.contact.statsSponsorRelated'),
      value: stats?.sponsor_related_count ?? 0,
      icon: Briefcase,
      accent: 'text-gold bg-gold/15',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ key, label, value, icon: Icon, accent }) => (
        <Card key={key} hoverable>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">
                {isLoading ? '—' : value.toLocaleString(locale)}
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
