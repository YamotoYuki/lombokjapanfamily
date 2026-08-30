import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SponsorForm } from '@/components/sponsors';
import { backLinkClassName } from '@/components/ui';
import {
  useCreateSponsor,
  useUploadSponsorFile,
} from '@/hooks/useSponsors';
import type { SponsorInput } from '@/types/sponsor';

export default function SponsorCreatePage() {
  const navigate = useNavigate();
  const createMutation = useCreateSponsor();
  const uploadMutation = useUploadSponsorFile();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (input: SponsorInput) => {
    setError(null);
    setMessage(null);
    const result = await createMutation.mutateAsync(input);
    setMessage(result.message ?? '案件を保存しました');
    navigate(`/admin/sponsors/${result.payload.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">New Deal</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">案件登録</h2>
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
        saving={createMutation.isPending}
        uploading={uploadMutation.isPending}
        submitLabel="登録する"
        onSubmit={handleSubmit}
        onUploadFile={async (file) => {
          const result = await uploadMutation.mutateAsync(file);
          return result.payload.url;
        }}
      />

      <div className="pt-2">
        <Link to="/admin/sponsors" className={backLinkClassName}>
          <ArrowLeft size={16} aria-hidden />
          一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
