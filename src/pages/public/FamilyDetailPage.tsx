import { useLayoutEffect } from 'react';
import { ArrowLeft, Instagram, Youtube } from 'lucide-react';
import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import { YOUTUBE_CHANNEL_URL } from '@/data/brand';
import { useFamilyProfile } from '@/hooks/useFamilyProfiles';
import { useSettings } from '@/hooks/useSettings';
import { peekFamilyReturnPath } from '@/lib/familyNavigation';
import { classifyFamilyAudience } from '@/lib/familyRole';
import { isDisplayableSnsUrl } from '@/lib/familySns';
import { translateFamilyRole } from '@/lib/publicLabels';
import { toPublicFamilyMember } from '@/types/family';
import type { PublicFamilyMember } from '@/types/public';

function ProfileField({ label, value }: { label: string; value?: string }) {
  const text = value?.trim();
  if (!text || text === '未設定') return null;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-gold">
        {label}
      </p>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/88">
        {text}
      </p>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.28em] text-gold">
      {children}
    </p>
  );
}

function FieldGrid({
  title,
  items,
}: {
  title: string;
  items: { label: string; value?: string }[];
}) {
  const visible = items.filter((item) => {
    const text = item.value?.trim();
    return Boolean(text) && text !== '未設定';
  });
  if (visible.length === 0) return null;
  return (
    <section>
      <SectionLabel>{title}</SectionLabel>
      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((item) => (
          <ProfileField
            key={item.label}
            label={item.label}
            value={item.value}
          />
        ))}
      </div>
    </section>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/30 px-4 text-sm text-white/90 transition-colors hover:border-youtube-red/50 hover:text-white"
      aria-label={label}
    >
      {children}
    </a>
  );
}

function MemberDetail({
  member,
  youtubeChannelUrl,
}: {
  member: PublicFamilyMember;
  youtubeChannelUrl: string;
}) {
  const { t } = useTranslation();
  const audience = classifyFamilyAudience(member.role);
  const roleLabel = translateFamilyRole(member.role, t);

  const personalSns = [
    {
      field: 'youtube_url' as const,
      href: member.youtube,
      label: `${member.name} YouTube`,
      icon: <Youtube size={17} />,
      text: t('family.youtube'),
    },
    {
      field: 'instagram_url' as const,
      href: member.instagram,
      label: `${member.name} Instagram`,
      icon: <Instagram size={17} />,
      text: t('family.instagram'),
    },
    {
      field: 'tiktok_url' as const,
      href: member.tiktok,
      label: `${member.name} TikTok`,
      icon: <span className="text-[11px] font-semibold">TT</span>,
      text: t('family.tiktok'),
    },
    {
      field: 'x_url' as const,
      href: member.x,
      label: `${member.name} X`,
      icon: <span className="text-[11px] font-semibold">X</span>,
      text: t('family.x'),
    },
  ].filter((item) => isDisplayableSnsUrl(item.field, item.href));

  const profileBlock = [
    { label: t('family.hometown'), value: member.hometown },
    { label: t('family.currentLocation'), value: member.currentLocation },
    { label: t('family.languages'), value: member.languages },
  ];

  const hobbiesBlock = [
    {
      label:
        audience === 'child'
          ? t('family.hobbiesPlay')
          : t('family.hobbies'),
      value: member.hobbies,
    },
  ];

  const adultMedia = [
    { label: t('family.favoriteMovie'), value: member.favoriteMovie },
    { label: t('family.favoriteAnime'), value: member.favoriteAnime },
    { label: t('family.favoriteMusic'), value: member.favoriteMusic },
  ];

  const foodBlock = [
    { label: t('family.favoriteFood'), value: member.favoriteFood },
    { label: t('family.favoriteDrink'), value: member.favoriteDrink },
  ];

  const placesBlock = [
    { label: t('family.favoriteJapan'), value: member.favoriteJapan },
    { label: t('family.favoriteIndonesia'), value: member.favoriteIndonesia },
  ];

  const lowerSections =
    audience === 'child'
      ? [
          <FieldGrid
            key="profile"
            title={t('family.profileSection')}
            items={profileBlock}
          />,
          <FieldGrid
            key="hobbies"
            title={t('family.hobbiesPlay')}
            items={hobbiesBlock}
          />,
          <FieldGrid
            key="anime"
            title={t('family.favoriteAnime')}
            items={[
              {
                label: t('family.favoriteAnime'),
                value: member.favoriteAnime,
              },
            ]}
          />,
          <FieldGrid
            key="movie"
            title={t('family.favoriteMovie')}
            items={[
              {
                label: t('family.favoriteMovie'),
                value: member.favoriteMovie,
              },
            ]}
          />,
          <FieldGrid
            key="food"
            title={t('family.foodSection')}
            items={foodBlock}
          />,
          <FieldGrid
            key="places"
            title={t('family.placesSection')}
            items={placesBlock}
          />,
          <FieldGrid
            key="dream"
            title={t('family.dream')}
            items={[{ label: t('family.dream'), value: member.dream }]}
          />,
          <FieldGrid
            key="message"
            title={t('family.message')}
            items={[{ label: t('family.message'), value: member.message }]}
          />,
        ]
      : [
          <FieldGrid
            key="profile"
            title={t('family.profileSection')}
            items={profileBlock}
          />,
          <FieldGrid
            key="hobbies"
            title={t('family.hobbies')}
            items={hobbiesBlock}
          />,
          <FieldGrid
            key="media"
            title={t('family.mediaSection')}
            items={adultMedia}
          />,
          <FieldGrid
            key="food"
            title={t('family.foodSection')}
            items={foodBlock}
          />,
          <FieldGrid
            key="places"
            title={t('family.placesSection')}
            items={placesBlock}
          />,
          <FieldGrid
            key="message"
            title={t('family.dreamSection')}
            items={[
              { label: t('family.dream'), value: member.dream },
              { label: t('family.message'), value: member.message },
            ]}
          />,
        ];

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
      <FadeIn>
        <div className="grid gap-8 md:grid-cols-[minmax(0,280px)_minmax(0,1fr)] md:items-start lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:gap-10">
          <div className="relative mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03] md:mx-0 md:max-w-none">
            {member.photoUrl ? (
              <img
                src={member.photoUrl}
                alt={member.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full min-h-[280px] items-center justify-center bg-white/5 text-sm text-muted">
                {t('common.noImage')}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-5">
            <div>
              {roleLabel ? (
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                  {roleLabel}
                </p>
              ) : null}
              <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {member.name}
              </h1>
              {member.nickname?.trim() && member.nickname.trim() !== '未設定' ? (
                <p className="mt-1.5 text-sm text-white/65">
                  @{member.nickname.trim()}
                </p>
              ) : null}
            </div>

            {member.bio?.trim() ? (
              <section>
                <SectionLabel>{t('family.bio')}</SectionLabel>
                <div className="rounded-[1.35rem] border border-white/10 bg-gradient-to-br from-youtube-red/10 via-white/[0.03] to-gold/10 px-5 py-5">
                  <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/90 sm:text-[15px]">
                    {member.bio}
                  </p>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <div className="mt-10 space-y-8">
          {lowerSections}

          {personalSns.length > 0 ? (
            <section>
              <SectionLabel>{t('family.sns')}</SectionLabel>
              <div className="flex flex-wrap gap-2.5">
                {personalSns.map((item) => (
                  <SocialLink
                    key={item.field}
                    href={item.href!}
                    label={item.label}
                  >
                    {item.icon}
                    {item.text}
                  </SocialLink>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <SectionLabel>{t('family.officialChannelSection')}</SectionLabel>
            <a
              href={youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-red-600"
            >
              <Youtube size={16} aria-hidden />
              {t('family.officialChannelCta')}
            </a>
          </section>
        </div>
      </FadeIn>
    </div>
  );
}

export default function PublicFamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const profileId = id?.trim() || '';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: settings } = useSettings();
  const detailQuery = useFamilyProfile(profileId || undefined);

  // Strict identity match: never render a cached row for another :id.
  const profile =
    detailQuery.data && detailQuery.data.id === profileId
      ? detailQuery.data
      : undefined;
  const visible = profile?.is_visible !== false;
  const member =
    profile && visible ? toPublicFamilyMember(profile) : undefined;
  const waitingForMatch =
    Boolean(profileId) &&
    (detailQuery.isLoading ||
      detailQuery.isFetching ||
      detailQuery.isPending) &&
    !member;

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [profileId]);

  const handleBack = () => {
    if (peekFamilyReturnPath()) {
      navigate(-1);
      return;
    }
    navigate('/family');
  };

  const youtubeChannelUrl =
    settings?.youtube_channel_url?.trim() || YOUTUBE_CHANNEL_URL;

  return (
    <div key={profileId} className="min-h-screen overflow-x-hidden bg-[#0d1524] pt-20">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={handleBack}
          aria-label={t('family.backToList')}
          className="touch-target inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-2 text-sm font-medium text-white transition-colors hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
        >
          <ArrowLeft size={16} aria-hidden />
          {t('family.backToList')}
        </button>
      </div>

      {waitingForMatch && (
        <p className="px-4 py-20 text-center text-sm text-muted">
          {t('family.loading')}
        </p>
      )}
      {detailQuery.isError && !waitingForMatch && (
        <div className="px-4 py-20 text-center">
          <p className="text-sm text-red-300">{t('family.error')}</p>
          <Link
            to="/family"
            className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-amber-300"
          >
            <ArrowLeft size={14} aria-hidden />
            {t('family.backToList')}
          </Link>
        </div>
      )}
      {!waitingForMatch &&
        !detailQuery.isError &&
        !member && (
          <div className="px-4 py-20 text-center">
            <p className="text-sm text-muted">{t('family.notFound')}</p>
            <Link
              to="/family"
              className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-amber-300"
            >
              <ArrowLeft size={14} aria-hidden />
              {t('family.backToList')}
            </Link>
          </div>
        )}
      {member ? (
        <MemberDetail
          key={member.id}
          member={member}
          youtubeChannelUrl={youtubeChannelUrl}
        />
      ) : null}
    </div>
  );
}
