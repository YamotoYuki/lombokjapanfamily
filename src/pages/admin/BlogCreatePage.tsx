import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AdminEditChrome } from '@/components/admin';
import BlogForm from '@/components/blog/BlogForm';
import { useAuth } from '@/contexts/AuthContext';
import { useCreatePost } from '@/hooks/usePosts';

export default function BlogCreatePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, user } = useAuth();
  const createMutation = useCreatePost(session?.access_token, user?.id);

  return (
    <AdminEditChrome
      eyebrow={t('admin.titles.blog')}
      title={t('admin.pages.blog.createEyebrow')}
      backTo="/admin/blog"
    >
      <BlogForm
        mode="create"
        embedded
        accessToken={session?.access_token}
        submitting={createMutation.isPending}
        onSubmit={async (input) => {
          const result = await createMutation.mutateAsync(input);
          navigate('/admin/blog', {
            replace: true,
            state: {
              message: result.message ?? t('admin.pages.blog.saved'),
            },
          });
        }}
      />
    </AdminEditChrome>
  );
}
