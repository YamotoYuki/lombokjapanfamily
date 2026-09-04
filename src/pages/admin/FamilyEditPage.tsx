import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AdminDangerZone,
  AdminEditChrome,
  AdminResourceNotFound,
} from '@/components/admin';
import { FamilyForm } from '@/components/family';
import {
  useFamilyProfile,
  useHardDeleteFamilyProfile,
  useUpdateFamilyProfile,
  useUploadFamilyPhoto,
} from '@/hooks/useFamilyProfiles';
import { familyDisplayName, type FamilyProfileInput } from '@/types/family';

export default function FamilyEditPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const profileId = id?.trim() || '';
  const navigate = useNavigate();
  const location = useLocation();
  const detailQuery = useFamilyProfile(profileId || undefined);
  const updateMutation = useUpdateFamilyProfile();
  const uploadMutation = useUploadFamilyPhoto();
  const deleteMutation = useHardDeleteFamilyProfile();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessage(null);
    setError(null);
  }, [profileId]);

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) setMessage(stateMessage);
  }, [location.state]);

  if (!profileId || detailQuery.isLoading || detailQuery.isPending) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        {t('admin.pages.family.loading')}
      </p>
    );
  }

  if (
    detailQuery.isError ||
    !detailQuery.data ||
    detailQuery.data.id !== profileId
  ) {
    return (
      <AdminResourceNotFound
        resourceLabel={t('admin.pages.family.resource')}
        backTo="/admin/family"
        detail={
          detailQuery.error instanceof Error
            ? detailQuery.error.message
            : undefined
        }
      />
    );
  }

  const profile = detailQuery.data;

  const handleSave = async (
    input: FamilyProfileInput,
    meta?: { continueEditing?: boolean },
  ) => {
    setError(null);
    setMessage(null);
    const payload = {
      ...input,
      photo_url: input.photo_url?.startsWith('blob:')
        ? undefined
        : input.photo_url,
    };
    const result = await updateMutation.mutateAsync({
      id: profile.id,
      input: payload,
    });
    if (meta?.continueEditing) {
      setMessage(result.message ?? t('admin.pages.family.saved'));
      await detailQuery.refetch();
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
      key={profile.id}
      eyebrow={t('admin.pages.family.editEyebrow')}
      title={familyDisplayName(profile)}
      subtitle={profile.role || undefined}
      backTo="/admin/family"
      backLabel={t('admin.pages.family.back')}
      message={message}
      error={error}
    >
      <FamilyForm
        key={profile.id}
        dualSave
        initial={profile}
        saving={updateMutation.isPending || uploadMutation.isPending}
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
          const result = await uploadMutation.mutateAsync({
            id: profile.id,
            file,
          });
          setMessage(result.message ?? t('admin.pages.family.imageUploaded'));
          return result.payload.url;
        }}
      />
      <AdminDangerZone
        description={t('admin.pages.family.deleteDesc')}
        buttonLabel={t('admin.pages.family.deleteButton')}
        deleting={deleteMutation.isPending}
        onDelete={() => {
          setError(null);
          void deleteMutation
            .mutateAsync(profile.id)
            .then((result) => {
              navigate('/admin/family', {
                replace: true,
                state: {
                  message: result.message ?? t('admin.pages.family.deleted'),
                },
              });
            })
            .catch((err) => {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.pages.family.deleteFailed'),
              );
            });
        }}
      />
    </AdminEditChrome>
  );
}
