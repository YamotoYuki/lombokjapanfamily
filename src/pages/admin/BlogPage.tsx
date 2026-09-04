import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { BlogFilters, BlogTable } from '@/components/blog';
import { Card, ConfirmDialog, LinkButton, ViewModeToggle } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useArchivePost, usePosts } from '@/hooks/usePosts';
import { usePostCategories } from '@/hooks/usePostCategories';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import type { Post, PostStatus } from '@/types/post';

export default function AdminBlogPage() {
  const { t } = useTranslation();
  const { session, user } = useAuth();
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('table');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<PostStatus | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      category: category || undefined,
      status: status || undefined,
      page: 1,
      limit: 50,
    }),
    [keyword, category, status],
  );

  const postsQuery = usePosts(params);
  const categoriesQuery = usePostCategories();
  const archiveMutation = useArchivePost(session?.access_token, user?.id);

  const handleDelete = async (post: Post) => {
    setBusyId(post.id);
    setError(null);
    setMessage(null);
    try {
      const result = await archiveMutation.mutateAsync(post.id);
      setMessage(result.message ?? t('admin.pages.blog.deleted'));
      setPendingDelete(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.pages.blog.deleteFailed'),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Content</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            {t('admin.titles.blog')}
          </h2>
          <p className="mt-2 text-sm text-muted">
            {t('admin.pages.blog.description')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to="/admin/blog/categories" variant="ghost">
            {t('admin.common.categoryManage')}
          </LinkButton>
          <LinkButton to="/admin/blog/new">
            <Plus size={16} />
            {t('admin.common.create')}
          </LinkButton>
        </div>
      </div>

      <BlogFilters
        keyword={keyword}
        category={category}
        status={status}
        categories={categoriesQuery.data ?? []}
        onKeywordChange={setKeyword}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
      />

      {(message || error || postsQuery.isError) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error || postsQuery.isError
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {error ||
            (postsQuery.error instanceof Error
              ? postsQuery.error.message
              : null) ||
            message}
        </div>
      )}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-medium text-white">
            {t('admin.pages.blog.listTitle')}
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              allowTable={allowTable}
            />
            <p className="text-xs text-muted">
              {postsQuery.isLoading
                ? t('admin.common.loading')
                : t('admin.common.count', {
                    count: postsQuery.data?.total ?? 0,
                  })}
            </p>
          </div>
        </div>
        {postsQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-muted">
            {t('admin.pages.blog.loading')}
          </div>
        ) : (
          <BlogTable
            posts={postsQuery.data?.items ?? []}
            busyId={busyId}
            viewMode={viewMode}
            onDelete={(post) => setPendingDelete(post)}
          />
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        detail={pendingDelete?.title_ja || pendingDelete?.title || undefined}
        confirming={Boolean(pendingDelete && busyId === pendingDelete.id)}
        onCancel={() => {
          if (!busyId) setPendingDelete(null);
        }}
        onConfirm={() => {
          if (pendingDelete) void handleDelete(pendingDelete);
        }}
      />
    </div>
  );
}
