import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { rememberAnnouncementNavigation } from '@/lib/announcementNavigation';
import { appLocale } from '@/lib/publicLabels';
import {
  announcementSummary,
  localizedAnnouncementContent,
  localizedAnnouncementTitle,
  type Announcement,
} from '@/types/announcement';

interface AnnouncementCardProps {
  item: Announcement;
}

export default function AnnouncementCard({ item }: AnnouncementCardProps) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const locale = appLocale(lang);
  const title = localizedAnnouncementTitle(item, lang);
  const summary = announcementSummary(
    localizedAnnouncementContent(item, lang),
    140,
  );
  const published = item.published_at
    ? new Date(item.published_at).toLocaleDateString(locale)
    : '';
  const detailPath = `/announcements/${item.id}`;

  if (!title) return null;

  return (
    <article className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <Link
        to={detailPath}
        aria-label={`${title} — ${t('announcements.viewDetail')}`}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/50"
        onClick={() => rememberAnnouncementNavigation(location.pathname)}
      />
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:gap-5 sm:p-6">
        {item.featured_image ? (
          <div className="aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl border border-white/10 sm:aspect-[4/3] sm:w-40">
            <img
              src={item.featured_image}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-gold/15 px-2.5 py-1 font-medium uppercase tracking-wide text-gold">
              {t(`announcements.categories.${item.category}`)}
            </span>
            {published ? (
              <span className="text-muted">{published}</span>
            ) : null}
          </div>
          <h3 className="mt-3 font-display text-xl font-semibold text-white transition-colors group-hover:text-gold sm:text-2xl">
            {title}
          </h3>
          {summary ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/70">
              {summary}
            </p>
          ) : null}
          <p className="mt-4 text-xs font-medium text-gold/90">
            {t('announcements.viewDetail')}
          </p>
        </div>
      </div>
    </article>
  );
}
