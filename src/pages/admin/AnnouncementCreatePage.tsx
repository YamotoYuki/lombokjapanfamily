import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminEditChrome } from '@/components/admin';
import { AnnouncementForm } from '@/components/announcements';
import { useCreateAnnouncement } from '@/hooks/useAnnouncements';
import type { AnnouncementInput } from '@/types/announcement';

export default function AnnouncementCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateAnnouncement();
  const [error, setError] = useState<string | null>(null);

  return (
    <AdminEditChrome
      eyebrow="Announcements"
      title="お知らせ新規作成"
      backTo="/admin/announcements"
      backLabel="お知らせ一覧へ戻る"
      error={error}
    >
      <AnnouncementForm
        dualSave
        saving={createMutation.isPending}
        onSubmit={async (input: AnnouncementInput, meta) => {
          setError(null);
          try {
            const result = await createMutation.mutateAsync(input);
            if (meta?.continueEditing && result.payload?.id) {
              navigate(`/admin/announcements/${result.payload.id}/edit`, {
                replace: true,
                state: {
                  message: result.message ?? 'お知らせを保存しました',
                },
              });
              return;
            }
            navigate('/admin/announcements', {
              replace: true,
              state: {
                message: result.message ?? 'お知らせを保存しました',
              },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : 'お知らせの保存に失敗しました',
            );
          }
        }}
      />
    </AdminEditChrome>
  );
}
