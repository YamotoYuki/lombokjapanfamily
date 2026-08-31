import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnnouncementCard from '@/components/public/AnnouncementCard';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import type { Announcement } from '@/types/announcement';

interface AnnouncementsSectionProps {
  /** When provided, skip fetching (e.g. list page reuse). */
  items?: Announcement[];
  /** Home shows the newest N items only. */
  limit?: number;
  showHeading?: boolean;
  showMoreLink?: boolean;
}

export default function AnnouncementsSection({
  items: itemsProp,
  limit = 3,
  showHeading = true,
  showMoreLink = true,
}: AnnouncementsSectionProps) {
  const { t } = useTranslation();
  const shouldFetch = itemsProp === undefined;
  const query = useAnnouncements(
    {
      publishedOnly: true,
      page: 1,
      limit,
    },
    { enabled: shouldFetch },
  );

  const rawItems = itemsProp ?? query.data?.items ?? [];
  // Newest-first API; keep only the first N for home.
  const items = rawItems.slice(0, limit);
  const total = shouldFetch
    ? (query.data?.total ?? items.length)
    : rawItems.length;
  const isLoading = shouldFetch && query.isLoading;
  const isError = shouldFetch && query.isError;
  const showAllCta = showMoreLink && !isLoading && !isError && items.length > 0;

  return (
    <section
      id="announcements"
      className="relative overflow-hidden border-y border-white/5 bg-[#0d1524] py-16 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-youtube-red/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {showHeading ? (
          <FadeIn>
            <SectionHeading
              eyebrow={t('announcements.eyebrow')}
              title={t('announcements.title')}
              description={t('announcements.description')}
            />
          </FadeIn>
        ) : null}

        {isLoading ? (
          <p className="rounded-2xl border border-white/10 px-6 py-12 text-center text-sm text-muted">
            {t('announcements.loading')}
          </p>
        ) : null}

        {isError ? (
          <p className="rounded-2xl border border-red-400/20 bg-red-500/5 px-6 py-12 text-center text-sm text-red-300">
            {t('announcements.error')}
          </p>
        ) : null}

        {!isLoading && !isError && items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 px-6 py-12 text-center">
            <p className="text-sm text-muted">{t('announcements.empty')}</p>
          </div>
        ) : null}

        {!isLoading && !isError && items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item, index) => (
              <FadeIn key={item.id} delayMs={index * 70}>
                <AnnouncementCard item={item} />
              </FadeIn>
            ))}
          </div>
        ) : null}

        {showAllCta ? (
          <FadeIn delayMs={120}>
            <div className="mt-8 flex flex-col items-center gap-2 sm:mt-10">
              <Link
                to="/announcements"
                className="inline-flex items-center justify-center rounded-2xl border border-gold/35 bg-gold/10 px-6 py-3 text-sm font-semibold text-gold transition-colors hover:bg-gold/20"
              >
                {t('announcements.viewMore')}
              </Link>
              {total > limit ? (
                <p className="text-xs text-muted">
                  {t('announcements.showingLatest', { count: limit })}
                </p>
              ) : null}
            </div>
          </FadeIn>
        ) : null}
      </div>
    </section>
  );
}
