import { Link } from 'react-router-dom';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import GalleryGrid from '@/components/public/GalleryGrid';
import type { PublicGalleryItem } from '@/types/public';

interface GallerySectionProps {
  items: PublicGalleryItem[];
}

export default function GallerySection({ items }: GallerySectionProps) {
  return (
    <section
      id="gallery"
      className="border-y border-white/5 bg-[#0d1524] py-20 lg:py-28"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            eyebrow="Visuals"
            title="Photo Gallery"
            description="旅先の風景から日常のワンシーンまで"
            action={
              <Link
                to="/gallery"
                className="text-sm font-medium text-gold transition-colors hover:text-amber-300"
              >
                ギャラリーへ →
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
