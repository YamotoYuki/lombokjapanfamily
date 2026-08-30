import { useLayoutEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Youtube } from 'lucide-react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import { useAnnouncement } from '@/hooks/useAnnouncements';
import { peekAnnouncementReturnPath } from '@/lib/announcementNavigation';
import { appLocale } from '@/lib/publicLabels';
import {
  localizedAnnouncementContent,
  localizedAnnouncementTitle,
} from '@/types/announcement';

export default function PublicAnnouncementDetailPage() {
  const { id } = useParams<{ id: string }>();
  const announcementId = id?.trim() || '';
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const detailQuery = useAnnouncement(announcementId || undefined);
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const locale = appLocale(lang);

  const item =
    detailQuery.data && detailQuery.data.id === announcementId
      ? detailQuery.data
      : undefined;
  const visible = item?.is_published !== false;
  const announcement = item && visible ? item : undefined;
  const waiting =
    Boolean(announcementId) &&
    (detailQuery.isLoading ||
      detailQuery.isFetching ||
      detailQuery.isPending) &&
    !announcement;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [announcementId]);

  const handleBack = () => {
    if (peekAnnouncementReturnPath()) {
      navigate(-1);
      return;
    }
    navigate('/announcements');
  };

  const title = announcement
    ? localizedAnnouncementTitle(announcement, lang)
    : '';
  const content = announcement
    ? localizedAnnouncementContent(announcement, lang)
    : '';
  const publishedLabel = announcement?.published_at
    ? new Date(announcement.published_at).toLocaleDateString(locale)
    : '';
  const updatedLabel = announcement?.updated_at
    ? new Date(announcement.updated_at).toLocaleString(locale)
    : '';
  const seoTitle = title
    ? `${title} | Lombok-Japan Family`
    : t('seo.announcementsTitle');
  const seoDescription =
    content.replace(/\s+/g, ' ').trim().slice(0, 140) ||
    t('seo.announcementsDescription');

  return (
    <div
      key={announcementId}
      className="min-h-screen overflow-x-hidden bg-[#0d1524] pt-20"
    >
      {announcement && title ? (
        <Helmet>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDescription} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={seoDescription} />
        </Helmet>
      ) : null}

      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('announcements.backToList')}
          className="touch-target inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <ArrowLeft size={16} aria-hidden />
          {t('announcements.backToList')}
        </button>
      </div>

      {waiting ? (
        <p className="px-4 py-20 text-center text-sm text-muted">
          {t('announcements.loading')}
        </p>
      ) : null}

      {detailQuery.isError && !waiting ? (
        <div className="px-4 py-20 text-center">
          <p className="text-sm text-red-300">{t('announcements.error')}</p>
          <Link
            to="/announcements"
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-amber-300"
          >
            <ArrowLeft size={14} aria-hidden />
            {t('announcements.backToList')}
          </Link>
        </div>
      ) : null}

      {!waiting && !detailQuery.isError && (!announcement || !title) ? (
        <div className="px-4 py-20 text-center">
          <p className="text-sm text-muted">{t('announcements.notFound')}</p>
          <Link
            to="/announcements"
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-amber-300"
          >
            <ArrowLeft size={14} aria-hidden />
            {t('announcements.backToList')}
          </Link>
        </div>
      ) : null}

      {announcement && title ? (
        <article className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-gold">
              {t(`announcements.categories.${announcement.category}`)}
            </p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {title}
            </h1>
            {publishedLabel ? (
              <p className="mt-3 text-sm text-muted">
                {t('announcements.publishedAt')}: {publishedLabel}
              </p>
            ) : null}

            {announcement.featured_image ? (
              <div className="mt-8 overflow-hidden rounded-[1.35rem] border border-white/10">
                <img
                  src={announcement.featured_image}
                  alt=""
                  className="aspect-[16/9] w-full object-cover"
                />
              </div>
            ) : null}

            {content ? (
              <div className="prose-invert mt-8 whitespace-pre-wrap text-base leading-8 text-white/88">
                {content}
              </div>
            ) : null}

            {announcement.youtube_url ? (
              <a
                href={announcement.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600"
              >
                <Youtube size={16} aria-hidden />
                {t('announcements.watchYoutube')}
              </a>
            ) : null}

            {updatedLabel ? (
              <p className="mt-8 text-xs text-muted">
                {t('announcements.updatedAt')}: {updatedLabel}
              </p>
            ) : null}

            <div className="mt-10">
              <button
                type="button"
                onClick={handleBack}
                className="touch-target inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gold/40 hover:text-gold"
              >
                <ArrowLeft size={16} aria-hidden />
                {t('announcements.backToList')}
              </button>
            </div>
          </FadeIn>
        </article>
      ) : null}
    </div>
  );
}
