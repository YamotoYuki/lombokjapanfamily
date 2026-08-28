import type { Settings } from '@/types/settings';

interface SystemSettingsProps {
  value: Settings;
  onChange: (patch: Partial<Settings>) => void;
}

export default function SystemSettings({ value, onChange }: SystemSettingsProps) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold text-white">システム設定</h3>
        <p className="mt-1 text-sm text-muted">
          メンテナンスモード中は公開サイトに告知を表示します（管理者は閲覧可）。
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
        <div>
          <p className="text-sm font-medium text-white">Maintenance Mode</p>
          <p className="mt-1 text-xs text-muted">
            {value.maintenance_mode
              ? '現在 ON — 公開訪問者にはメンテナンス画面を表示'
              : '現在 OFF — 通常公開中'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={value.maintenance_mode}
          onClick={() => onChange({ maintenance_mode: !value.maintenance_mode })}
          className={[
            'relative h-8 w-14 rounded-full transition-colors',
            value.maintenance_mode ? 'bg-youtube-red' : 'bg-white/15',
          ].join(' ')}
        >
          <span
            className={[
              'absolute top-1 h-6 w-6 rounded-full bg-white transition-transform',
              value.maintenance_mode ? 'left-7' : 'left-1',
            ].join(' ')}
          />
        </button>
      </div>
    </div>
  );
}
