import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const remaining = 160 - seoDescription.length;

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h3 className="text-sm font-semibold text-white">
          {t('admin.blog.seo')}
        </h3>
        <p className="mt-1 text-xs text-muted">{t('admin.blog.seoHelp')}</p>
      </div>
      <Input
        label={t('admin.blog.seoTitle')}
        value={seoTitle}
        onChange={(event) => onSeoTitleChange(event.target.value)}
        placeholder={t('admin.blog.seoTitlePlaceholder')}
      />
      <div>
        <Textarea
          label={t('admin.common.seoDescription')}
          value={seoDescription}
          onChange={(event) => onSeoDescriptionChange(event.target.value)}
          rows={3}
          placeholder={t('admin.blog.seoDescPlaceholder')}
        />
        <p
          className={[
            'mt-1 text-xs',
            remaining < 0 ? 'text-youtube-red' : 'text-muted',
          ].join(' ')}
        >
          {t('admin.blog.seoCharsRemaining', { count: remaining })}
        </p>
      </div>
    </div>
  );
}
