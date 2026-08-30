import { useQuery } from '@tanstack/react-query';
import FadeIn from '@/components/public/FadeIn';
import { BRAND_NAME } from '@/data/brand';
import { appLocale } from '@/lib/publicLabels';
import { fetchChannelStats } from '@/services/videoApi';
import { useTranslation } from 'react-i18next';

function formatStatValue(value: number, locale: string): string {
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value.toLocaleString(locale)}+`;
}

function formatSyncedAt(value: string | null | undefined, locale: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function ChannelStatsSection() {
  const { t, i18n } = useTranslation();
  const locale = appLocale(i18n.resolvedLanguage || i18n.language);
  const statsQuery = useQuery({
    queryKey: ['youtube', 'channel-stats'],
    queryFn: fetchChannelStats,
    staleTime: 5 * 60 * 1000,
  });

  const stats = statsQuery.data;
  if (statsQuery.isLoading) {
    return (
      <section
        id="channel-stats"
        className="border-y border-white/5 bg-[#0d1524] py-10"
        aria-busy="true"
      >
        <p className="text-center text-sm text-muted">{t('common.loading')}</p>
      </section>
    );
  }
  if (!stats?.available) {
    // Keep anchor target so Hero scroll never hits a missing id.
    return <div id="channel-stats" className="sr-only" aria-hidden />;
  }

  const syncedLabel = formatSyncedAt(stats.synced_at, locale);
  const cards = [
    {
      id: 'subscribers',
      label: t('home.statSubscribers'),
      value: formatStatValue(stats.subscriber_count, locale),
    },
    {
      id: 'views',
      label: t('home.statViews'),
      value: formatStatValue(stats.total_view_count, locale),
    },
    {
      id: 'videos',
      label: t('home.statVideos'),
      value: formatStatValue(stats.video_count, locale),
    },
  ];

  return (
    <section
      id="channel-stats"
      className="relative border-y border-white/5 bg-[#0d1524] py-10 sm:py-16"
      aria-label={t('home.channelStatsAria')}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(220,38,38,0.12),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(245,158,11,0.1),transparent_45%)]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <p className="text-center text-[10px] font-medium uppercase tracking-[0.28em] text-gold sm:text-xs">
            YouTube Channel
          </p>
          <h2 className="mt-3 text-center font-display text-xl font-semibold tracking-tight text-white sm:text-3xl">
            <span className="text-youtube-red">Lombok</span>
            <span className="text-white">-Japan </span>
            <span className="text-gold">Family</span>
          </h2>
          <p className="sr-only">{BRAND_NAME}</p>
        </FadeIn>

        <div className="mt-6 grid grid-cols-3 gap-2 sm:mt-10 sm:gap-4">
          {cards.map((card, index) => (
            <FadeIn key={card.id} delayMs={index * 80}>
              <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-2 py-4 text-center sm:rounded-[1.25rem] sm:px-5 sm:py-6">
                <p className="text-[9px] uppercase tracking-[0.14em] text-gold sm:text-xs sm:tracking-[0.22em]">
                  {card.label}
                </p>
                <p className="mt-2 break-words font-display text-lg font-semibold text-white sm:mt-3 sm:text-3xl lg:text-4xl">
                  {card.value}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>

        {syncedLabel ? (
          <p className="mt-5 text-center text-xs text-muted sm:mt-6">
            {t('home.statUpdated')}: {syncedLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}
