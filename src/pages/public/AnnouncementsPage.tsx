import {
  AnnouncementCard,
  FadeIn,
  PageHero,
} from '@/components/public';
import { PAGE_IMAGES } from '@/data/pageImages';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { consumeAnnouncementScrollY } from '@/lib/announcementNavigation';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function PublicAnnouncementsPage() {
  const { t } = useTranslation();
  const listQuery = useAnnouncements({
    publishedOnly: true,
    page: 1,
    limit: 50,
  });
  const items = listQuery.data?.items ?? [];

  useEffect(() => {
    const y = consumeAnnouncementScrollY();
    if (y == null) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    });
  }, []);

  return (
    <>
      <PageHero
        eyebrow={t('announcements.pageEyebrow')}
        title={t('announcements.pageTitle')}
        description={t('announcements.pageDescription')}
        backgroundImage={PAGE_IMAGES.announcements}
      />
      <section className="mx-auto max-w-5xl px-4 pt-6 pb-14 sm:px-6 lg:px-8 lg:pt-8 lg:pb-16">
        {listQuery.isLoading ? (
          <p className="text-center text-sm text-muted">
            {t('announcements.loading')}
          </p>
        ) : null}
        {listQuery.isError ? (
          <p className="text-center text-sm text-red-300">
            {t('announcements.error')}
          </p>
        ) : null}
        {!listQuery.isLoading && !listQuery.isError && items.length === 0 ? (
          <p className="text-center text-sm text-muted">
            {t('announcements.empty')}
          </p>
        ) : null}
        {!listQuery.isLoading && !listQuery.isError && items.length > 0 ? (
          <div className="space-y-4">
            {items.map((item, index) => (
              <FadeIn key={item.id} delayMs={index * 50}>
                <AnnouncementCard item={item} />
              </FadeIn>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}
