import {
  HeroSection,
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
import type { PublicFamilyMember, PublicGalleryItem } from '@/types/public';

export default function HomePage() {
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
      title: item.title || '（無題）',
      category: item.category?.name || '未分類',
      imageUrl: item.thumbnail_url || item.image_url,
    }),
  );

  return (
    <>
      <HeroSection />
      <PopularVideosSection />
      {familyQuery.isLoading ? (
        <section className="py-16 text-center text-sm text-muted">
          ファミリー情報を読み込んでいます...
        </section>
      ) : (
        <FamilySection members={members} />
      )}
      <BlogSection />
      {galleryQuery.isLoading ? (
        <section className="py-16 text-center text-sm text-muted">
          ギャラリーを読み込んでいます...
        </section>
      ) : (
        <GallerySection items={galleryItems} />
      )}
      <SponsorsSection items={sponsors} />
      <ContactSection />
    </>
  );
}
