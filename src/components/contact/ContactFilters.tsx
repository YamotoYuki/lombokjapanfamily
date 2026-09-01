import { Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import type {
  ContactPriority,
  ContactStatus,
  ContactType,
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

const STATUSES: ContactStatus[] = [
  'new',
  'in_progress',
  'completed',
  'archived',
];
const TYPES: ContactType[] = [
  'general',
  'sponsor',
  'collaboration',
  'media',
  'other',
];
const PRIORITIES: ContactPriority[] = ['low', 'normal', 'high', 'urgent'];

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
  const { t } = useTranslation();

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
          placeholder={t('admin.contact.searchPlaceholder')}
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
        <option value="">{t('admin.contact.allStatuses')}</option>
        {STATUSES.map((key) => (
          <option key={key} value={key}>
            {t(`admin.contact.status.${key}`)}
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
        <option value="">{t('admin.contact.allTypes')}</option>
        {TYPES.map((key) => (
          <option key={key} value={key}>
            {t(`admin.contact.types.${key}`)}
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
        <option value="">{t('admin.contact.allPriorities')}</option>
        {PRIORITIES.map((key) => (
          <option key={key} value={key}>
            {t(`admin.contact.priorityLevel.${key}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
