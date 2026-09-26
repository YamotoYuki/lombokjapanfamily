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
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-6">
      {cards.map(({ key, label, value, icon: Icon, accent }) => (
        <Card key={key} hoverable>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-[11px] text-muted sm:text-sm">
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold text-white sm:mt-2 sm:text-2xl">
                {isLoading ? '—' : value.toLocaleString(locale)}
              </p>
            </div>
            <div
              className={[
                'shrink-0 rounded-xl p-1.5 sm:rounded-2xl sm:p-3',
                accent,
              ].join(' ')}
            >
              <Icon size={14} className="sm:hidden" aria-hidden />
              <Icon size={18} className="hidden sm:block" aria-hidden />
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
}
