import { Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/dashboard/SectionHeader';
import { familyDisplayName } from '@/types/family';
import type { FamilyProfile } from '@/types/family';

interface FamilyCardProps {
  members: FamilyProfile[];
  total?: number;
  visibleCount?: number;
  isLoading?: boolean;
}

export default function FamilyCard({
  members,
  total,
  visibleCount,
  isLoading,
}: FamilyCardProps) {
  return (
    <Card className="h-full">
      <SectionHeader
        title="ファミリー管理"
        subtitle={
          typeof total === 'number'
            ? `全${total}名 / 公開${visibleCount ?? 0}名`
            : 'プロフィール一覧'
        }
        actionLabel="詳細"
        actionTo="/admin/family"
      />
      {isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : (
        <div className="space-y-3">
          {members.slice(0, 4).map((member) => (
            <div
              key={member.id}
              className="rounded-2xl border border-white/5 bg-primary-bg/40 p-3 transition-all hover:border-gold/25 hover:bg-primary-bg/70"
            >
              <div className="flex items-start gap-3">
                {member.photo_url ? (
                  <img
                    src={member.photo_url}
                    alt={familyDisplayName(member)}
                    className="h-12 w-12 rounded-full object-cover ring-2 ring-white/10"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 text-[10px] text-muted">
                    —
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {familyDisplayName(member)}
                      </p>
                      <p className="text-[11px] text-gold">
                        {member.role || '—'}
                      </p>
                    </div>
                    <Link to="/admin/family">
                      <Button variant="ghost" size="sm" className="!px-2 !py-1">
                        <Pencil size={13} />
                        編集
                      </Button>
                    </Link>
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted">
                    {member.description || '紹介文未設定'}
                  </p>
                </div>
              </div>
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-sm text-muted">プロフィールはまだありません。</p>
          )}
        </div>
      )}
    </Card>
  );
}
