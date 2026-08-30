import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { BlogFilters, BlogTable } from '@/components/blog';
import { Card, LinkButton, ViewModeToggle } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';
import { useArchivePost, usePosts } from '@/hooks/usePosts';
import { usePostCategories } from '@/hooks/usePostCategories';
import { useResponsiveViewMode } from '@/hooks/useResponsiveViewMode';
import type { Post, PostStatus } from '@/types/post';

export default function AdminBlogPage() {
  const { session, user } = useAuth();
  const [viewMode, setViewMode, { allowTable }] =
    useResponsiveViewMode('table');
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<PostStatus | ''>('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setMessage(result.message ?? '記事を削除しました');
    } catch (err) {
      setError(err instanceof Error ? err.message : '記事の保存に失敗しました');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Content</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Blog</h2>
          <p className="mt-2 text-sm text-muted">
            記事の作成・編集・公開・カテゴリー管理を行います。
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <LinkButton to="/admin/blog/categories" variant="ghost">
            カテゴリー管理
          </LinkButton>
          <LinkButton to="/admin/blog/new">
            <Plus size={16} />
            新規作成
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
          <h3 className="font-medium text-white">記事一覧</h3>
          <div className="flex flex-wrap items-center gap-3">
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              allowTable={allowTable}
            />
            <p className="text-xs text-muted">
              {postsQuery.isLoading
                ? '読み込み中...'
                : `${postsQuery.data?.total ?? 0}件`}
            </p>
          </div>
        </div>
        {postsQuery.isLoading ? (
          <div className="py-16 text-center text-sm text-muted">
            記事を読み込んでいます...
          </div>
        ) : (
          <BlogTable
            posts={postsQuery.data?.items ?? []}
            busyId={busyId}
            viewMode={viewMode}
            onDelete={(post) => void handleDelete(post)}
          />
        )}
      </Card>
    </div>
  );
}
