import { Instagram, Youtube } from 'lucide-react';
import FamilyVisibilityBadge from '@/components/family/FamilyVisibilityBadge';
import { Button, Card } from '@/components/ui';
import { familyDisplayName } from '@/types/family';
import type { FamilyProfile } from '@/types/family';

interface FamilyCardProps {
  member: FamilyProfile;
  onEdit: (member: FamilyProfile) => void;
  onToggleVisibility: (member: FamilyProfile) => void;
  onMove: (member: FamilyProfile, direction: 'up' | 'down') => void;
  busy?: boolean;
}

export default function FamilyCard({
  member,
  onEdit,
  onToggleVisibility,
  onMove,
  busy,
}: FamilyCardProps) {
  const title = familyDisplayName(member);

  return (
    <Card className="overflow-hidden !p-0">
      <div className="flex flex-col">
        <div className="aspect-[4/3] overflow-hidden bg-primary-bg/80 sm:aspect-[16/10]">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[140px] items-center justify-center text-xs text-muted">
              No Image
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs text-gold">{member.role || '—'}</p>
              <h3 className="mt-1 break-words text-lg font-semibold text-white sm:text-xl">
                {title}
              </h3>
              {member.nickname ? (
                <p className="mt-0.5 truncate text-xs text-muted">
                  @{member.nickname}
                </p>
              ) : null}
            </div>
            <FamilyVisibilityBadge visible={member.is_visible} />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full"
              disabled={busy}
              onClick={() => onEdit(member)}
            >
              編集
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full"
              disabled={busy}
              onClick={() => onToggleVisibility(member)}
            >
              {member.is_visible ? '非表示' : '表示'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onMove(member, 'up')}
              aria-label="上へ"
            >
              ↑
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onMove(member, 'down')}
              aria-label="下へ"
            >
              ↓
            </Button>
            {(member.instagram_url || member.youtube_url) && (
              <span className="ml-auto inline-flex gap-2 text-muted">
                {member.instagram_url ? <Instagram size={15} /> : null}
                {member.youtube_url ? <Youtube size={15} /> : null}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
