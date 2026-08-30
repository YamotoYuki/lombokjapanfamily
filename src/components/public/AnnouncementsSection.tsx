import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AnnouncementCard from '@/components/public/AnnouncementCard';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import type { Announcement } from '@/types/announcement';

interface AnnouncementsSectionProps {
  items: Announcement[];
  showHeading?: boolean;
  showMoreLink?: boolean;
}

export default function AnnouncementsSection({
  items,
  showHeading = true,
  showMoreLink = true,
}: AnnouncementsSectionProps) {
  const { t } = useTranslation();

  if (items.length === 0) return null;

  return (
    <section
      id="announcements"
      className="relative overflow-hidden border-y border-white/5 bg-[#0d1524] py-16 sm:py-20 lg:py-24"
    >
      <div className="pointer-events-none absolute -left-16 top-8 h-56 w-56 rounded-full bg-youtube-red/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {showHeading ? (
          <FadeIn>
            <SectionHeading
              eyebrow={t('announcements.eyebrow')}
              title={t('announcements.title')}
              description={t('announcements.description')}
              action={
                showMoreLink ? (
                  <Link
                    to="/announcements"
                    className="text-sm font-medium text-gold transition-colors hover:text-amber-300"
                  >
                    {t('announcements.viewMore')}
                  </Link>
                ) : null
              }
            />
          </FadeIn>
        ) : null}
        <div className="mt-8 space-y-4 sm:mt-10">
          {items.map((item, index) => (
            <FadeIn key={item.id} delayMs={index * 70}>
              <AnnouncementCard item={item} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
