import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SponsorDetailCard } from '@/components/sponsors';
import { Button, Card, LinkButton, backLinkClassName } from '@/components/ui';
import {
  useDeleteSponsor,
  useSponsor,
  useUpdateSponsor,
} from '@/hooks/useSponsors';
import type { SponsorStatus } from '@/types/sponsor';
import { SPONSOR_STATUS_LABEL } from '@/types/sponsor';

export default function SponsorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const sponsorQuery = useSponsor(id);
  const updateMutation = useUpdateSponsor();
  const deleteMutation = useDeleteSponsor();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (sponsorQuery.isLoading) {
    return <p className="text-sm text-muted">案件詳細を読み込んでいます...</p>;
  }

  if (sponsorQuery.isError || !sponsorQuery.data) {
    return (
      <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
        {sponsorQuery.error instanceof Error
          ? sponsorQuery.error.message
          : '案件の取得に失敗しました'}
      </div>
    );
  }

  const sponsor = sponsorQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Deal Detail
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">案件詳細</h2>
        </div>
        <LinkButton to={`/admin/sponsors/${sponsor.id}/edit`}>編集</LinkButton>
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

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <SponsorDetailCard sponsor={sponsor} />

        <Card className="h-fit space-y-4">
          <h3 className="text-sm font-semibold text-white">進捗管理</h3>
          <div className="space-y-2">
            <label className="text-sm text-muted">状態</label>
            <select
              value={sponsor.status}
              onChange={async (event) => {
                setError(null);
                setMessage(null);
                try {
                  const result = await updateMutation.mutateAsync({
                    id: sponsor.id,
                    input: { status: event.target.value as SponsorStatus },
                  });
                  setMessage(result.message ?? '案件を更新しました');
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : '通信エラーが発生しました',
                  );
                }
              }}
              className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
            >
              {(Object.keys(SPONSOR_STATUS_LABEL) as SponsorStatus[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {SPONSOR_STATUS_LABEL[key]}
                  </option>
                ),
              )}
            </select>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              setError(null);
              try {
                const result = await deleteMutation.mutateAsync(sponsor.id);
                setMessage(result.message ?? '案件を削除しました');
                navigate('/admin/sponsors');
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : '通信エラーが発生しました',
                );
              }
            }}
          >
            案件を削除（非表示）
          </Button>
          <p className="text-xs text-muted">
            将来拡張: 請求・契約・決済・リマインド連携
          </p>
        </Card>
      </div>

      <div className="pt-2">
        <Link to="/admin/sponsors" className={backLinkClassName}>
          <ArrowLeft size={16} aria-hidden />
          一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
