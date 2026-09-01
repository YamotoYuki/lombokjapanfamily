import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui';
import {
  resolveAnalyticsPreset,
  type AnalyticsPreset,
} from '@/components/analytics/datePresets';

interface AnalyticsDateFilterProps {
  preset: AnalyticsPreset;
  startDate: string;
  endDate: string;
  onChange: (next: {
    preset: AnalyticsPreset;
    start_date: string;
    end_date: string;
  }) => void;
}

export default function AnalyticsDateFilter({
  preset,
  startDate,
  endDate,
  onChange,
}: AnalyticsDateFilterProps) {
  const { t } = useTranslation();
  const presets: { value: AnalyticsPreset; label: string }[] = [
    { value: '7d', label: t('admin.analytics.last7d') },
    { value: '30d', label: t('admin.analytics.last30d') },
    { value: '90d', label: t('admin.analytics.last90d') },
    { value: 'this_month', label: t('admin.common.thisMonth') },
    { value: 'last_month', label: t('admin.common.lastMonth') },
    { value: 'this_year', label: t('admin.common.thisYear') },
    { value: 'custom', label: t('admin.common.customRange') },
  ];

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur">
      <div className="flex flex-wrap gap-2">
        {presets.map((item) => {
          const active = item.value === preset;
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => {
                const next = resolveAnalyticsPreset(
                  item.value,
                  startDate,
                  endDate,
                );
                onChange(next);
              }}
              className={[
                'rounded-full px-3 py-1.5 text-xs font-medium transition-all',
                active
                  ? 'bg-youtube-red text-white shadow-lg shadow-youtube-red/20'
                  : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {preset === 'custom' && (
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            label={t('admin.common.startDate')}
            type="date"
            value={startDate}
            onChange={(event) =>
              onChange({
                preset: 'custom',
                start_date: event.target.value,
                end_date: endDate,
              })
            }
          />
          <Input
            label={t('admin.common.endDate')}
            type="date"
            value={endDate}
            onChange={(event) =>
              onChange({
                preset: 'custom',
                start_date: startDate,
                end_date: event.target.value,
              })
            }
          />
        </div>
      )}
    </div>
  );
}
