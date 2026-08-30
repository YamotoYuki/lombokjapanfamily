import { useEffect } from 'react';
import {
  HeroSection,
  NotificationBanner,
  ChannelStatsSection,
  OfficialSocialSection,
  LatestVideosSection,
  PopularVideosSection,
  FamilySection,
  AnnouncementsSection,
  GallerySection,
  ContactSection,
} from '@/components/public';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { useFamilyProfiles } from '@/hooks/useFamilyProfiles';
import { useGallery } from '@/hooks/useGallery';
import { consumeFamilyScrollY } from '@/lib/familyNavigation';
import { consumeAnnouncementScrollY } from '@/lib/announcementNavigation';
import { useTranslation } from 'react-i18next';
import { toPublicFamilyMember } from '@/types/family';
import type { PublicGalleryItem } from '@/types/public';

export default function HomePage() {
  const { t } = useTranslation();
  const familyQuery = useFamilyProfiles({
    visibleOnly: true,
    showOnHome: true,
  });
  const announcementsQuery = useAnnouncements({
    publishedOnly: true,
    page: 1,
    limit: 3,
  });
  const galleryQuery = useGallery({
    visible_only: true,
    page: 1,
    limit: 6,
  });

  // API filters show_on_home=true when the column exists; exclude explicit OFF.
  const members = (familyQuery.data ?? [])
    .filter((profile) => profile.show_on_home !== false)
    .map(toPublicFamilyMember);
  const announcements = announcementsQuery.data?.items ?? [];

  const galleryItems: PublicGalleryItem[] = (galleryQuery.data?.items ?? []).map(
    (item) => ({
      id: item.id,
      title: item.title || t('common.untitled'),
      category: item.category?.name || t('gallery.categories.other'),
      imageUrl: item.thumbnail_url || item.image_url,
    }),
  );

  useEffect(() => {
    const familyY = consumeFamilyScrollY();
    const announcementY = consumeAnnouncementScrollY();
    const y = familyY ?? announcementY;
    if (y == null) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    });
  }, []);

  return (
    <>
      <HeroSection />
      <NotificationBanner />
      <ChannelStatsSection />
      <OfficialSocialSection />
      <LatestVideosSection />
      <PopularVideosSection />
      {familyQuery.isLoading ? (
        <section className="py-16 text-center text-sm text-muted">
          {t('home.loadingFamily')}
        </section>
      ) : members.length > 0 ? (
        <FamilySection members={members} />
      ) : null}
      {announcementsQuery.isLoading ? (
        <section className="py-16 text-center text-sm text-muted">
          {t('home.loadingAnnouncements')}
        </section>
      ) : (
        <AnnouncementsSection items={announcements} />
      )}
      {galleryQuery.isLoading ? (
        <section className="py-16 text-center text-sm text-muted">
          {t('home.loadingGallery')}
        </section>
      ) : (
        <GallerySection items={galleryItems} />
      )}
      <ContactSection />
    </>
  );
}
