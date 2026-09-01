import { useTranslation } from 'react-i18next';
import { Upload } from 'lucide-react';
import Card from '@/components/ui/Card';
import { LinkButton } from '@/components/ui';
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
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <SectionHeader
        title={t('admin.dashboard.galleryManage')}
        subtitle={
          typeof total === 'number'
            ? t('admin.dashboard.galleryCount', {
                total,
                featured: featuredCount ?? 0,
              })
            : t('admin.dashboard.visualAssets')
        }
        right={
          <LinkButton to="/admin/gallery" size="sm" variant="secondary">
            <Upload size={14} />
            {t('admin.dashboard.goManage')}
          </LinkButton>
        }
      />

      {isLoading ? (
        <p className="text-sm text-muted">{t('admin.common.loading')}</p>
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
                {item.title || t('admin.common.untitled')}
              </figcaption>
            </figure>
          ))}
          {items.length === 0 && (
            <p className="col-span-full text-sm text-muted">
              {t('admin.gallery.empty')}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
