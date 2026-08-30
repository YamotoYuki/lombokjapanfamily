import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { rememberFamilyNavigation } from '@/lib/familyNavigation';
import { translateFamilyRole } from '@/lib/publicLabels';
import { shortFamilyIntro } from '@/types/family';
import type { PublicFamilyMember } from '@/types/public';

interface FamilyCardProps {
  member: PublicFamilyMember;
}

/**
 * List card links to detail only.
 * Personal SNS is shown on the detail page to avoid nested links / mis-taps.
 */
export default function FamilyCard({ member }: FamilyCardProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const intro = shortFamilyIntro(member.bio, 64);
  const detailPath = `/family/${member.id}`;
  const roleLabel = translateFamilyRole(member.role, t);

  return (
    <article className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03] text-left transition-all duration-500 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <Link
        to={detailPath}
        aria-label={`${member.name} — ${t('family.viewProfile')}`}
        className="absolute inset-0 z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold/50"
        onClick={() => rememberFamilyNavigation(location.pathname)}
      />

      <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/5]">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5 text-sm text-muted">
            {t('common.noImage')}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-primary-bg/30 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-5">
          {roleLabel ? (
            <p className="truncate text-[9px] uppercase tracking-[0.16em] text-gold sm:text-xs sm:tracking-[0.2em]">
              {roleLabel}
            </p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 break-words font-display text-base font-semibold leading-snug text-white sm:mt-1.5 sm:text-2xl">
            {member.name}
          </h3>
          {member.nickname ? (
            <p className="mt-1 truncate text-[11px] text-white/60 sm:text-xs">
              @{member.nickname}
            </p>
          ) : null}
          {intro ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/75 sm:mt-2 sm:text-sm">
              {intro}
            </p>
          ) : null}
          <p className="mt-2 text-[11px] font-medium text-gold/90 sm:mt-3 sm:text-xs">
            {t('family.viewProfile')}
          </p>
        </div>
      </div>
    </article>
  );
}
