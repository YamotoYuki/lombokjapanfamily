import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
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
            action={
              <Link
                to="/gallery"
                className="text-sm font-medium text-gold transition-colors hover:text-amber-300"
              >
                {t('gallery.viewAll')}
              </Link>
            }
          />
        </FadeIn>
        <FadeIn delayMs={120}>
          <GalleryGrid items={items} />
        </FadeIn>
      </div>
    </section>
  );
}
