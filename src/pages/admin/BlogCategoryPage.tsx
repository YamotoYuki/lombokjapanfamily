import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import CategoryManager from '@/components/blog/CategoryManager';
import { backLinkClassName } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function BlogCategoryPage() {
  const { t } = useTranslation();
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">
          {t('admin.titles.blog')}
        </p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          {t('admin.common.categoryManage')}
        </h2>
      </div>
      <CategoryManager accessToken={session?.access_token} />
      <div className="pt-2">
        <Link to="/admin/blog" className={backLinkClassName}>
          <ArrowLeft size={16} aria-hidden />
          {t('admin.pages.blog.back')}
        </Link>
      </div>
    </div>
  );
}
