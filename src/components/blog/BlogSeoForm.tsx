import { Input, Textarea } from '@/components/ui';

interface BlogSeoFormProps {
  seoTitle: string;
  seoDescription: string;
  onSeoTitleChange: (value: string) => void;
  onSeoDescriptionChange: (value: string) => void;
}

export default function BlogSeoForm({
  seoTitle,
  seoDescription,
  onSeoTitleChange,
  onSeoDescriptionChange,
}: BlogSeoFormProps) {
  const remaining = 160 - seoDescription.length;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">SEO設定</h3>
        <p className="mt-1 text-xs text-muted">
          検索結果・OGP向けのタイトルと説明文を設定します。
        </p>
      </div>
      <Input
        label="SEOタイトル"
        value={seoTitle}
        onChange={(event) => onSeoTitleChange(event.target.value)}
        placeholder="検索結果に表示されるタイトル"
      />
      <div>
        <Textarea
          label="SEO説明文"
          value={seoDescription}
          onChange={(event) => onSeoDescriptionChange(event.target.value)}
          rows={3}
          placeholder="160文字以内推奨"
        />
        <p
          className={[
            'mt-1 text-xs',
            remaining < 0 ? 'text-youtube-red' : 'text-muted',
          ].join(' ')}
        >
          残り {remaining} 文字（推奨160文字以内）
        </p>
      </div>
    </div>
  );
}
