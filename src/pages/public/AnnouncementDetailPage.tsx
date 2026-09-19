import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Youtube } from 'lucide-react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArticleAccentLine,
  ArticleBackLink,
  ArticleHeroImage,
  ArticleParagraphs,
} from '@/components/public/ArticleDetailKit';
import { useAnnouncement } from '@/hooks/useAnnouncements';
import { articleDateLabel, splitArticleParagraphs } from '@/lib/articleContent';
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
  const paragraphs = splitArticleParagraphs(content);
  const publishedLabel = articleDateLabel(announcement?.published_at);
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
      className="public-page-offset min-h-screen overflow-x-hidden bg-[#0d1524]"
    >
      {announcement && title ? (
        <Helmet>
          <title>{seoTitle}</title>
          <meta name="description" content={seoDescription} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={seoDescription} />
        </Helmet>
      ) : null}

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
        <article className="mx-auto max-w-3xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14 lg:px-8 lg:pb-24">
          {/* 1. Section masthead — always above the fold, so this plays as a
              plain timed reveal rather than a scroll-triggered one. */}
          <div className="animate-fade-up">
            <p className="font-display text-3xl font-medium tracking-[0.35em] text-white/50 sm:text-4xl">
              NEWS
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.3em] text-gold">
              {t('nav.announcements')}
            </p>
          </div>

          {/* 2. Dateline + category */}
          <div className="animate-fade-up delay-100 mt-8 flex flex-wrap items-center gap-3 text-sm text-muted">
            {publishedLabel ? (
              <>
                <span className="tabular-nums tracking-wide">
                  {publishedLabel}
                </span>
                <span className="text-white/20" aria-hidden>
                  |
                </span>
              </>
            ) : null}
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {t(`announcements.categories.${announcement.category}`)}
            </span>
          </div>

          {/* 3. Title */}
          <h1 className="animate-fade-up delay-200 mt-4 break-words font-display text-3xl font-semibold leading-[1.15] tracking-tight text-white sm:text-5xl">
            {title}
          </h1>

          {/* 4. Thin accent line, drawn left-to-right */}
          <ArticleAccentLine />

          {/* 5. Hero image */}
          {announcement.featured_image ? (
            <ArticleHeroImage src={announcement.featured_image} alt="" />
          ) : null}

          {/* 6. Body — see ArticleParagraphs for why this is a timed
              reveal rather than a scroll-triggered one. */}
          <ArticleParagraphs paragraphs={paragraphs} />

          {announcement.youtube_url ? (
            <a
              href={announcement.youtube_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mx-auto mt-8 flex min-h-11 w-full max-w-2xl items-center justify-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600 sm:w-auto"
            >
              <Youtube size={16} aria-hidden />
              {t('announcements.watchYoutube')}
            </a>
          ) : null}

          {updatedLabel ? (
            <p className="mx-auto mt-8 max-w-2xl text-xs text-muted">
              {t('announcements.updatedAt')}: {updatedLabel}
            </p>
          ) : null}

          <div className="mt-14">
            <ArticleBackLink
              label={t('announcements.backToList')}
              onClick={handleBack}
            />
          </div>
        </article>
      ) : null}
    </div>
  );
}
