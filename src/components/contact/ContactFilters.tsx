import { Search } from 'lucide-react';
import { Input } from '@/components/ui';
import type {
  ContactPriority,
  ContactStatus,
  ContactType,
} from '@/types/contact';
import {
  CONTACT_PRIORITY_LABEL,
  CONTACT_STATUS_LABEL,
  CONTACT_TYPE_LABEL,
} from '@/types/contact';

interface ContactFiltersProps {
  keyword: string;
  status: ContactStatus | '';
  contactType: ContactType | '';
  priority: ContactPriority | '';
  onKeywordChange: (value: string) => void;
  onStatusChange: (value: ContactStatus | '') => void;
  onTypeChange: (value: ContactType | '') => void;
  onPriorityChange: (value: ContactPriority | '') => void;
}

export default function ContactFilters({
  keyword,
  status,
  contactType,
  priority,
  onKeywordChange,
  onStatusChange,
  onTypeChange,
  onPriorityChange,
}: ContactFiltersProps) {
  return (
    <div className="glass flex flex-col gap-3 rounded-2xl p-3 sm:p-4 lg:flex-row lg:items-center">
      <div className="relative min-w-0 flex-1">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <Input
          value={keyword}
          onChange={(event) => onKeywordChange(event.target.value)}
          placeholder="会社名・担当者・件名で検索..."
          className="!pl-9"
        />
      </div>
      <select
        value={status}
        onChange={(event) =>
          onStatusChange(event.target.value as ContactStatus | '')
        }
        className="rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
      >
        <option value="">すべての状態</option>
        {(Object.keys(CONTACT_STATUS_LABEL) as ContactStatus[]).map((key) => (
          <option key={key} value={key}>
            {CONTACT_STATUS_LABEL[key]}
          </option>
        ))}
      </select>
      <select
        value={contactType}
        onChange={(event) =>
          onTypeChange(event.target.value as ContactType | '')
        }
        className="rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
      >
        <option value="">すべての種別</option>
        {(Object.keys(CONTACT_TYPE_LABEL) as ContactType[]).map((key) => (
          <option key={key} value={key}>
            {CONTACT_TYPE_LABEL[key]}
          </option>
        ))}
      </select>
      <select
        value={priority}
        onChange={(event) =>
          onPriorityChange(event.target.value as ContactPriority | '')
        }
        className="rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
      >
        <option value="">すべての優先度</option>
        {(Object.keys(CONTACT_PRIORITY_LABEL) as ContactPriority[]).map(
          (key) => (
            <option key={key} value={key}>
              {CONTACT_PRIORITY_LABEL[key]}
            </option>
          ),
        )}
      </select>
    </div>
  );
}
