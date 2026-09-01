import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { GalleryCategoryManager } from '@/components/gallery';
import { backLinkClassName } from '@/components/ui';

export default function GalleryCategoryPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">
          Gallery Categories
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {t('admin.pages.gallery.categoriesTitle')}
        </h2>
        <p className="mt-2 text-sm text-muted">
          {t('admin.pages.gallery.categoriesDescription')}
        </p>
      </div>

      <GalleryCategoryManager />

      <div className="pt-2">
        <Link to="/admin/gallery" className={backLinkClassName}>
          <ArrowLeft size={16} aria-hidden />
          {t('admin.pages.gallery.back')}
        </Link>
      </div>
    </div>
  );
}
