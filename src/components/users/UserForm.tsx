import { useEffect, useState } from 'react';
import { Button, Card, Input } from '@/components/ui';
import type { User } from '@/types/user';

interface UserFormProps {
  user: User;
  saving?: boolean;
  onSubmit: (input: { display_name: string; avatar_url?: string }) => Promise<void>;
}

export default function UserForm({ user, saving, onSubmit }: UserFormProps) {
  const [displayName, setDisplayName] = useState(user.display_name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? '');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user.display_name);
    setAvatarUrl(user.avatar_url ?? '');
  }, [user]);

  return (
    <Card>
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);
          if (!displayName.trim()) {
            setError('名前を入力してください');
            return;
          }
          void onSubmit({
            display_name: displayName.trim(),
            avatar_url: avatarUrl.trim() || undefined,
          }).catch((err: unknown) => {
            setError(
              err instanceof Error ? err.message : 'ユーザー更新に失敗しました',
            );
          });
        }}
      >
        <h3 className="text-lg font-semibold text-white">プロフィール編集</h3>
        <Input
          label="表示名"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <Input
          label="アバターURL"
          value={avatarUrl}
          onChange={(event) => setAvatarUrl(event.target.value)}
          placeholder="https://..."
        />
        {error && (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}
        <Button type="submit" disabled={saving}>
          {saving ? '保存中...' : 'プロフィールを保存'}
        </Button>
      </form>
    </Card>
  );
}
