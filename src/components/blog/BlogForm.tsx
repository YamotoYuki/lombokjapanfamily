import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AutoTranslateButtons } from '@/components/admin';
import {
  BlogEditor,
  BlogImageUploader,
  BlogSeoForm,
  CategorySelector,
  TagInput,
} from '@/components/blog';
import { Button, Card, Input, LinkButton, backLinkClassName } from '@/components/ui';
import { usePostCategories } from '@/hooks/usePostCategories';
import { usePostTags } from '@/hooks/usePostTags';
import { translateJaFields } from '@/services/translateApi';
import {
  generatePostSlug,
  type Post,
  type PostInput,
  type PostStatus,
} from '@/types/post';

type LangTab = 'ja' | 'en' | 'id';

interface BlogFormProps {
  mode: 'create' | 'edit';
  initialPost?: Post;
  accessToken?: string | null;
  submitting?: boolean;
  /** Hide page chrome when wrapped by AdminEditChrome */
  embedded?: boolean;
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
  embedded = false,
  onSubmit,
}: BlogFormProps) {
  const { t } = useTranslation();
  const categoriesQuery = usePostCategories();
  const tagsQuery = usePostTags();

  const LANG_TABS: { id: LangTab; label: string }[] = [
    { id: 'ja', label: t('admin.common.japanese') },
    { id: 'en', label: t('admin.common.english') },
    { id: 'id', label: t('admin.common.indonesian') },
  ];

  const [title, setTitle] = useState(
    initialPost?.title_ja || initialPost?.title || '',
  );
  const [titleEn, setTitleEn] = useState(initialPost?.title_en ?? '');
  const [titleId, setTitleId] = useState(initialPost?.title_id ?? '');
  const [slug, setSlug] = useState(initialPost?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(Boolean(initialPost?.slug));
  const [content, setContent] = useState(
    initialPost?.content_ja || initialPost?.content || '',
  );
  const [contentEn, setContentEn] = useState(initialPost?.content_en ?? '');
  const [contentId, setContentId] = useState(initialPost?.content_id ?? '');
  const [excerpt, setExcerpt] = useState(
    initialPost?.excerpt_ja || initialPost?.excerpt || '',
  );
  const [excerptEn, setExcerptEn] = useState(initialPost?.excerpt_en ?? '');
  const [excerptId, setExcerptId] = useState(initialPost?.excerpt_id ?? '');
  const [langTab, setLangTab] = useState<LangTab>('ja');
  const [translating, setTranslating] = useState(false);
  const [translateNote, setTranslateNote] = useState<string | null>(null);
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
    setTitle(initialPost.title_ja || initialPost.title || '');
    setTitleEn(initialPost.title_en ?? '');
    setTitleId(initialPost.title_id ?? '');
    setSlug(initialPost.slug ?? '');
    setContent(initialPost.content_ja || initialPost.content || '');
    setContentEn(initialPost.content_en ?? '');
    setContentId(initialPost.content_id ?? '');
    setExcerpt(initialPost.excerpt_ja || initialPost.excerpt || '');
    setExcerptEn(initialPost.excerpt_en ?? '');
    setExcerptId(initialPost.excerpt_id ?? '');
    setFeaturedImage(initialPost.featured_image ?? '');
    setCategoryId(initialPost.category_id ?? '');
    setTags(initialPost.tags?.map((tag) => tag.name) ?? []);
    setSeoTitle(initialPost.seo_title ?? '');
    setSeoDescription(initialPost.seo_description ?? '');
    setScheduledAt(toLocalInputValue(initialPost.scheduled_at));
    setSlugTouched(true);
    setLangTab('ja');
    setTranslateNote(null);
  }, [initialPost]);

  const categories = categoriesQuery.data ?? [];
  const suggestions = tagsQuery.data ?? [];

  const handleAutoTranslate = async (target: 'en' | 'id') => {
    setFormError(null);
    setFormMessage(null);
    setTranslateNote(null);
    if (!title.trim() && !content.trim() && !excerpt.trim()) {
      setFormError(t('admin.common.translateNeedJa'));
      setLangTab('ja');
      return;
    }
    setTranslating(true);
    try {
      const source: Record<string, string> = {};
      if (title.trim()) source.title = title.trim();
      if (excerpt.trim()) source.excerpt = excerpt.trim();
      if (content.trim()) source.content = content.trim();
      const result = await translateJaFields(source, target);
      if (target === 'en') {
        setTitleEn((prev) => result.title || prev);
        setExcerptEn((prev) => result.excerpt || prev);
        setContentEn((prev) => result.content || prev);
        setLangTab('en');
        setTranslateNote(t('admin.common.translatedToEn'));
      } else {
        setTitleId((prev) => result.title || prev);
        setExcerptId((prev) => result.excerpt || prev);
        setContentId((prev) => result.content || prev);
        setLangTab('id');
        setTranslateNote(t('admin.common.translatedToId'));
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : t('admin.common.translateFailed'),
      );
    } finally {
      setTranslating(false);
    }
  };

  const buildInput = (intent: PostStatus): PostInput | null => {
    const nextErrors: Record<string, string> = {};
    if (!title.trim()) nextErrors.title = t('admin.blog.titleJaRequired');
    if (!slug.trim()) nextErrors.slug = t('admin.blog.slugRequired');
    if (!content.trim()) nextErrors.content = t('admin.blog.bodyJaRequired');
    if (intent === 'scheduled' && !scheduledAt) {
      nextErrors.scheduled_at = t('admin.blog.scheduledAtRequired');
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      if (nextErrors.title || nextErrors.content) setLangTab('ja');
      return null;
    }

    return {
      title: title.trim(),
      slug: slug.trim(),
      content,
      excerpt: excerpt.trim() || undefined,
      title_ja: title.trim(),
      title_en: titleEn.trim() || null,
      title_id: titleId.trim() || null,
      content_ja: content,
      content_en: contentEn.trim() || null,
      content_id: contentId.trim() || null,
      excerpt_ja: excerpt.trim() || null,
      excerpt_en: excerptEn.trim() || null,
      excerpt_id: excerptId.trim() || null,
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
        error instanceof Error
          ? error.message
          : t('admin.pages.blog.saveFailed'),
      );
    }
  };

  const heading =
    mode === 'create'
      ? t('admin.blog.createHeading')
      : t('admin.blog.editHeading');

  return (
    <div className="space-y-6">
      {!embedded ? (
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            {t('admin.titles.blog')}
          </p>
          <h2 className="mt-2 text-3xl font-semibold text-white">{heading}</h2>
        </div>
      ) : null}

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
          <div
            className="scrollbar-thin flex gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-1"
            role="tablist"
            aria-label={t('admin.common.languageSwitch')}
          >
            {LANG_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={langTab === tab.id}
                onClick={() => setLangTab(tab.id)}
                className={[
                  'touch-target min-h-11 shrink-0 flex-1 rounded-xl px-3 text-xs font-medium transition-colors sm:text-sm',
                  langTab === tab.id
                    ? 'bg-youtube-red/20 text-white'
                    : 'text-muted hover:text-white',
                ].join(' ')}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {langTab === 'ja' ? (
            <>
              <Input
                label={t('admin.common.titleJa')}
                value={title}
                error={errors.title}
                onChange={(event) => {
                  const next = event.target.value;
                  setTitle(next);
                  if (!slugTouched) setSlug(generatePostSlug(next));
                }}
              />
              <Input
                label={t('admin.blog.excerptJa')}
                value={excerpt}
                onChange={(event) => setExcerpt(event.target.value)}
                placeholder={t('admin.blog.excerptPlaceholder')}
              />
              <BlogEditor
                label={t('admin.common.bodyJa')}
                value={content}
                onChange={setContent}
                error={errors.content}
              />
              <AutoTranslateButtons
                translating={translating}
                disabled={submitting}
                onTranslate={handleAutoTranslate}
              />
            </>
          ) : null}

          {langTab === 'en' ? (
            <>
              <Input
                label={t('admin.common.titleEn')}
                value={titleEn}
                onChange={(event) => setTitleEn(event.target.value)}
                placeholder={t('admin.common.emptyFallsBackToJa')}
              />
              <Input
                label={t('admin.blog.excerptEn')}
                value={excerptEn}
                onChange={(event) => setExcerptEn(event.target.value)}
                placeholder={t('admin.common.emptyFallsBackToJa')}
              />
              <BlogEditor
                label={t('admin.common.bodyEn')}
                value={contentEn}
                onChange={setContentEn}
                placeholder={t('admin.common.emptyFallsBackToJa')}
              />
            </>
          ) : null}

          {langTab === 'id' ? (
            <>
              <Input
                label={t('admin.common.titleId')}
                value={titleId}
                onChange={(event) => setTitleId(event.target.value)}
                placeholder={t('admin.common.emptyFallsBackToJa')}
              />
              <Input
                label={t('admin.blog.excerptId')}
                value={excerptId}
                onChange={(event) => setExcerptId(event.target.value)}
                placeholder={t('admin.common.emptyFallsBackToJa')}
              />
              <BlogEditor
                label={t('admin.common.bodyId')}
                value={contentId}
                onChange={setContentId}
                placeholder={t('admin.common.emptyFallsBackToJa')}
              />
            </>
          ) : null}

          {translateNote ? (
            <p className="rounded-2xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm text-amber-100">
              {translateNote}
            </p>
          ) : null}

          <Input
            label={t('admin.common.slug')}
            value={slug}
            error={errors.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setSlug(event.target.value);
            }}
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
              label={t('admin.blog.scheduledAt')}
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
              disabled={submitting || translating}
              onClick={() => void handleSubmit('draft')}
            >
              {t('admin.blog.saveDraft')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={submitting || translating}
              onClick={() => void handleSubmit('scheduled')}
            >
              {t('admin.blog.schedulePost')}
            </Button>
            <Button
              type="button"
              disabled={submitting || translating}
              onClick={() => void handleSubmit('published')}
            >
              {t('admin.blog.publishPost')}
            </Button>
            <LinkButton to="/admin/blog" variant="ghost">
              {t('admin.common.cancel')}
            </LinkButton>
          </Card>
        </div>
      </div>

      {!embedded ? (
        <div className="pt-2">
          <Link to="/admin/blog" className={backLinkClassName}>
            <ArrowLeft size={16} aria-hidden />
            {t('admin.common.backToList')}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
