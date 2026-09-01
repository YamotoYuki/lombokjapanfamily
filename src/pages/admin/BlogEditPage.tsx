import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  AdminDangerZone,
  AdminEditChrome,
  AdminResourceNotFound,
} from '@/components/admin';
import BlogForm from '@/components/blog/BlogForm';
import { useAuth } from '@/contexts/AuthContext';
import { useArchivePost, usePost, useUpdatePost } from '@/hooks/usePosts';
import type { PostInput, PostStatus } from '@/types/post';

export default function BlogEditPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user } = useAuth();
  const postQuery = usePost(id);
  const updateMutation = useUpdatePost(session?.access_token, user?.id);
  const archiveMutation = useArchivePost(session?.access_token, user?.id);
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
        {t('admin.pages.blog.loading')}
      </p>
    );
  }

  if (postQuery.isError || !postQuery.data || (id && postQuery.data.id !== id)) {
    return (
      <AdminResourceNotFound
        resourceLabel={t('admin.pages.blog.resource')}
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
      eyebrow={t('admin.pages.blog.editEyebrow')}
      title={post.title || t('admin.common.untitled')}
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
        {t('admin.common.continueEditing')}
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
              setMessage(result.message ?? t('admin.pages.blog.saved'));
              await postQuery.refetch();
              return;
            }
            navigate('/admin/blog', {
              replace: true,
              state: {
                message: result.message ?? t('admin.pages.blog.saved'),
              },
            });
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : t('admin.pages.blog.saveFailed'),
            );
          }
        }}
      />
      <AdminDangerZone
        description={t('admin.pages.blog.deleteDesc')}
        buttonLabel={t('admin.pages.blog.deleteButton')}
        deleting={archiveMutation.isPending}
        onDelete={() => {
          if (!window.confirm(t('admin.pages.blog.deleteConfirm'))) return;
          setError(null);
          void archiveMutation
            .mutateAsync(post.id)
            .then((result) => {
              navigate('/admin/blog', {
                replace: true,
                state: {
                  message: result.message ?? t('admin.pages.blog.deleted'),
                },
              });
            })
            .catch((err) => {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.pages.blog.deleteFailed'),
              );
            });
        }}
      />
    </AdminEditChrome>
  );
}
