import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input } from '@/components/ui';
import type { User } from '@/types/user';

interface UserFormProps {
  user: User;
  saving?: boolean;
  onSubmit: (input: { display_name: string; avatar_url?: string }) => Promise<void>;
}

export default function UserForm({ user, saving, onSubmit }: UserFormProps) {
  const { t } = useTranslation();
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
            setError(t('admin.common.nameRequired'));
            return;
          }
          void onSubmit({
            display_name: displayName.trim(),
            avatar_url: avatarUrl.trim() || undefined,
          }).catch((err: unknown) => {
            setError(
              err instanceof Error
                ? err.message
                : t('admin.users.updateFailed'),
            );
          });
        }}
      >
        <h3 className="text-lg font-semibold text-white">
          {t('admin.users.profileEdit')}
        </h3>
        <Input
          label={t('admin.users.displayName')}
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
        <Input
          label={t('admin.users.avatarUrl')}
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
          {saving ? t('admin.common.saving') : t('admin.users.saveProfile')}
        </Button>
      </form>
    </Card>
  );
}
