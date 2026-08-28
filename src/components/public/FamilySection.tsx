import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import FamilyCard from '@/components/public/FamilyCard';
import type { PublicFamilyMember } from '@/types/public';

interface FamilySectionProps {
  members: PublicFamilyMember[];
}

export default function FamilySection({ members }: FamilySectionProps) {
  return (
    <section
      id="family"
      className="relative overflow-hidden border-y border-white/5 bg-[#0d1524] py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-youtube-red/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn>
          <SectionHeading
            eyebrow="Family"
            title="Meet Our Family"
            description="画面の向こうで旅と日常を紡ぐ、私たちのファミリー"
          />
        </FadeIn>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {members.map((member, index) => (
            <FadeIn key={member.id} delayMs={index * 90}>
              <FamilyCard member={member} />
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
