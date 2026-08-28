import { ExternalLink } from 'lucide-react';
import SponsorStatusBadge from '@/components/sponsors/SponsorStatusBadge';
import { Card } from '@/components/ui';
import {
  SPONSOR_TYPE_LABEL,
  formatSponsorAmount,
  type Sponsor,
} from '@/types/sponsor';

interface SponsorDetailCardProps {
  sponsor: Sponsor;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-white/5 py-3 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm text-white">{value || '—'}</dd>
    </div>
  );
}

export default function SponsorDetailCard({ sponsor }: SponsorDetailCardProps) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            {SPONSOR_TYPE_LABEL[sponsor.project_type]}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {sponsor.project_name}
          </h3>
          <p className="mt-1 text-sm text-muted">{sponsor.company_name}</p>
        </div>
        <SponsorStatusBadge status={sponsor.status} />
      </div>

      <dl>
        <Row label="担当者" value={sponsor.contact_person} />
        <Row label="メール" value={sponsor.contact_email} />
        <Row label="電話番号" value={sponsor.contact_phone} />
        <Row
          label="金額"
          value={
            <span className="font-semibold text-gold">
              {formatSponsorAmount(sponsor.amount)}
            </span>
          }
        />
        <Row label="契約日" value={sponsor.contract_date} />
        <Row label="開始日" value={sponsor.start_date} />
        <Row label="締切" value={sponsor.due_date} />
        <Row label="公開日" value={sponsor.publish_date} />
        <Row
          label="YouTube URL"
          value={
            sponsor.youtube_url ? (
              <a
                href={sponsor.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-gold hover:underline"
              >
                動画を開く
                <ExternalLink size={14} />
              </a>
            ) : (
              '—'
            )
          }
        />
        <Row
          label="添付ファイル"
          value={
            sponsor.attachment_url ? (
              <a
                href={sponsor.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-gold hover:underline"
              >
                ファイルを開く
                <ExternalLink size={14} />
              </a>
            ) : (
              '—'
            )
          }
        />
        <Row
          label="メモ"
          value={
            sponsor.notes ? (
              <p className="whitespace-pre-wrap leading-relaxed">
                {sponsor.notes}
              </p>
            ) : (
              '—'
            )
          }
        />
        <Row label="作成日" value={sponsor.created_at?.slice(0, 10)} />
        <Row label="更新日" value={sponsor.updated_at?.slice(0, 10)} />
      </dl>
    </Card>
  );
}
