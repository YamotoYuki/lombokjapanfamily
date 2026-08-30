import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { GalleryCategoryManager } from '@/components/gallery';
import { backLinkClassName } from '@/components/ui';

export default function GalleryCategoryPage() {
  return (
    <div className="space-y-6">
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

      <GalleryCategoryManager />

      <div className="pt-2">
        <Link to="/admin/gallery" className={backLinkClassName}>
          <ArrowLeft size={16} aria-hidden />
          ギャラリーへ戻る
        </Link>
      </div>
    </div>
  );
}
