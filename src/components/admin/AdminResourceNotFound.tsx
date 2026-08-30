import { Link } from 'react-router-dom';

interface AdminResourceNotFoundProps {
  resourceLabel: string;
  backTo: string;
  backLabel?: string;
  detail?: string;
}

export default function AdminResourceNotFound({
  resourceLabel,
  backTo,
  backLabel = '一覧へ戻る',
  detail,
}: AdminResourceNotFoundProps) {
  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-5 py-8 text-center">
      <p className="text-xs uppercase tracking-[0.24em] text-gold">404</p>
      <h2 className="text-xl font-semibold text-white">
        {resourceLabel}が見つかりません
      </h2>
      <p className="text-sm text-red-200/90">
        {detail ||
          '指定されたIDは存在しないか、削除・非公開になっている可能性があります。'}
      </p>
      <Link
        to={backTo}
        className="inline-flex items-center justify-center rounded-xl border border-white/15 px-4 py-2 text-sm text-white transition-colors hover:border-gold/40 hover:text-gold"
      >
        ← {backLabel}
      </Link>
    </div>
  );
}
