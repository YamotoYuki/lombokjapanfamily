import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { AdminEditChrome, AdminResourceNotFound } from '@/components/admin';
import BlogForm from '@/components/blog/BlogForm';
import { useAuth } from '@/contexts/AuthContext';
import { usePost, useUpdatePost } from '@/hooks/usePosts';
import type { PostInput, PostStatus } from '@/types/post';

export default function BlogEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user } = useAuth();
  const postQuery = usePost(id);
  const updateMutation = useUpdatePost(session?.access_token, user?.id);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [continueEditing, setContinueEditing] = useState(false);

  useEffect(() => {
    const stateMessage = (location.state as { message?: string } | null)?.message;
    if (stateMessage) setMessage(stateMessage);
  }, [location.state]);

  if (postQuery.isLoading) {
    return (
      <p className="py-20 text-center text-sm text-muted">
        記事を読み込んでいます...
      </p>
    );
  }

  if (postQuery.isError || !postQuery.data || (id && postQuery.data.id !== id)) {
    return (
      <AdminResourceNotFound
        resourceLabel="記事"
        backTo="/admin/blog"
        detail={
          postQuery.error instanceof Error
            ? postQuery.error.message
            : undefined
        }
      />
    );
  }

  const post = postQuery.data;

  return (
    <AdminEditChrome
      eyebrow="Blog編集"
      title={post.title || '（無題）'}
      backTo="/admin/blog"
      message={message}
      error={error}
    >
      <label className="mb-4 flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={continueEditing}
          onChange={(event) => setContinueEditing(event.target.checked)}
          className="h-4 w-4 rounded border-white/20 bg-primary-bg"
        />
        保存後もこのページで編集を続ける
      </label>
      <BlogForm
        mode="edit"
        embedded
        initialPost={post}
        accessToken={session?.access_token}
        submitting={updateMutation.isPending}
        onSubmit={async (input: PostInput, intent: PostStatus) => {
          setError(null);
          setMessage(null);
          try {
            const result = await updateMutation.mutateAsync({
              id: post.id,
              input: { ...input, status: intent },
            });
            if (continueEditing) {
              setMessage(result.message ?? '記事を保存しました');
              await postQuery.refetch();
              return;
            }
            navigate('/admin/blog', {
              replace: true,
              state: { message: result.message ?? '記事を保存しました' },
            });
          } catch (err) {
            setError(
              err instanceof Error ? err.message : '記事の保存に失敗しました',
            );
          }
        }}
      />
    </AdminEditChrome>
  );
}
