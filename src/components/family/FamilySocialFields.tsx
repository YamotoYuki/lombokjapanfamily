import { Input } from '@/components/ui';

interface FamilySocialFieldsProps {
  values: {
    instagram_url?: string;
    tiktok_url?: string;
    youtube_url?: string;
    x_url?: string;
  };
  onChange: (field: string, value: string) => void;
}

export default function FamilySocialFields({
  values,
  onChange,
}: FamilySocialFieldsProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Input
        label="Instagram URL"
        value={values.instagram_url ?? ''}
        onChange={(event) => onChange('instagram_url', event.target.value)}
        placeholder="https://instagram.com/..."
      />
      <Input
        label="TikTok URL"
        value={values.tiktok_url ?? ''}
        onChange={(event) => onChange('tiktok_url', event.target.value)}
        placeholder="https://tiktok.com/@..."
      />
      <Input
        label="YouTube URL"
        value={values.youtube_url ?? ''}
        onChange={(event) => onChange('youtube_url', event.target.value)}
        placeholder="https://youtube.com/@..."
      />
      <Input
        label="X URL"
        value={values.x_url ?? ''}
        onChange={(event) => onChange('x_url', event.target.value)}
        placeholder="https://x.com/..."
      />
    </div>
  );
}
