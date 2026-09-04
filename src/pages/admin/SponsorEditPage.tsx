import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AdminDangerZone } from '@/components/admin';
import { SponsorForm } from '@/components/sponsors';
import { backLinkClassName } from '@/components/ui';
import {
  useDeleteSponsor,
  useSponsor,
  useUpdateSponsor,
  useUploadSponsorFile,
} from '@/hooks/useSponsors';
import type { SponsorInput } from '@/types/sponsor';

export default function SponsorEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const sponsorQuery = useSponsor(id);
  const updateMutation = useUpdateSponsor();
  const uploadMutation = useUploadSponsorFile();
  const deleteMutation = useDeleteSponsor();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (sponsorQuery.isLoading) {
    return (
      <p className="text-sm text-muted">{t('admin.pages.sponsors.loading')}</p>
    );
  }

  if (sponsorQuery.isError || !sponsorQuery.data) {
    return (
      <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
        {sponsorQuery.error instanceof Error
          ? sponsorQuery.error.message
          : t('admin.pages.sponsors.fetchFailed')}
      </div>
    );
  }

  const sponsor = sponsorQuery.data;

  const handleSubmit = async (input: SponsorInput) => {
    setError(null);
    setMessage(null);
    const result = await updateMutation.mutateAsync({
      id: sponsor.id,
      input,
    });
    setMessage(result.message ?? t('admin.pages.sponsors.updated'));
    navigate(`/admin/sponsors/${sponsor.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">
          Edit Deal
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {t('admin.pages.sponsors.editTitle')}
        </h2>
      </div>

      {(message || error) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error ?? message}
        </div>
      )}

      <SponsorForm
        initial={sponsor}
        saving={updateMutation.isPending}
        uploading={uploadMutation.isPending}
        submitLabel={t('admin.common.update')}
        onSubmit={handleSubmit}
        onUploadFile={async (file) => {
          const result = await uploadMutation.mutateAsync(file);
          return result.payload.url;
        }}
      />

      <AdminDangerZone
        description={t('admin.pages.sponsors.deleteDesc')}
        buttonLabel={t('admin.pages.sponsors.deleteButton')}
        deleting={deleteMutation.isPending}
        onDelete={() => {
          setError(null);
          void deleteMutation
            .mutateAsync(sponsor.id)
            .then((result) => {
              navigate('/admin/sponsors', {
                replace: true,
                state: {
                  message: result.message ?? t('admin.pages.sponsors.deleted'),
                },
              });
            })
            .catch((err) => {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.pages.sponsors.deleteFailed'),
              );
            });
        }}
      />

      <div className="pt-2">
        <Link
          to={`/admin/sponsors/${sponsor.id}`}
          className={backLinkClassName}
        >
          <ArrowLeft size={16} aria-hidden />
          {t('admin.common.backToDetail')}
        </Link>
      </div>
    </div>
  );
}
