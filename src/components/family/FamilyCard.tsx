import { Instagram, Youtube } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FamilyVisibilityBadge from '@/components/family/FamilyVisibilityBadge';
import { Button } from '@/components/ui';
import { familyDisplayName, shortFamilyIntro } from '@/types/family';
import type { FamilyProfile } from '@/types/family';

interface FamilyCardProps {
  member: FamilyProfile;
  onEdit: (member: FamilyProfile) => void;
  onToggleVisibility: (member: FamilyProfile) => void;
  onMove: (member: FamilyProfile, direction: 'up' | 'down') => void;
  onDelete?: (member: FamilyProfile) => void;
  busy?: boolean;
}

export default function FamilyCard({
  member,
  onEdit,
  onToggleVisibility,
  onMove,
  onDelete,
  busy,
}: FamilyCardProps) {
  const { t } = useTranslation();
  const title = familyDisplayName(member);
  const intro = shortFamilyIntro(member.description, 64);

  return (
    <article className="overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.03]">
      <div className="relative aspect-[3/4] overflow-hidden sm:aspect-[4/5]">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5 text-xs text-muted">
            {t('admin.family.noImage')}
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-primary-bg/35 to-transparent" />
        <div className="absolute right-2 top-2 z-10">
          <FamilyVisibilityBadge visible={member.is_visible} />
        </div>
        <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-4">
          {member.role ? (
            <p className="truncate text-[9px] uppercase tracking-[0.16em] text-gold sm:text-xs sm:tracking-[0.2em]">
              {member.role}
            </p>
          ) : null}
          <h3 className="mt-1 line-clamp-2 break-words font-display text-base font-semibold leading-snug text-white sm:text-xl">
            {title}
          </h3>
          {member.nickname ? (
            <p className="mt-0.5 truncate text-[11px] text-white/60">
              @{member.nickname}
            </p>
          ) : null}
          {intro ? (
            <p className="mt-1.5 line-clamp-2 text-[11px] leading-relaxed text-white/75 sm:text-sm">
              {intro}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2 border-t border-white/5 p-2.5 sm:p-3">
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full"
            disabled={busy}
            onClick={() => onEdit(member)}
          >
            {t('admin.common.edit')}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="w-full"
            disabled={busy}
            onClick={() => onToggleVisibility(member)}
          >
            {member.is_visible
              ? t('admin.common.hidden')
              : t('admin.common.visible')}
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onMove(member, 'up')}
            aria-label={t('admin.family.moveUp')}
          >
            ↑
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={busy}
            onClick={() => onMove(member, 'down')}
            aria-label={t('admin.family.moveDown')}
          >
            ↓
          </Button>
          {onDelete ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={busy}
              onClick={() => onDelete(member)}
            >
              {t('admin.common.delete')}
            </Button>
          ) : null}
          {(member.instagram_url || member.youtube_url) && (
            <span className="ml-auto inline-flex gap-2 text-muted">
              {member.instagram_url ? <Instagram size={15} /> : null}
              {member.youtube_url ? <Youtube size={15} /> : null}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
