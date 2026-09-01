import { useTranslation } from 'react-i18next';
import { CalendarDays } from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import type { RecentPostItem } from '@/types/dashboard';

interface RecentPostsProps {
  items: RecentPostItem[];
}

export default function RecentPosts({ items }: RecentPostsProps) {
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <SectionHeader
        title={t('admin.dashboard.recentPosts')}
        subtitle={t('admin.dashboard.publishedBlog')}
        actionLabel={t('admin.common.viewAll')}
        actionTo="/admin/blog"
      />
      <div className="space-y-3">
        {items.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/5 bg-primary-bg/40 px-3.5 py-3 transition-all hover:border-gold/30 hover:bg-primary-bg/70"
          >
            <span className="text-[11px] font-medium uppercase tracking-wide text-gold">
              {item.category}
            </span>
            <h4 className="mt-1 line-clamp-2 text-sm font-medium text-white">
              {item.title}
            </h4>
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-muted">
              <CalendarDays size={12} />
              {item.publishedAt}
            </p>
          </article>
        ))}
      </div>
    </Card>
  );
}
