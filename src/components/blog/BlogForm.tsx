import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BlogEditor,
  BlogImageUploader,
  BlogSeoForm,
  CategorySelector,
  TagInput,
} from '@/components/blog';
import { Button, Card, Input } from '@/components/ui';
import { usePostCategories } from '@/hooks/usePostCategories';
import { usePostTags } from '@/hooks/usePostTags';
import {
  generatePostSlug,
  type Post,
  type PostInput,
  type PostStatus,
} from '@/types/post';

interface BlogFormProps {
  mode: 'create' | 'edit';
  initialPost?: Post;
  accessToken?: string | null;
  submitting?: boolean;
  onSubmit: (input: PostInput, intent: PostStatus) => Promise<void>;
}

function toLocalInputValue(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function BlogForm({
  mode,
  initialPost,
  accessToken,
  submitting = false,
  onSubmit,
}: BlogFormProps) {
  const categoriesQuery = usePostCategories();
  const tagsQuery = usePostTags();

  const [title, setTitle] = useState(initialPost?.title ?? '');
  const [slug, setSlug] = useState(initialPost?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost?.slug));
  const [content, setContent] = useState(initialPost?.content ?? '');
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? '');
  const [featuredImage, setFeaturedImage] = useState(
    initialPost?.featured_image ?? '',
  );
  const [categoryId, setCategoryId] = useState(initialPost?.category_id ?? '');
  const [tags, setTags] = useState<string[]>(
    initialPost?.tags?.map((tag) => tag.name) ?? [],
  );
  const [seoTitle, setSeoTitle] = useState(initialPost?.seo_title ?? '');
  const [seoDescription, setSeoDescription] = useState(
    initialPost?.seo_description ?? '',
  );
  const [scheduledAt, setScheduledAt] = useState(
    toLocalInputValue(initialPost?.scheduled_at),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!initialPost) return;
    setTitle(initialPost.title);
    setSlug(initialPost.slug);
    setContent(initialPost.content);
    setExcerpt(initialPost.excerpt ?? '');
    setFeaturedImage(initialPost.featured_image ?? '');
    setCategoryId(initialPost.category_id ?? '');
    setTags(initialPost.tags?.map((tag) => tag.name) ?? []);
    setSeoTitle(initialPost.seo_title ?? '');
    setSeoDescription(initialPost.seo_description ?? '');
    setScheduledAt(toLocalInputValue(initialPost.scheduled_at));
    setSlugTouched(true);
  }, [initialPost]);

  const categories = categoriesQuery.data ?? [];
  const suggestions = tagsQuery.data ?? [];

  const buildInput = (intent: PostStatus): PostInput | null => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = '記事タイトルは必須です';
    if (!slug.trim()) nextErrors.slug = 'slugは必須です';
    if (!content.trim()) nextErrors.content = '本文は必須です';
    if (intent === 'scheduled' && !scheduledAt) {
      nextErrors.scheduled_at = '公開予約には予約日時が必要です';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return null;

    return {
      title: title.trim(),
      slug: slug.trim(),
      content,
      excerpt: excerpt.trim() || undefined,
      featured_image: featuredImage || undefined,
      category_id: categoryId || null,
      status: intent,
      seo_title: seoTitle.trim() || undefined,
      seo_description: seoDescription.trim() || undefined,
      scheduled_at:
        intent === 'scheduled'
          ? new Date(scheduledAt).toISOString()
          : null,
      published_at: intent === 'published' ? new Date().toISOString() : null,
      tags,
    };
  };

  const handleSubmit = async (intent: PostStatus) => {
    setFormError(null);
    setFormMessage(null);
    const input = buildInput(intent);
    if (!input) return;
    try {
      await onSubmit(input, intent);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : '記事の保存に失敗しました',
      );
    }
  };

  const heading = useMemo(
    () => (mode === 'create' ? '記事作成' : '記事編集'),
    [mode],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Blog CMS</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{heading}</h2>
        </div>
        <Link
          to="/admin/blog"
          className="text-sm text-muted transition-colors hover:text-gold"
        >
          ← 一覧へ戻る
        </Link>
      </div>

      {(formError || formMessage) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            formError
              ? 'border-youtube-red/40 bg-youtube-red/10 text-red-200'
              : 'border-success/30 bg-success/10 text-success',
          ].join(' ')}
        >
          {formError ?? formMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
        <Card className="space-y-4">
          <Input
            label="タイトル"
            value={title}
            error={errors.title}
            onChange={(event) => {
              const next = event.target.value;
              setTitle(next);
              if (!slugTouched) setSlug(generatePostSlug(next));
            }}
          />
          <Input
            label="スラッグ"
            value={slug}
            error={errors.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
          />
          <Input
            label="概要"
            value={excerpt}
            onChange={(event) => setExcerpt(event.target.value)}
            placeholder="一覧に表示する短い紹介文"
          />
          <BlogEditor
            value={content}
            onChange={setContent}
            error={errors.content}
          />
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <BlogImageUploader
              value={featuredImage}
              onChange={setFeaturedImage}
              accessToken={accessToken}
            />
            <CategorySelector
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
            />
            <TagInput
              value={tags}
              suggestions={suggestions}
              onChange={setTags}
            />
            <Input
              label="公開予約日時"
              type="datetime-local"
              value={scheduledAt}
              error={errors.scheduled_at}
              onChange={(event) => setScheduledAt(event.target.value)}
            />
          </Card>

          <BlogSeoForm
            seoTitle={seoTitle}
            seoDescription={seoDescription}
            onSeoTitleChange={setSeoTitle}
            onSeoDescriptionChange={setSeoDescription}
          />

          <Card className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={submitting}
              onClick={() => void handleSubmit('draft')}
            >
              下書き保存
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => void handleSubmit('scheduled')}
            >
              予約投稿
            </Button>
            <Button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit('published')}
            >
              公開
            </Button>
            <Link to="/admin/blog">
              <Button type="button" variant="ghost">
                キャンセル
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}
