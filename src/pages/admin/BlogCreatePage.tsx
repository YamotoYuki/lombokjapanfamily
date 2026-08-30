import { useNavigate } from 'react-router-dom';
import { AdminEditChrome } from '@/components/admin';
import BlogForm from '@/components/blog/BlogForm';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost } from '@/hooks/usePosts';

export default function BlogCreatePage() {
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const createMutation = useCreatePost(session?.access_token, user?.id);

  return (
    <AdminEditChrome
      eyebrow="Blog"
      title="Blog新規作成"
      backTo="/admin/blog"
    >
      <BlogForm
        mode="create"
        accessToken={session?.access_token}
        submitting={createMutation.isPending}
        onSubmit={async (input) => {
          const result = await createMutation.mutateAsync(input);
          navigate('/admin/blog', {
            replace: true,
            state: { message: result.message ?? '記事を保存しました' },
          });
        }}
      />
    </AdminEditChrome>
  );
}
