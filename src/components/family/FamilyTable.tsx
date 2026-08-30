import FamilyVisibilityBadge from '@/components/family/FamilyVisibilityBadge';
import { Button } from '@/components/ui';
import { familyDisplayName } from '@/types/family';
import type { FamilyProfile } from '@/types/family';

interface FamilyTableProps {
  items: FamilyProfile[];
  busyId?: string | null;
  onEdit: (item: FamilyProfile) => void;
  onHide: (item: FamilyProfile) => void;
  onMove: (item: FamilyProfile, direction: 'up' | 'down') => void;
}

export default function FamilyTable({
  items,
  busyId,
  onEdit,
  onHide,
  onMove,
}: FamilyTableProps) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
        プロフィールはまだありません。
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium">画像</th>
            <th className="px-4 py-3 font-medium">名前</th>
            <th className="px-4 py-3 font-medium">続柄</th>
            <th className="px-4 py-3 font-medium">紹介文</th>
            <th className="px-4 py-3 font-medium">状態</th>
            <th className="px-4 py-3 font-medium">TOP</th>
            <th className="px-4 py-3 font-medium">表示順</th>
            <th className="px-4 py-3 font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const title = familyDisplayName(item);
            return (
              <tr key={item.id} className="border-b border-white/5">
                <td className="px-4 py-3">
                  {item.photo_url ? (
                    <img
                      src={item.photo_url}
                      alt={title}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 text-[10px] text-muted">
                      —
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium text-white">
                  <div>{title}</div>
                  {item.nickname ? (
                    <div className="text-xs text-muted">@{item.nickname}</div>
                  ) : null}
                </td>
                <td className="px-4 py-3 text-muted">{item.role || '—'}</td>
                <td className="max-w-xs px-4 py-3 text-muted">
                  <span className="line-clamp-2">{item.description || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <FamilyVisibilityBadge visible={item.is_visible} />
                </td>
                <td className="px-4 py-3 text-muted">
                  {item.show_on_home !== false ? 'ON' : 'OFF'}
                </td>
                <td className="px-4 py-3 text-muted">{item.display_order}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={() => onEdit(item)}
                    >
                      編集
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={() => onMove(item, 'up')}
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      disabled={busyId === item.id}
                      onClick={() => onMove(item, 'down')}
                    >
                      ↓
                    </Button>
                    {item.is_visible && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        disabled={busyId === item.id}
                        onClick={() => onHide(item)}
                      >
                        非表示
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
