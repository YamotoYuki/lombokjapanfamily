import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionViewAllLink from '@/components/public/SectionViewAllLink';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useInView } from '@/hooks/useInView';
import { rememberAnnouncementNavigation } from '@/lib/announcementNavigation';
import { appLocale } from '@/lib/publicLabels';
import {
  localizedAnnouncementTitle,
  type Announcement,
} from '@/types/announcement';

interface AnnouncementsSectionProps {
  /** When provided, skip fetching (e.g. list page reuse). */
  items?: Announcement[];
  /** Home shows the newest N items only. */
  limit?: number;
  showHeading?: boolean;
  showMoreLink?: boolean;
}

function AnnouncementRow({
  item,
  delayMs,
  isLast,
}: {
  item: Announcement;
  delayMs: number;
  isLast: boolean;
}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { ref, isInView } = useInView<HTMLAnchorElement>();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const locale = appLocale(lang);
  const title = localizedAnnouncementTitle(item, lang);
  const published = item.published_at
    ? new Date(item.published_at).toLocaleDateString(locale)
    : '';

  if (!title) return null;

  return (
    <Link
      ref={ref}
      to={`/announcements/${item.id}`}
      onClick={() => rememberAnnouncementNavigation(location.pathname)}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={[
        'group block pb-6 transition-all duration-700 ease-out',
        isInView ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0',
        isLast ? '' : 'border-b border-white/10',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {published ? <span className="text-muted">{published}</span> : null}
        <span className="rounded-full bg-gold/15 px-2.5 py-1 font-medium uppercase tracking-wide text-gold">
          {t(`announcements.categories.${item.category}`)}
        </span>
        {item.is_featured ? (
          <span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
            {t('admin.common.featured')}
          </span>
        ) : null}
      </div>
      <div className="mt-2.5 inline-block max-w-full">
        <p className="line-clamp-2 break-words text-base font-medium leading-relaxed text-white transition-colors group-hover:text-gold sm:text-lg">
          {title}
        </p>
        {/* Draws left-to-right once the row scrolls into view, slightly
            after the row itself fades up. */}
        <span
          aria-hidden
          style={{ transitionDelay: `${delayMs + 250}ms` }}
          className={[
            'mt-2 block h-[3px] w-full origin-left rounded-full bg-gold transition-transform duration-700 ease-out',
            isInView ? 'scale-x-100' : 'scale-x-0',
          ].join(' ')}
        />
      </div>
    </Link>
  );
}

export default function AnnouncementsSection({
  items: itemsProp,
  limit = 3,
  showHeading = true,
  showMoreLink = true,
}: AnnouncementsSectionProps) {
  const { t } = useTranslation();
  const shouldFetch = itemsProp === undefined;
  // Newest-first, same as every other page. `is_featured` still renders as a
  // badge on the row (see AnnouncementRow) but no longer reorders the list.
  const query = useAnnouncements(
    {
      publishedOnly: true,
      page: 1,
      limit,
    },
    { enabled: shouldFetch },
  );

  const rawItems = itemsProp ?? (query.data?.items ?? []);
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
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-24">
          {/* Left column: heading stays put; doesn't scroll with the list. */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            {showHeading ? (
              <FadeIn>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-gold">
                  {t('announcements.eyebrow')}
                </p>
                <h2 className="mt-3 break-words font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl md:text-4xl">
                  {t('announcements.title')}
                </h2>
                <p className="mt-4 max-w-sm break-words text-sm leading-relaxed text-muted md:text-base">
                  {t('announcements.description')}
                </p>
              </FadeIn>
            ) : null}

            {/* PC: CTA sits right under the title, not centered at the bottom. */}
            {showAllCta ? (
              <FadeIn delayMs={100}>
                <div className="mt-8 hidden flex-col items-center gap-2 lg:flex">
                  <SectionViewAllLink
                    to="/announcements"
                    label={t('announcements.viewMore')}
                  />
                  {total > limit ? (
                    <p className="text-center text-xs text-muted">
                      {t('announcements.showingLatest', { count: limit })}
                    </p>
                  ) : null}
                </div>
              </FadeIn>
            ) : null}
          </div>

          {/* Right column: the announcement list. */}
          <div className="min-w-0">
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
              <div className="space-y-6">
                {items.map((item, index) => (
                  <AnnouncementRow
                    key={item.id}
                    item={item}
                    delayMs={index * 70}
                    isLast={index === items.length - 1}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile/tablet only — PC shows the CTA under the title instead. */}
        {showAllCta ? (
          <FadeIn delayMs={150}>
            <div className="mt-10 flex flex-col items-center gap-2 sm:mt-12 lg:hidden">
              <SectionViewAllLink
                to="/announcements"
                label={t('announcements.viewMore')}
              />
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
