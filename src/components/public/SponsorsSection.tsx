import type { PublicSponsor } from '@/types/public';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';

interface SponsorsSectionProps {
  items: PublicSponsor[];
}

export default function SponsorsSection({ items }: SponsorsSectionProps) {
  return (
    <section id="sponsors" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <FadeIn>
        <SectionHeading
          eyebrow="Partners"
          title="Partners & Sponsors"
          description="チャンネルを支えてくださるパートナー企業のみなさま"
        />
      </FadeIn>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((sponsor, index) => (
          <FadeIn key={sponsor.id} delayMs={index * 70}>
            <a
              href={sponsor.website}
              className="group flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold/35 hover:bg-white/[0.05]"
            >
              <div className="flex h-16 items-center justify-center rounded-2xl border border-dashed border-white/15 bg-gradient-to-br from-white/5 to-transparent">
                <span className="font-display text-xl font-semibold tracking-wide text-white/90 transition-colors group-hover:text-gold">
                  {sponsor.logoLabel}
                </span>
              </div>
              <div className="mt-5">
                <h3 className="text-base font-semibold text-white">
                  {sponsor.name}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  {sponsor.description}
                </p>
              </div>
            </a>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}
