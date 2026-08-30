import {
  HeroSection,
  AboutSection,
  PopularVideosSection,
  FamilySection,
  BlogSection,
  GallerySection,
  SponsorsSection,
  ContactSection,
} from '@/components/public';
import { sponsors } from '@/data/publicDummy';
import { useFamilyProfiles } from '@/hooks/useFamilyProfiles';
import { useGallery } from '@/hooks/useGallery';
import { useSettings } from '@/hooks/useSettings';
import { FEATURES } from '@/lib/features';
import { useTranslation } from 'react-i18next';
import type { PublicFamilyMember, PublicGalleryItem } from '@/types/public';

export default function HomePage() {
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const familyQuery = useFamilyProfiles(true);
  const galleryQuery = useGallery({
    visible_only: true,
    featured: true,
    page: 1,
    limit: 8,
  });

  const members: PublicFamilyMember[] = (familyQuery.data ?? []).map(
    (profile) => ({
      id: profile.id,
      name: profile.name,
      role: profile.role || '',
      bio: profile.description || '',
      photoUrl: profile.photo_url || '',
      instagram: profile.instagram_url,
      youtube: profile.youtube_url,
      tiktok: profile.tiktok_url,
      x: profile.x_url,
    }),
  );

  const galleryItems: PublicGalleryItem[] = (galleryQuery.data?.items ?? []).map(
    (item) => ({
      id: item.id,
      title: item.title || t('common.untitled'),
      category: item.category?.name || t('common.uncategorized'),
      imageUrl: item.thumbnail_url || item.image_url,
    }),
  );

  return (
    <>
      <HeroSection />
      <AboutSection youtubeUrl={settings?.youtube_channel_url} />
      <PopularVideosSection />
      {familyQuery.isLoading ? (
        <section className="py-16 text-center text-sm text-muted">
          {t('home.loadingFamily')}
        </section>
      ) : members.length > 0 ? (
        <FamilySection members={members} />
      ) : null}
      <BlogSection />
      {galleryQuery.isLoading ? (
        <section className="py-16 text-center text-sm text-muted">
          {t('home.loadingGallery')}
        </section>
      ) : (
        <GallerySection items={galleryItems} />
      )}
      {FEATURES.sponsors ? <SponsorsSection items={sponsors} /> : null}
      <ContactSection />
    </>
  );
}
