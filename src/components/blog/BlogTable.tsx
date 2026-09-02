import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import BlogStatusBadge from '@/components/blog/BlogStatusBadge';
import { formatPostDate, type Post } from '@/types/post';
import type { ViewMode } from '@/hooks/useResponsiveViewMode';

interface BlogTableProps {
  posts: Post[];
  onDelete: (post: Post) => void;
  busyId?: string | null;
  viewMode?: ViewMode;
}

export default function BlogTable({
  posts,
  onDelete,
  busyId,
  viewMode = 'table',
}: BlogTableProps) {
  const { t } = useTranslation();

  if (posts.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 px-6 py-16 text-center text-sm text-muted">
        {t('admin.blog.empty')}
      </div>
    );
  }

  if (viewMode === 'card') {
    return (
      <div className="grid gap-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-sm font-semibold text-white">
                  {post.title}
                </h3>
                <p className="mt-1 truncate text-xs text-muted">/{post.slug}</p>
              </div>
              <BlogStatusBadge status={post.status} />
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted">
              <div>
                <dt className="whitespace-nowrap">{t('admin.common.category')}</dt>
                <dd className="mt-0.5 whitespace-nowrap text-white">
                  {post.category?.name ?? t('admin.common.unset')}
                </dd>
              </div>
              <div>
                <dt className="whitespace-nowrap">
                  {t('admin.common.publishedAt')}
                </dt>
                <dd className="mt-0.5 whitespace-nowrap text-white">
                  {formatPostDate(post.published_at ?? post.scheduled_at)}
                </dd>
              </div>
            </dl>
            <div className="mt-4 flex gap-2">
              <Link
                to={`/admin/blog/${post.id}/edit`}
                className="touch-target inline-flex min-w-[5.5rem] flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-3 text-sm text-muted hover:border-gold/40 hover:text-gold"
              >
                {t('admin.common.edit')}
              </Link>
              <button
                type="button"
                disabled={busyId === post.id || post.status === 'archived'}
                onClick={() => onDelete(post)}
                className="touch-target inline-flex min-w-[5.5rem] flex-1 items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-3 text-sm text-muted hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
              >
                {t('admin.common.deleteShort')}
              </button>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full min-w-[960px] table-fixed text-left text-sm">
        <colgroup>
          <col className="w-[34%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[12%]" />
          <col className="w-[8%]" />
          <col className="w-[10%]" />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.03] text-xs text-muted">
            <th className="px-4 py-3 font-medium whitespace-nowrap">
              {t('admin.blog.colTitle')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.blog.colCategory')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.status')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.publishedAt')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.blog.colUpdated')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.blog.colAuthor')}
            </th>
            <th className="px-3 py-3 font-medium whitespace-nowrap">
              {t('admin.common.actions')}
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr
              key={post.id}
              className="border-b border-white/5 transition-colors hover:bg-white/[0.03]"
            >
              <td className="px-4 py-3 align-middle">
                <p className="line-clamp-2 font-medium text-white">
                  {post.title}
                </p>
                <p className="mt-1 truncate text-xs text-muted">/{post.slug}</p>
              </td>
              <td className="px-3 py-3 align-middle">
                <span className="inline-flex whitespace-nowrap text-muted">
                  {post.category?.name ?? t('admin.common.unset')}
                </span>
              </td>
              <td className="px-3 py-3 align-middle">
                <BlogStatusBadge status={post.status} />
              </td>
              <td className="px-3 py-3 align-middle">
                <span className="inline-flex whitespace-nowrap text-muted">
                  {formatPostDate(post.published_at ?? post.scheduled_at)}
                </span>
              </td>
              <td className="px-3 py-3 align-middle">
                <span className="inline-flex whitespace-nowrap text-muted">
                  {formatPostDate(post.updated_at)}
                </span>
              </td>
              <td className="px-3 py-3 align-middle">
                <span className="inline-flex whitespace-nowrap text-muted">
                  {post.created_by
                    ? post.created_by.slice(0, 8)
                    : t('admin.common.dash')}
                </span>
              </td>
              <td className="px-3 py-3 align-middle">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/admin/blog/${post.id}/edit`}
                    className="inline-flex min-w-[4.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted transition-colors hover:border-gold/40 hover:text-gold"
                  >
                    {t('admin.common.edit')}
                  </Link>
                  <button
                    type="button"
                    disabled={busyId === post.id || post.status === 'archived'}
                    onClick={() => onDelete(post)}
                    className="inline-flex min-w-[4.5rem] items-center justify-center whitespace-nowrap rounded-xl border border-white/10 px-3 py-1.5 text-xs text-muted transition-colors hover:border-youtube-red/40 hover:text-white disabled:opacity-40"
                  >
                    {t('admin.common.deleteShort')}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
