import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import UserRoleBadge from '@/components/users/UserRoleBadge';
import UserStatusBadge from '@/components/users/UserStatusBadge';
import type { User } from '@/types/user';

interface UsersTableProps {
  items: User[];
  isLoading?: boolean;
  total?: number;
  adminCount?: number;
  editorCount?: number;
  viewerCount?: number;
}

export default function UsersTable({
  items,
  isLoading,
  total,
  adminCount,
  editorCount,
  viewerCount,
}: UsersTableProps) {
  return (
    <Card className="h-full overflow-hidden">
      <SectionHeader
        title="ユーザー管理"
        subtitle={
          typeof total === 'number'
            ? `全${total} / A${adminCount ?? 0} E${editorCount ?? 0} V${viewerCount ?? 0}`
            : '権限とログイン状況'
        }
        actionLabel="すべて見る"
        actionTo="/admin/users"
      />
      {isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : (
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-muted">
                <th className="pb-3 pr-3 font-medium">ユーザー名</th>
                <th className="pb-3 pr-3 font-medium">メール</th>
                <th className="pb-3 pr-3 font-medium">権限</th>
                <th className="pb-3 pr-3 font-medium">状態</th>
                <th className="pb-3 font-medium">最終ログイン</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5 last:border-0 transition-colors hover:bg-white/[0.03]"
                >
                  <td className="py-3 pr-3 font-medium text-white">
                    {user.display_name || '—'}
                  </td>
                  <td className="py-3 pr-3 text-muted">{user.email}</td>
                  <td className="py-3 pr-3">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="py-3 pr-3">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="py-3 text-xs text-muted">
                    {user.last_login_at?.slice(0, 16).replace('T', ' ') || '—'}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-sm text-muted">
                    ユーザーデータがありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
