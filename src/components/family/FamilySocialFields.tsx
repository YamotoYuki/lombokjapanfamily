import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import type { FamilySnsField } from '@/lib/familySns';

interface FamilySocialFieldsProps {
  values: {
    youtube_url?: string | null;
    instagram_url?: string | null;
    tiktok_url?: string | null;
    x_url?: string | null;
  };
  errors?: Partial<Record<FamilySnsField, string>>;
  onChange: (field: FamilySnsField, value: string) => void;
}

const FIELDS: {
  key: FamilySnsField;
  labelKey: string;
  placeholder: string;
}[] = [
  {
    key: 'youtube_url',
    labelKey: 'admin.family.sns.youtube',
    placeholder: 'https://www.youtube.com/@channel',
  },
  {
    key: 'instagram_url',
    labelKey: 'admin.family.sns.instagram',
    placeholder: 'https://www.instagram.com/username',
  },
  {
    key: 'tiktok_url',
    labelKey: 'admin.family.sns.tiktok',
    placeholder: 'https://www.tiktok.com/@username',
  },
  {
    key: 'x_url',
    labelKey: 'admin.family.sns.x',
    placeholder: 'https://x.com/username',
  },
];

export default function FamilySocialFields({
  values,
  errors,
  onChange,
}: FamilySocialFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <Input
          key={field.key}
          id={`family-${field.key}`}
          name={field.key}
          type="url"
          autoComplete="url"
          label={t(field.labelKey)}
          value={values[field.key] ?? ''}
          onChange={(event) => onChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          error={errors?.[field.key]}
        />
      ))}
    </div>
  );
}
