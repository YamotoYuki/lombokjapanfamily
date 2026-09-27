import {
  AnnouncementCard,
  FadeIn,
  PageHero,
} from '@/components/public';
import { Pagination } from '@/components/ui';
import { PAGE_IMAGES } from '@/data/pageImages';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { consumeAnnouncementScrollY } from '@/lib/announcementNavigation';
import { computeTotalPages, DEFAULT_PAGE_SIZE } from '@/lib/pagination';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PublicAnnouncementsPage() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const listQuery = useAnnouncements({
    publishedOnly: true,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });

  const handlePageChange = (next: number) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  // Pin featured announcements to the front (stable sort keeps the
  // existing newest-first ordering among ties).
  const items = useMemo(
    () =>
      [...(listQuery.data?.items ?? [])].sort(
        (a, b) => Number(b.is_featured) - Number(a.is_featured),
      ),
    [listQuery.data],
  );

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
          <div className="space-y-6">
            {items.map((item, index) => (
              <FadeIn key={item.id} delayMs={index * 50}>
                <AnnouncementCard item={item} />
              </FadeIn>
            ))}
            <div className="pt-4">
              <Pagination
                page={page}
                totalPages={computeTotalPages(
                  listQuery.data?.total ?? 0,
                  DEFAULT_PAGE_SIZE,
                )}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
