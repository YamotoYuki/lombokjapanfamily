import { Input } from '@/components/ui';
import {
  SPONSOR_STATUS_LABEL,
  SPONSOR_TYPE_LABEL,
  type SponsorStatus,
  type SponsorType,
} from '@/types/sponsor';

interface SponsorFiltersProps {
  keyword: string;
  status: SponsorStatus | '';
  projectType: SponsorType | '';
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: SponsorStatus | '') => void;
  onTypeChange: (value: SponsorType | '') => void;
}

export default function SponsorFilters({
  keyword,
  status,
  projectType,
  onKeywordChange,
  onStatusChange,
  onTypeChange,
}: SponsorFiltersProps) {
  return (
    <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur md:grid-cols-3">
      <Input
        label="キーワード"
        value={keyword}
        onChange={(event) => onKeywordChange(event.target.value)}
        placeholder="会社名・案件名・担当者"
      />
      <div className="space-y-2">
        <label className="text-sm text-muted">案件種別</label>
        <select
          value={projectType}
          onChange={(event) =>
            onTypeChange(event.target.value as SponsorType | '')
          }
          className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="">すべて</option>
          {(Object.keys(SPONSOR_TYPE_LABEL) as SponsorType[]).map((key) => (
            <option key={key} value={key}>
              {SPONSOR_TYPE_LABEL[key]}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <label className="text-sm text-muted">状態</label>
        <select
          value={status}
          onChange={(event) =>
            onStatusChange(event.target.value as SponsorStatus | '')
          }
          className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
        >
          <option value="">すべて</option>
          {(Object.keys(SPONSOR_STATUS_LABEL) as SponsorStatus[]).map((key) => (
            <option key={key} value={key}>
              {SPONSOR_STATUS_LABEL[key]}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
