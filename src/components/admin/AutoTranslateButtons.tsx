import { Languages, LoaderCircle } from 'lucide-react';
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
  hint = '日本語を書いたあと、ワンクリックで英語／インドネシア語へ翻訳できます。機械翻訳のため公開前に必ず確認してください。',
}: AutoTranslateButtonsProps) {
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
          英語へ自動翻訳
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
          インドネシア語へ自動翻訳
        </Button>
      </div>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
