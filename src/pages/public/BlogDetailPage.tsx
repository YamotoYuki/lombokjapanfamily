import { Link, useParams } from 'react-router-dom';
import { PublicBlogDetail } from '@/components/public/blog';
import { usePublicPost } from '@/hooks/usePosts';

export default function BlogDetailPage() {
  const { slug } = useParams();
  const postQuery = usePublicPost(slug);

  if (postQuery.isLoading) {
    return (
      <div className="px-4 py-32 text-center text-sm text-muted">
        記事を読み込み中です...
      </div>
    );
  }

  if (postQuery.isError || !postQuery.data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24">
        <div className="rounded-2xl border border-youtube-red/30 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
          {postQuery.error instanceof Error
            ? postQuery.error.message
            : '記事取得に失敗しました'}
        </div>
        <Link to="/blog" className="mt-6 inline-block text-sm text-gold">
          ← ブログ一覧へ
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20">
      <PublicBlogDetail
        post={postQuery.data.post}
        related={postQuery.data.related}
      />
    </div>
  );
}
