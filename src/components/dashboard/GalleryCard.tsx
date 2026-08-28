import { Link } from 'react-router-dom';
import { Upload } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SectionHeader from '@/components/dashboard/SectionHeader';
import type { GalleryItem } from '@/types/gallery';

interface GalleryCardProps {
  items: GalleryItem[];
  total?: number;
  featuredCount?: number;
  isLoading?: boolean;
}

export default function GalleryCard({
  items,
  total,
  featuredCount,
  isLoading,
}: GalleryCardProps) {
  return (
    <Card className="h-full">
      <SectionHeader
        title="ギャラリー管理"
        subtitle={
          typeof total === 'number'
            ? `全${total}枚 / おすすめ${featuredCount ?? 0}枚`
            : 'ビジュアルアセット'
        }
        right={
          <Link to="/admin/gallery">
            <Button size="sm" variant="secondary">
              <Upload size={14} />
              管理へ
            </Button>
          </Link>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {items.slice(0, 6).map((item) => (
            <figure
              key={item.id}
              className="group relative overflow-hidden rounded-2xl border border-white/5"
            >
              <img
                src={item.thumbnail_url || item.image_url}
                alt={item.title || 'gallery'}
                className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-2 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                {item.title || '（無題）'}
              </figcaption>
            </figure>
          ))}
          {items.length === 0 && (
            <p className="col-span-full text-sm text-muted">
              写真はまだありません。
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
