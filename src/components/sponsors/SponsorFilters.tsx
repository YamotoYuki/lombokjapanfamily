import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import type { SponsorStatus, SponsorType } from '@/types/sponsor';

interface SponsorFiltersProps {
  keyword: string;
  status: SponsorStatus | '';
  projectType: SponsorType | '';
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: SponsorStatus | '') => void;
  onTypeChange: (value: SponsorType | '') => void;
}

const TYPE_KEYS: SponsorType[] = [
  'sponsor',
  'collaboration',
  'advertisement',
  'media',
  'other',
];

const STATUS_KEYS: SponsorStatus[] = [
  'proposal',
  'negotiating',
  'contracted',
  'production',
  'review',
  'published',
  'completed',
  'cancelled',
];

export default function SponsorFilters({
  keyword,
  status,
  projectType,
  onKeywordChange,
  onStatusChange,
  onTypeChange,
}: SponsorFiltersProps) {
  const { t } = useTranslation();
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-3">
      <Input
        label={t('admin.common.keyword')}
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder={t('admin.sponsors.keywordPlaceholder')}
      />
      <div className="space-y-2">
        <label className="text-sm text-muted">
          {t('admin.sponsors.projectType')}
        </label>
        <select
          value={projectType}
          onChange={(event) =>
            onTypeChange(event.target.value as SponsorType | '')
          }
          className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="">{t('admin.common.all')}</option>
          {TYPE_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`admin.sponsors.types.${key}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted">{t('admin.common.status')}</label>
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as SponsorStatus | '')
          }
          className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="">{t('admin.common.all')}</option>
          {STATUS_KEYS.map((key) => (
            <option key={key} value={key}>
              {t(`admin.sponsors.statuses.${key}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
