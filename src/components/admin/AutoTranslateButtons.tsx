import { Languages, LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui';

interface AutoTranslateButtonsProps {
  translating?: boolean;
  disabled?: boolean;
  onTranslate: (target: 'en' | 'id') => void | Promise<void>;
  hint?: string;
}

/** One-click JA → EN / ID draft translation for admin CMS forms. */
export default function AutoTranslateButtons({
  translating = false,
  disabled = false,
  onTranslate,
  hint,
}: AutoTranslateButtonsProps) {
  const { t } = useTranslation();
  const resolvedHint = hint ?? t('admin.common.translateHint');
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || translating}
          className="w-full sm:w-auto"
          onClick={() => void onTranslate('en')}
        >
          {translating ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Languages size={16} />
          )}
          {t('admin.common.translateToEn')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || translating}
          className="w-full sm:w-auto"
          onClick={() => void onTranslate('id')}
        >
          {translating ? (
            <LoaderCircle size={16} className="animate-spin" />
          ) : (
            <Languages size={16} />
          )}
          {t('admin.common.translateToId')}
        </Button>
      </div>
      {resolvedHint ? <p className="text-xs text-muted">{resolvedHint}</p> : null}
    </div>
  );
}
