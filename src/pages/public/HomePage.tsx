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
import { useFamilyProfiles } from '@/hooks/useFamilyProfiles';
import { useGallery } from '@/hooks/useGallery';
import { consumeFamilyScrollY } from '@/lib/familyNavigation';
import { consumeAnnouncementScrollY } from '@/lib/announcementNavigation';
import { useTranslation } from 'react-i18next';
import { toPublicFamilyMember } from '@/types/family';
import { localizedGalleryTitle } from '@/types/gallery';
import type { PublicGalleryItem } from '@/types/public';

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const familyQuery = useFamilyProfiles({
    visibleOnly: true,
    showOnHome: true,
  });
  const galleryQuery = useGallery({
    visible_only: true,
    page: 1,
    limit: 6,
  });

  // API filters show_on_home=true when the column exists; exclude explicit OFF.
  const members = (familyQuery.data ?? [])
    .filter((profile) => profile.show_on_home !== false)
    .map((profile) => toPublicFamilyMember(profile, lang));

  const galleryItems: PublicGalleryItem[] = (galleryQuery.data?.items ?? []).map(
    (item) => ({
      id: item.id,
      title: localizedGalleryTitle(item, lang) || t('common.untitled'),
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
      <AnnouncementsSection limit={3} />
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
