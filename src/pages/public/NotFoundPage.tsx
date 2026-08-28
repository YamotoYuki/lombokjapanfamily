import { Link } from 'react-router-dom';
import { Button } from '@/components/ui';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-gold">404</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-white">
        ページが見つかりません
      </h1>
      <p className="mt-3 max-w-md text-sm text-muted">
        URLが間違っているか、ページが移動した可能性があります。
      </p>
      <Link to="/" className="mt-8">
        <Button type="button">ホームへ戻る</Button>
      </Link>
    </div>
  );
}
