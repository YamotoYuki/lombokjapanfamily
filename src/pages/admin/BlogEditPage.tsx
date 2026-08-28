import { useNavigate, useParams } from 'react-router-dom';
import BlogForm from '@/components/blog/BlogForm';
import { useAuth } from '@/contexts/AuthContext';
import { usePost, useUpdatePost } from '@/hooks/usePosts';

export default function BlogEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const postQuery = usePost(id);
  const updateMutation = useUpdatePost(session?.access_token, user?.id);

  if (postQuery.isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted">
        記事を読み込んでいます...
      </div>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
        {postQuery.error instanceof Error
          ? postQuery.error.message
          : '記事取得に失敗しました'}
      </div>
    );
  }

  return (
    <BlogForm
      mode="edit"
      initialPost={postQuery.data}
      accessToken={session?.access_token}
      submitting={updateMutation.isPending}
      onSubmit={async (input) => {
        const result = await updateMutation.mutateAsync({
          id: postQuery.data.id,
          input,
        });
        navigate('/admin/blog', {
          replace: true,
          state: { message: result.message ?? '記事を保存しました' },
        });
      }}
    />
  );
}
