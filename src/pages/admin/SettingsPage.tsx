import { useEffect, useMemo, useState } from 'react';
import {
  BrandingSettings,
  ContactSettings,
  GeneralSettings,
  IntegrationSettings,
  SeoSettings,
  SocialSettings,
  SystemSettings,
} from '@/components/settings';
import { Button, Card } from '@/components/ui';
import {
  useSettings,
  useUpdateSettings,
  useUploadFavicon,
  useUploadLogo,
  useUploadOgImage,
} from '@/hooks/useSettings';
import {
  DEFAULT_SETTINGS,
  SETTINGS_TABS,
  type Settings,
  type SettingsTabId,
} from '@/types/settings';

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTabId>('general');
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settingsQuery = useSettings();
  const updateMutation = useUpdateSettings();
  const logoMutation = useUploadLogo();
  const faviconMutation = useUploadFavicon();
  const ogMutation = useUploadOgImage();

  useEffect(() => {
    if (settingsQuery.data) {
      setDraft(settingsQuery.data);
    }
  }, [settingsQuery.data]);

  const dirty = useMemo(() => {
    if (!settingsQuery.data) return false;
    return JSON.stringify(draft) !== JSON.stringify(settingsQuery.data);
  }, [draft, settingsQuery.data]);

  const patchDraft = (patch: Partial<Settings>) => {
    setDraft((prev) => ({ ...prev, ...patch }));
    setMessage(null);
    setError(null);
  };

  const handleSave = async () => {
    setMessage(null);
    setError(null);
    try {
      const result = await updateMutation.mutateAsync({
        site_name: draft.site_name,
        site_description: draft.site_description,
        logo_url: draft.logo_url || undefined,
        favicon_url: draft.favicon_url || undefined,
        contact_email: draft.contact_email || undefined,
        contact_phone: draft.contact_phone || undefined,
        contact_address: draft.contact_address || undefined,
        youtube_channel_url: draft.youtube_channel_url || undefined,
        instagram_url: draft.instagram_url || undefined,
        tiktok_url: draft.tiktok_url || undefined,
        facebook_url: draft.facebook_url || undefined,
        x_url: draft.x_url || undefined,
        seo_title: draft.seo_title || undefined,
        seo_description: draft.seo_description || undefined,
        seo_keywords: draft.seo_keywords || undefined,
        og_image_url: draft.og_image_url || undefined,
        ga4_measurement_id: draft.ga4_measurement_id || undefined,
        google_tag_manager_id: draft.google_tag_manager_id || undefined,
        maintenance_mode: draft.maintenance_mode,
      });
      setDraft(result.settings);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">Settings</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">サイト設定</h2>
          <p className="mt-2 text-sm text-muted">
            ブランド・SEO・SNS・連携・メンテナンスをコード変更なしで運用します。
          </p>
        </div>
        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={!dirty || updateMutation.isPending || settingsQuery.isLoading}
        >
          {updateMutation.isPending ? '保存中...' : '変更を保存'}
        </Button>
      </div>

      {(message || error || settingsQuery.isError) && (
        <div
          className={[
            'rounded-2xl border px-4 py-3 text-sm',
            error || settingsQuery.isError
              ? 'border-red-500/40 bg-red-500/10 text-red-200'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
          ].join(' ')}
        >
          {error ||
            (settingsQuery.isError
              ? '通信エラーが発生しました'
              : message)}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {SETTINGS_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={[
              'rounded-2xl border px-4 py-2 text-sm font-medium transition-colors',
              tab === item.id
                ? 'border-youtube-red/50 bg-youtube-red/15 text-white'
                : 'border-white/10 bg-white/[0.03] text-muted hover:text-white',
            ].join(' ')}
          >
            {item.label}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {settingsQuery.isLoading ? (
          <p className="text-sm text-muted">読み込み中...</p>
        ) : (
          <>
            {tab === 'general' && (
              <GeneralSettings value={draft} onChange={patchDraft} />
            )}
            {tab === 'seo' && (
              <SeoSettings
                value={draft}
                onChange={patchDraft}
                uploadingOg={ogMutation.isPending}
                onUploadOg={async (file) => {
                  setError(null);
                  try {
                    const result = await ogMutation.mutateAsync(file);
                    setDraft(result.settings);
                    setMessage(result.message);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'OG画像のアップロードに失敗しました',
                    );
                    throw err;
                  }
                }}
              />
            )}
            {tab === 'social' && (
              <SocialSettings value={draft} onChange={patchDraft} />
            )}
            {tab === 'contact' && (
              <ContactSettings value={draft} onChange={patchDraft} />
            )}
            {tab === 'integrations' && (
              <IntegrationSettings value={draft} onChange={patchDraft} />
            )}
            {tab === 'branding' && (
              <BrandingSettings
                value={draft}
                onChange={patchDraft}
                uploadingLogo={logoMutation.isPending}
                uploadingFavicon={faviconMutation.isPending}
                onUploadLogo={async (file) => {
                  setError(null);
                  try {
                    const result = await logoMutation.mutateAsync(file);
                    setDraft(result.settings);
                    setMessage(result.message);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'ロゴのアップロードに失敗しました',
                    );
                    throw err;
                  }
                }}
                onUploadFavicon={async (file) => {
                  setError(null);
                  try {
                    const result = await faviconMutation.mutateAsync(file);
                    setDraft(result.settings);
                    setMessage(result.message);
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : 'ファビコンのアップロードに失敗しました',
                    );
                    throw err;
                  }
                }}
              />
            )}
            {tab === 'system' && (
              <SystemSettings value={draft} onChange={patchDraft} />
            )}
          </>
        )}
      </Card>
    </div>
  );
}
