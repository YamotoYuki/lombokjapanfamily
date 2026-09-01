import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminEditChrome } from '@/components/admin';
import { FamilyForm } from '@/components/family';
import {
  useCreateFamilyProfile,
  useUploadFamilyPhoto,
} from '@/hooks/useFamilyProfiles';
import type { FamilyProfileInput } from '@/types/family';

export default function FamilyCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createMutation = useCreateFamilyProfile();
  const uploadMutation = useUploadFamilyPhoto();
  const pendingPhotoRef = useRef<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (
    input: FamilyProfileInput,
    meta?: { continueEditing?: boolean },
  ) => {
    setError(null);
    const payload = {
      ...input,
      photo_url: input.photo_url?.startsWith('blob:')
        ? undefined
        : input.photo_url,
    };
    const result = await createMutation.mutateAsync(payload);
    const created = result.payload;
    if (pendingPhotoRef.current && created?.id) {
      await uploadMutation.mutateAsync({
        id: created.id,
        file: pendingPhotoRef.current,
      });
      pendingPhotoRef.current = null;
    }
    if (meta?.continueEditing && created?.id) {
      navigate(`/admin/family/${created.id}/edit`, {
        replace: true,
        state: {
          message: result.message ?? t('admin.pages.family.saved'),
        },
      });
      return;
    }
    navigate('/admin/family', {
      replace: true,
      state: {
        message: result.message ?? t('admin.pages.family.saved'),
      },
    });
  };

  return (
    <AdminEditChrome
      eyebrow={t('admin.titles.family')}
      title={t('admin.pages.family.createEyebrow')}
      backTo="/admin/family"
      backLabel={t('admin.pages.family.back')}
      error={error}
    >
      <FamilyForm
        dualSave
        saving={createMutation.isPending || uploadMutation.isPending}
        uploading={uploadMutation.isPending}
        onSubmit={async (input, meta) => {
          try {
            await handleSave(input, meta);
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : t('admin.pages.family.saveFailed'),
            );
          }
        }}
        onUploadPhoto={async (file) => {
          pendingPhotoRef.current = file;
          return URL.createObjectURL(file);
        }}
      />
    </AdminEditChrome>
  );
}
