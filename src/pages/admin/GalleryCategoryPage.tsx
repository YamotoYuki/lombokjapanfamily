import { Link } from 'react-router-dom';
import { GalleryCategoryManager } from '@/components/gallery';

export default function GalleryCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Gallery Categories
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            ギャラリーカテゴリー
          </h2>
          <p className="mt-2 text-sm text-muted">
            旅行・日常・イベントなど、写真の分類を管理します。
          </p>
        </div>
        <Link
          to="/admin/gallery"
          className="text-sm text-muted transition-colors hover:text-gold"
        >
          ← ギャラリーへ戻る
        </Link>
      </div>

      <GalleryCategoryManager />
    </div>
  );
}
