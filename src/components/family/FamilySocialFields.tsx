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
  label: string;
  placeholder: string;
}[] = [
  {
    key: 'youtube_url',
    label: 'YouTube URL',
    placeholder: 'https://www.youtube.com/@channel',
  },
  {
    key: 'instagram_url',
    label: 'Instagram URL',
    placeholder: 'https://www.instagram.com/username',
  },
  {
    key: 'tiktok_url',
    label: 'TikTok URL',
    placeholder: 'https://www.tiktok.com/@username',
  },
  {
    key: 'x_url',
    label: 'X URL',
    placeholder: 'https://x.com/username',
  },
];

export default function FamilySocialFields({
  values,
  errors,
  onChange,
}: FamilySocialFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {FIELDS.map((field) => (
        <Input
          key={field.key}
          id={`family-${field.key}`}
          name={field.key}
          type="url"
          autoComplete="url"
          label={field.label}
          value={values[field.key] ?? ''}
          onChange={(event) => onChange(field.key, event.target.value)}
          placeholder={field.placeholder}
          error={errors?.[field.key]}
        />
      ))}
    </div>
  );
}
