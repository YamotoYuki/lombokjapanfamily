import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import SectionViewAllLink from '@/components/public/SectionViewAllLink';
import GalleryGrid from '@/components/public/GalleryGrid';
import type { PublicGalleryItem } from '@/types/public';

interface GallerySectionProps {
  items: PublicGalleryItem[];
}

export default function GallerySection({ items }: GallerySectionProps) {
  const { t } = useTranslation();

  return (
    <section
      id="gallery"
      className="border-y border-white/5 bg-[#0d1524] py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            eyebrow={t('gallery.sectionEyebrow')}
            title={t('gallery.sectionTitle')}
            description={t('gallery.sectionDescription')}
          />
        </FadeIn>
        <FadeIn delayMs={120}>
          <GalleryGrid items={items} />
        </FadeIn>
        {items.length > 0 ? (
          <FadeIn delayMs={160}>
            <div className="mt-10 flex justify-center sm:mt-12">
              <SectionViewAllLink to="/gallery" label={t('gallery.viewAll')} />
            </div>
          </FadeIn>
        ) : null}
      </div>
    </section>
  );
}
