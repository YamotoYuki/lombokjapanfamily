import { Instagram, Youtube } from 'lucide-react';
import FamilyVisibilityBadge from '@/components/family/FamilyVisibilityBadge';
import { Button, Card } from '@/components/ui';
import { familyDisplayName } from '@/types/family';
import type { FamilyProfile } from '@/types/family';

interface FamilyCardProps {
  member: FamilyProfile;
  onEdit: (member: FamilyProfile) => void;
  onHide: (member: FamilyProfile) => void;
  onMove: (member: FamilyProfile, direction: 'up' | 'down') => void;
  busy?: boolean;
}

export default function FamilyCard({
  member,
  onEdit,
  onHide,
  onMove,
  busy,
}: FamilyCardProps) {
  const title = familyDisplayName(member);

  return (
    <Card className="overflow-hidden !p-0">
      <div className="grid gap-0 sm:grid-cols-[140px_1fr]">
        <div className="aspect-[4/5] overflow-hidden bg-primary-bg/80 sm:aspect-auto sm:h-full">
          {member.photo_url ? (
            <img
              src={member.photo_url}
              alt={title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[160px] items-center justify-center text-xs text-muted">
              No Image
            </div>
          )}
        </div>
        <div className="space-y-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs text-gold">{member.role || '—'}</p>
              <h3 className="mt-1 text-xl font-semibold text-white">{title}</h3>
              {member.nickname ? (
                <p className="mt-0.5 text-xs text-muted">@{member.nickname}</p>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1">
              <FamilyVisibilityBadge visible={member.is_visible} />
              {member.is_visible && (
                <span
                  className={[
                    'rounded-full px-2 py-0.5 text-[10px]',
                    member.show_on_home !== false
                      ? 'bg-youtube-red/20 text-red-200'
                      : 'bg-white/10 text-muted',
                  ].join(' ')}
                >
                  {member.show_on_home !== false ? 'TOP表示' : 'Familyのみ'}
                </span>
              )}
            </div>
          </div>
          <p className="line-clamp-3 text-sm text-muted">
            {member.description || '紹介文未設定'}
          </p>
          {(member.instagram_url ||
            member.youtube_url ||
            member.tiktok_url ||
            member.x_url) && (
            <div className="flex gap-2 text-muted">
              {member.instagram_url && <Instagram size={15} />}
              {member.youtube_url && <Youtube size={15} />}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onEdit(member)}
            >
              編集
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onMove(member, 'up')}
            >
              ↑
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => onMove(member, 'down')}
            >
              ↓
            </Button>
            {member.is_visible && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={busy}
                onClick={() => onHide(member)}
              >
                非表示
              </Button>
            )}
          </div>
          <p className="text-[11px] text-muted">表示順: {member.display_order}</p>
        </div>
      </div>
    </Card>
  );
}
