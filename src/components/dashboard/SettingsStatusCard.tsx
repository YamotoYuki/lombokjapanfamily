import { Link } from 'react-router-dom';
import {
  Activity,
  Globe2,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import Card from '@/components/ui/Card';
import SectionHeader from '@/components/dashboard/SectionHeader';
import type { Settings } from '@/types/settings';

interface SettingsStatusCardProps {
  settings?: Settings;
  isLoading?: boolean;
}

export default function SettingsStatusCard({
  settings,
  isLoading,
}: SettingsStatusCardProps) {
  const snsCount = [
    settings?.youtube_channel_url,
    settings?.instagram_url,
    settings?.tiktok_url,
    settings?.facebook_url,
    settings?.x_url,
  ].filter(Boolean).length;

  const gaReady = Boolean(settings?.ga4_measurement_id);

  return (
    <Card className="h-full overflow-hidden">
      <SectionHeader
        title="サイト設定"
        subtitle="公開反映ステータス"
        actionLabel="設定"
        actionTo="/admin/settings"
      />
      {isLoading ? (
        <p className="text-sm text-muted">読み込み中...</p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-youtube-red/15 text-youtube-red">
              <Globe2 size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">現在のサイト名</p>
              <p className="truncate text-sm font-medium text-white">
                {settings?.site_name || '—'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3">
            <div
              className={[
                'flex h-10 w-10 items-center justify-center rounded-xl',
                settings?.maintenance_mode
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-emerald-500/15 text-emerald-300',
              ].join(' ')}
            >
              <ShieldAlert size={18} />
            </div>
            <div>
              <p className="text-xs text-muted">メンテナンス</p>
              <p className="text-sm font-medium text-white">
                {settings?.maintenance_mode ? 'ON（公開制限中）' : 'OFF（通常公開）'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500/15 text-pink-300">
              <Radio size={18} />
            </div>
            <div>
              <p className="text-xs text-muted">SNS接続</p>
              <p className="text-sm font-medium text-white">{snsCount} / 5 設定済</p>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-primary-bg/40 p-3">
            <div
              className={[
                'flex h-10 w-10 items-center justify-center rounded-xl',
                gaReady
                  ? 'bg-cyan-500/15 text-cyan-300'
                  : 'bg-white/10 text-muted',
              ].join(' ')}
            >
              <Activity size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">GA4設定</p>
              <p className="truncate text-sm font-medium text-white">
                {gaReady ? settings?.ga4_measurement_id : '未設定'}
              </p>
            </div>
          </div>

          <Link
            to="/admin/settings"
            className="block rounded-2xl border border-white/10 px-3 py-2 text-center text-xs text-muted transition hover:border-gold/40 hover:text-gold"
          >
            Settings を開く
          </Link>
        </div>
      )}
    </Card>
  );
}
