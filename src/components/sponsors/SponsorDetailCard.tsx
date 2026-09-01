import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SponsorStatusBadge from '@/components/sponsors/SponsorStatusBadge';
import { Card } from '@/components/ui';
import { formatSponsorAmount, type Sponsor } from '@/types/sponsor';

interface SponsorDetailCardProps {
  sponsor: Sponsor;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-b border-white/5 py-3 sm:grid-cols-[160px_1fr]">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-sm text-white">{value}</dd>
    </div>
  );
}

export default function SponsorDetailCard({ sponsor }: SponsorDetailCardProps) {
  const { t } = useTranslation();
  const dash = t('admin.common.dash');
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            {t(`admin.sponsors.types.${sponsor.project_type}`)}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            {sponsor.project_name}
          </h3>
          <p className="mt-1 text-sm text-muted">{sponsor.company_name}</p>
        </div>
        <SponsorStatusBadge status={sponsor.status} />
      </div>

      <dl>
        <Row
          label={t('admin.common.assignee')}
          value={sponsor.contact_person || dash}
        />
        <Row
          label={t('admin.common.email')}
          value={sponsor.contact_email || dash}
        />
        <Row
          label={t('admin.common.phone')}
          value={sponsor.contact_phone || dash}
        />
        <Row
          label={t('admin.common.amount')}
          value={
            <span className="font-semibold text-gold">
              {formatSponsorAmount(sponsor.amount)}
            </span>
          }
        />
        <Row
          label={t('admin.common.contractDate')}
          value={sponsor.contract_date || dash}
        />
        <Row
          label={t('admin.common.startDate')}
          value={sponsor.start_date || dash}
        />
        <Row
          label={t('admin.common.deadline')}
          value={sponsor.due_date || dash}
        />
        <Row
          label={t('admin.sponsors.publishDate')}
          value={sponsor.publish_date || dash}
        />
        <Row
          label={t('admin.settings.youtubeUrl')}
          value={
            sponsor.youtube_url ? (
              <a
                href={sponsor.youtube_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-gold hover:underline"
              >
                {t('admin.common.openVideo')}
                <ExternalLink size={14} />
              </a>
            ) : (
              dash
            )
          }
        />
        <Row
          label={t('admin.common.attachment')}
          value={
            sponsor.attachment_url ? (
              <a
                href={sponsor.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-gold hover:underline"
              >
                {t('admin.common.openFile')}
                <ExternalLink size={14} />
              </a>
            ) : (
              dash
            )
          }
        />
        <Row
          label={t('admin.common.memo')}
          value={
            sponsor.notes ? (
              <p className="whitespace-pre-wrap leading-relaxed">
                {sponsor.notes}
              </p>
            ) : (
              dash
            )
          }
        />
        <Row
          label={t('admin.common.createdAt')}
          value={sponsor.created_at?.slice(0, 10) || dash}
        />
        <Row
          label={t('admin.common.updatedAt')}
          value={sponsor.updated_at?.slice(0, 10) || dash}
        />
      </dl>
    </Card>
  );
}
