import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AboutSection,
  FadeIn,
  FamilySection,
  PageHero,
} from '@/components/public';
import { PAGE_IMAGES } from '@/data/pageImages';
import { useFamilyProfiles } from '@/hooks/useFamilyProfiles';
import { useSettings } from '@/hooks/useSettings';
import { consumeFamilyScrollY } from '@/lib/familyNavigation';
import { toPublicFamilyMember } from '@/types/family';

export default function PublicFamilyPage() {
  const { t, i18n } = useTranslation();
  const { data: settings } = useSettings();
  const familyQuery = useFamilyProfiles(true);
  const lang = i18n.resolvedLanguage || i18n.language || 'ja';
  const members = (familyQuery.data ?? []).map((profile) =>
    toPublicFamilyMember(profile, lang),
  );

  useEffect(() => {
    const y = consumeFamilyScrollY();
    if (y == null) return;
    requestAnimationFrame(() => {
      window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    });
  }, []);

  return (
    <>
      <PageHero
        eyebrow={t('family.pageEyebrow')}
        title={t('family.pageTitle')}
        description={t('family.pageDescription')}
        backgroundImage={PAGE_IMAGES.family}
      />
      <AboutSection youtubeUrl={settings?.youtube_channel_url} />
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {familyQuery.isLoading && (
          <p className="text-center text-sm text-muted">{t('family.loading')}</p>
        )}
        {familyQuery.isError && (
          <p className="text-center text-sm text-red-300">{t('family.error')}</p>
        )}
        {!familyQuery.isLoading &&
          !familyQuery.isError &&
          members.length === 0 && (
            <p className="text-center text-sm text-muted">{t('family.empty')}</p>
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
