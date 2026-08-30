import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CategoryManager from '@/components/blog/CategoryManager';
import { backLinkClassName } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

export default function BlogCategoryPage() {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Blog</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">
          カテゴリー管理
        </h2>
      </div>
      <CategoryManager accessToken={session?.access_token} />
      <div className="pt-2">
        <Link to="/admin/blog" className={backLinkClassName}>
          <ArrowLeft size={16} aria-hidden />
          記事一覧へ戻る
        </Link>
      </div>
    </div>
  );
}
