import { ArrowUpRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatPostDate, type Post } from '@/types/post';

interface PublicBlogCardProps {
  post: Post;
}

export default function PublicBlogCard({ post }: PublicBlogCardProps) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition-all duration-500 hover:-translate-y-1 hover:border-gold/30 hover:shadow-[0_24px_60px_rgba(0,0,0,0.4)]">
      <Link to={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-surface">
          {post.featured_image ? (
            <img
              src={post.featured_image}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No Image
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          {post.category && (
            <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-gold backdrop-blur">
              {post.category.name}
            </span>
          )}
        </div>
        <div className="space-y-3 p-5">
          <p className="text-xs text-muted">
            {formatPostDate(post.published_at)}
          </p>
          <h3 className="font-display text-xl font-semibold text-white transition-colors group-hover:text-gold">
            {post.title}
          </h3>
          <p className="line-clamp-2 text-sm leading-relaxed text-muted">
            {post.excerpt || post.content.slice(0, 120)}
          </p>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-white/80">
            続きを読む
            <ArrowUpRight size={14} />
          </span>
        </div>
      </Link>
    </article>
  );
}
