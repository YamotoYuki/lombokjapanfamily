import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  PublicBlogFilters,
  PublicBlogList,
} from '@/components/public/blog';
import { PageHero } from '@/components/public';
import { usePostCategories } from '@/hooks/usePostCategories';
import { usePostTags } from '@/hooks/usePostTags';
import { usePublicPosts } from '@/hooks/usePosts';

const PAGE_SIZE = 9;

export default function BlogPage() {
  const [keyword, setKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [tag, setTag] = useState('');
  const [page, setPage] = useState(1);

  const params = useMemo(
    () => ({
      keyword: keyword.trim() || undefined,
      category: category || undefined,
      tag: tag || undefined,
      page,
      limit: PAGE_SIZE,
    }),
    [keyword, category, tag, page],
  );

  const postsQuery = usePublicPosts(params);
  const categoriesQuery = usePostCategories();
  const tagsQuery = usePostTags();

  return (
    <>
      <Helmet>
        <title>Blog | Lombok-Japan Family</title>
        <meta
          name="description"
          content="旅・日常・子育て・文化交流を発信する Lombok-Japan Family 公式ブログ"
        />
      </Helmet>
      <PageHero
        eyebrow="Blog"
        title="Latest Articles"
        description="撮影の裏側からレシピ、旅の記録まで。文章でもファミリーの景色をお届けします。"
        backgroundImage="https://images.unsplash.com/photo-1496412705860-fb6f76913ec6?w=1600&h=900&fit=crop"
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <PublicBlogFilters
          keyword={keyword}
          category={category}
          tag={tag}
          categories={categoriesQuery.data ?? []}
          tags={tagsQuery.data ?? []}
          onKeywordChange={(value) => {
            setPage(1);
            setKeyword(value);
          }}
          onCategoryChange={(value) => {
            setPage(1);
            setCategory(value);
          }}
          onTagChange={(value) => {
            setPage(1);
            setTag(value);
          }}
        />

        {postsQuery.isError && (
          <div className="mb-6 rounded-2xl border border-youtube-red/30 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {postsQuery.error instanceof Error
              ? postsQuery.error.message
              : '記事取得に失敗しました'}
          </div>
        )}

        {postsQuery.isLoading ? (
          <div className="rounded-2xl border border-white/10 px-6 py-16 text-center text-sm text-muted">
            記事を読み込み中です...
          </div>
        ) : (
          <PublicBlogList
            posts={postsQuery.data?.items ?? []}
            page={page}
            total={postsQuery.data?.total ?? 0}
            limit={PAGE_SIZE}
            onPageChange={setPage}
          />
        )}
      </section>
    </>
  );
}
