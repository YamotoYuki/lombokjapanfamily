import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import {
  Facebook,
  Instagram,
  Music2,
  Twitter,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '@/components/ui/Card';
import { buttonClassName } from '@/components/ui/LinkButton';
import SectionHeader from '@/components/dashboard/SectionHeader';
import type { SocialLinkItem } from '@/types/dashboard';

const platformIcon = {
  Instagram,
  TikTok: Music2,
  Facebook,
  X: Twitter,
} as const;

const platformAccent: Record<SocialLinkItem['platform'], string> = {
  Instagram: 'from-pink-500/20 to-purple-500/10 text-pink-300',
  TikTok: 'from-cyan-400/20 to-white/5 text-cyan-200',
  Facebook: 'from-blue-500/20 to-blue-900/10 text-blue-300',
  X: 'from-white/15 to-white/5 text-white',
};

interface SocialLinksCardProps {
  items: SocialLinkItem[];
}

export default function SocialLinksCard({ items }: SocialLinksCardProps) {
  const { t } = useTranslation();

  return (
    <Card className="h-full">
      <SectionHeader
        title={t('admin.dashboard.snsManage')}
        subtitle={t('admin.dashboard.officialAccounts')}
        actionLabel={t('admin.common.settings')}
        actionTo="/admin/settings?tab=social"
      />
      <div className="space-y-3">
        {items.map((item) => {
          const Icon = platformIcon[item.platform];
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3 transition-all hover:border-white/15 hover:bg-primary-bg/70"
            >
              <div
                className={[
                  'flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br',
                  platformAccent[item.platform],
                ].join(' ')}
              >
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-white">{item.platform}</p>
                <p className="truncate text-xs text-muted">{item.handle}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-gold">{item.followers}</p>
                <Link
                  to="/admin/settings?tab=social"
                  className={buttonClassName(
                    'ghost',
                    'sm',
                    'mt-1 !px-2 !py-1',
                  )}
                >
                  <Pencil size={12} />
                  {t('admin.common.edit')}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
