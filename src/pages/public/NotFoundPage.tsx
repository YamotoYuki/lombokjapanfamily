import { useTranslation } from 'react-i18next';
import { LinkButton } from '@/components/ui';

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-white">
        {t('notFound.title')}
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        {t('notFound.description')}
      </p>
      <LinkButton to="/" className="mt-8">
        {t('notFound.backHome')}
      </LinkButton>
    </div>
  );
}
