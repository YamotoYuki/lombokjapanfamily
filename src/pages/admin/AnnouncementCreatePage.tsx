import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminEditChrome } from '@/components/admin';
import { AnnouncementForm } from '@/components/announcements';
import { useCreateAnnouncement } from '@/hooks/useAnnouncements';
import type { AnnouncementInput } from '@/types/announcement';

export default function AnnouncementCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateAnnouncement();
  const [error, setError] = useState<string | null>(null);

  return (
    <AdminEditChrome
      eyebrow={t('admin.titles.announcements')}
      title={t('admin.pages.announcements.createEyebrow')}
      backTo="/admin/announcements"
      backLabel={t('admin.pages.announcements.back')}
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
                  message:
                    result.message ?? t('admin.pages.announcements.saved'),
                },
              });
              return;
            }
            navigate('/admin/announcements', {
              replace: true,
              state: {
                message:
                  result.message ?? t('admin.pages.announcements.saved'),
              },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : t('admin.pages.announcements.saveFailed'),
            );
          }
        }}
      />
    </AdminEditChrome>
  );
}
