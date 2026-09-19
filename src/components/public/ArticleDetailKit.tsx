import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Small pieces shared by the announcement and blog detail pages: the
 * accent line under the title, the hero image frame, the mount-time
 * staggered body reveal, and the back link. Kept deliberately tiny —
 * each page still owns its own masthead/meta layout since those differ
 * (separator, labels) by design.
 */

export function ArticleAccentLine() {
  return (
    <span
      aria-hidden
      className="animate-line-grow mt-6 block h-[2px] max-w-20 rounded-full bg-gold"
    />
  );
}

export function ArticleHeroImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="animate-image-reveal mt-10 aspect-video w-full overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/35 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

/**
 * Body paragraphs stagger in on a timed reveal, not a scroll-triggered
 * one: article body copy is the page's primary content, so it must never
 * depend on the reader actually scrolling far enough to fire an
 * IntersectionObserver (confirmed to fail silently for below-the-fold
 * content in some capture/render paths).
 */
export function ArticleParagraphs({ paragraphs }: { paragraphs: string[] }) {
  if (paragraphs.length === 0) return null;
  return (
    <div className="mx-auto mt-10 max-w-2xl space-y-5">
      {paragraphs.map((paragraph, index) => (
        <p
          key={index}
          style={{ animationDelay: `${0.6 + Math.min(index, 5) * 0.08}s` }}
          className="animate-fade-up whitespace-pre-wrap break-words text-base leading-8 text-white/85 sm:text-lg sm:leading-9"
        >
          {paragraph}
        </p>
      ))}
    </div>
  );
}

interface ArticleBackLinkProps {
  label: string;
  /** Plain navigation target — renders as a <Link>. */
  to?: string;
  /** Custom navigation (e.g. history-aware back) — renders as a <button>. */
  onClick?: () => void;
}

const backLinkClassName =
  'group touch-target inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50';

export function ArticleBackLink({ label, to, onClick }: ArticleBackLinkProps) {
  const icon = (
    <ArrowLeft
      size={16}
      aria-hidden
      className="transition-transform duration-300 group-hover:-translate-x-1"
    />
  );

  if (to) {
    return (
      <Link to={to} aria-label={label} className={backLinkClassName}>
        {icon}
        {label}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={backLinkClassName}
    >
      {icon}
      {label}
    </button>
  );
}
