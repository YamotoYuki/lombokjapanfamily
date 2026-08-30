import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminEditChrome, AdminResourceNotFound } from '@/components/admin';
import { FamilyForm } from '@/components/family';
import {
  useFamilyProfile,
  useUpdateFamilyProfile,
  useUploadFamilyPhoto,
} from '@/hooks/useFamilyProfiles';
import { familyDisplayName, type FamilyProfileInput } from '@/types/family';

export default function FamilyEditPage() {
  const { id } = useParams<{ id: string }>();
  const profileId = id?.trim() || '';
  const navigate = useNavigate();
  const location = useLocation();
  const detailQuery = useFamilyProfile(profileId || undefined);
  const updateMutation = useUpdateFamilyProfile();
  const uploadMutation = useUploadFamilyPhoto();
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
        プロフィールを読み込んでいます...
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
        resourceLabel="Familyプロフィール"
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
      setMessage(result.message ?? '家族プロフィールを保存しました');
      await detailQuery.refetch();
      return;
    }
    navigate('/admin/family', {
      replace: true,
      state: { message: result.message ?? '家族プロフィールを保存しました' },
    });
  };

  return (
    <AdminEditChrome
      key={profile.id}
      eyebrow="Family編集"
      title={familyDisplayName(profile)}
      subtitle={profile.role || undefined}
      backTo="/admin/family"
      backLabel="Family一覧へ戻る"
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
                : '家族プロフィールの保存に失敗しました',
            );
          }
        }}
        onUploadPhoto={async (file) => {
          const result = await uploadMutation.mutateAsync({
            id: profile.id,
            file,
          });
          setMessage(result.message ?? '画像をアップロードしました');
          return result.payload.url;
        }}
      />
    </AdminEditChrome>
  );
}
