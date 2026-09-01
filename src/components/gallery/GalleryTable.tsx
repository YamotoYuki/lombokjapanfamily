import { useTranslation } from 'react-i18next';
import GalleryFeaturedBadge from '@/components/gallery/GalleryFeaturedBadge';
import GalleryVisibilityBadge from '@/components/gallery/GalleryVisibilityBadge';
import { Button } from '@/components/ui';
import type { GalleryItem } from '@/types/gallery';

interface GalleryTableProps {
  items: GalleryItem[];
  busyId?: string | null;
  onEdit: (item: GalleryItem) => void;
  onToggleVisibility: (item: GalleryItem) => void;
  onToggleFeatured: (item: GalleryItem) => void;
  onDelete?: (item: GalleryItem) => void;
}

export default function GalleryTable({
  items,
  busyId,
  onEdit,
  onToggleVisibility,
  onToggleFeatured,
  onDelete,
}: GalleryTableProps) {
  const { t } = useTranslation();

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
        {t('admin.gallery.empty')}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[1100px] text-left text-sm">
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium">{t('admin.gallery.image')}</th>
            <th className="px-4 py-3 font-medium">{t('admin.gallery.title')}</th>
            <th className="px-4 py-3 font-medium">
              {t('admin.gallery.category')}
            </th>
            <th className="px-4 py-3 font-medium">
              {t('admin.gallery.takenAt')}
            </th>
            <th className="px-4 py-3 font-medium">
              {t('admin.gallery.location')}
            </th>
            <th className="px-4 py-3 font-medium">
              {t('admin.common.featured')}
            </th>
            <th className="px-4 py-3 font-medium">{t('admin.gallery.state')}</th>
            <th className="px-4 py-3 font-medium">
              {t('admin.common.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-white/5">
              <td className="px-4 py-3">
                <img
                  src={item.thumbnail_url || item.image_url}
                  alt={item.title || 'gallery'}
                  className="h-14 w-20 rounded-xl object-cover"
                />
              </td>
              <td className="px-4 py-3 font-medium text-white">
                {item.title || t('admin.common.untitled')}
              </td>
              <td className="px-4 py-3 text-muted">
                {item.category?.name || t('admin.gallery.otherCategory')}
              </td>
              <td className="px-4 py-3 text-muted">{item.taken_at || '—'}</td>
              <td className="px-4 py-3 text-muted">{item.location || '—'}</td>
              <td className="px-4 py-3">
                <GalleryFeaturedBadge featured={item.is_featured} />
              </td>
              <td className="px-4 py-3">
                <GalleryVisibilityBadge visible={item.is_visible} />
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => onEdit(item)}
                  >
                    {t('admin.common.edit')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => onToggleFeatured(item)}
                  >
                    {item.is_featured
                      ? t('admin.gallery.unfeature')
                      : t('admin.common.featured')}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled={busyId === item.id}
                    onClick={() => onToggleVisibility(item)}
                  >
                    {item.is_visible
                      ? t('admin.common.hidden')
                      : t('admin.common.visible')}
                  </Button>
                  {onDelete ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={busyId === item.id}
                      onClick={() => onDelete(item)}
                    >
                      {t('admin.common.delete')}
                    </Button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
