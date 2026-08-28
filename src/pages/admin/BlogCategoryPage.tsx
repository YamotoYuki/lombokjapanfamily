import { Link } from 'react-router-dom';
import CategoryManager from '@/components/blog/CategoryManager';
import { useAuth } from '@/contexts/AuthContext';

export default function BlogCategoryPage() {
  const { session } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Blog</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            カテゴリー管理
          </h2>
        </div>
        <Link
          to="/admin/blog"
          className="text-sm text-muted transition-colors hover:text-gold"
        >
          ← 記事一覧へ
        </Link>
      </div>
      <CategoryManager accessToken={session?.access_token} />
    </div>
  );
}
