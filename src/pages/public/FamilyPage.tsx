import { FadeIn, FamilySection, PageHero } from '@/components/public';
import { useFamilyProfiles } from '@/hooks/useFamilyProfiles';
import type { PublicFamilyMember } from '@/types/public';

function toPublicMember(
  profile: {
    id: string;
    name: string;
    role?: string;
    description?: string;
    photo_url?: string;
    instagram_url?: string;
    youtube_url?: string;
    tiktok_url?: string;
    x_url?: string;
  },
): PublicFamilyMember {
  return {
    id: profile.id,
    name: profile.name,
    role: profile.role || '',
    bio: profile.description || '',
    photoUrl: profile.photo_url || '',
    instagram: profile.instagram_url,
    youtube: profile.youtube_url,
    tiktok: profile.tiktok_url,
    x: profile.x_url,
  };
}

export default function PublicFamilyPage() {
  const familyQuery = useFamilyProfiles(true);
  const members = (familyQuery.data ?? []).map(toPublicMember);

  return (
    <>
      <PageHero
        eyebrow="Family"
        title="Meet Our Family"
        description="旅と日常をともにする、Lombok-Japan Family のメンバー紹介です。"
        backgroundImage="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1600&h=900&fit=crop"
      />
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {familyQuery.isLoading && (
          <p className="text-center text-sm text-muted">読み込み中...</p>
        )}
        {familyQuery.isError && (
          <p className="text-center text-sm text-red-300">
            家族プロフィールの取得に失敗しました
          </p>
        )}
      </section>
      {!familyQuery.isLoading && !familyQuery.isError && (
        <FadeIn>
          <FamilySection members={members} />
        </FadeIn>
      )}
    </>
  );
}
