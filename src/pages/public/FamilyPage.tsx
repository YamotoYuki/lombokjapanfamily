import { useTranslation } from 'react-i18next';
import {
  AboutSection,
  FadeIn,
  FamilySection,
  PageHero,
} from '@/components/public';
import { useFamilyProfiles } from '@/hooks/useFamilyProfiles';
import { useSettings } from '@/hooks/useSettings';
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
  const { t } = useTranslation();
  const { data: settings } = useSettings();
  const familyQuery = useFamilyProfiles(true);
  const members = (familyQuery.data ?? []).map(toPublicMember);

  return (
    <>
      <PageHero
        eyebrow={t('family.pageEyebrow')}
        title={t('family.pageTitle')}
        description={t('family.pageDescription')}
        backgroundImage="https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1600&h=900&fit=crop"
      />
      <AboutSection youtubeUrl={settings?.youtube_channel_url} />
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {familyQuery.isLoading && (
          <p className="text-center text-sm text-muted">{t('family.loading')}</p>
        )}
        {familyQuery.isError && (
          <p className="text-center text-sm text-red-300">{t('family.error')}</p>
        )}
      </section>
      {!familyQuery.isLoading && !familyQuery.isError && members.length > 0 && (
        <FadeIn>
          <FamilySection members={members} />
        </FadeIn>
      )}
    </>
  );
}
