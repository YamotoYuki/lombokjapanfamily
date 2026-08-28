import { Instagram, Youtube } from 'lucide-react';
import type { PublicFamilyMember } from '@/types/public';

interface FamilyCardProps {
  member: PublicFamilyMember;
}

function SocialIconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white/80 transition-colors hover:text-white"
      aria-label={label}
    >
      {children}
    </a>
  );
}

export default function FamilyCard({ member }: FamilyCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-gold/35 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <div className="relative aspect-[4/5] overflow-hidden">
        {member.photoUrl ? (
          <img
            src={member.photoUrl}
            alt={member.name}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white/5 text-sm text-muted">
            No Image
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-bg via-primary-bg/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            {member.role}
          </p>
          <h3 className="mt-1 font-display text-2xl font-semibold text-white">
            {member.name}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            {member.bio}
          </p>
          <div className="mt-4 flex gap-2">
            {member.instagram && (
              <SocialIconLink
                href={member.instagram}
                label={`${member.name} Instagram`}
              >
                <Instagram size={16} />
              </SocialIconLink>
            )}
            {member.youtube && (
              <SocialIconLink
                href={member.youtube}
                label={`${member.name} YouTube`}
              >
                <Youtube size={16} />
              </SocialIconLink>
            )}
            {member.tiktok && (
              <SocialIconLink href={member.tiktok} label={`${member.name} TikTok`}>
                <span className="text-[10px] font-semibold">TT</span>
              </SocialIconLink>
            )}
            {member.x && (
              <SocialIconLink href={member.x} label={`${member.name} X`}>
                <span className="text-[10px] font-semibold">X</span>
              </SocialIconLink>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
