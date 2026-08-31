import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import {
  BrandingSettings,
  ContactSettings,
  GeneralSettings,
  IntegrationSettings,
  SeoSettings,
  SocialSettings,
  SystemSettings,
} from '@/components/settings';
import { AdminStickyActions } from '@/components/admin';
import { Button, Card } from '@/components/ui';
import { useBreakpoint } from '@/hooks/useMediaQuery';
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

function isSettingsTabId(value: string | null): value is SettingsTabId {
  return SETTINGS_TABS.some((tab) => tab.id === value);
}

export default function SettingsPage() {
  const { isDesktop } = useBreakpoint();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const tab: SettingsTabId = isSettingsTabId(tabParam) ? tabParam : 'general';
  const [draft, setDraft] = useState<Settings>(DEFAULT_SETTINGS);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const settingsQuery = useSettings();
  const updateMutation = useUpdateSettings();
  const logoMutation = useUploadLogo();
  const faviconMutation = useUploadFavicon();
  const ogMutation = useUploadOgImage();

  const setTab = (next: SettingsTabId) => {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        if (next === 'general') {
          params.delete('tab');
        } else {
          params.set('tab', next);
        }
        return params;
      },
      { replace: true },
    );
  };

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
        site_description: draft.site_description || null,
        logo_url: draft.logo_url || null,
        favicon_url: draft.favicon_url || null,
        contact_email: draft.contact_email || null,
        contact_phone: draft.contact_phone || null,
        contact_address: draft.contact_address || null,
        youtube_channel_url: draft.youtube_channel_url || null,
        instagram_url: draft.instagram_url || null,
        tiktok_url: draft.tiktok_url || null,
        facebook_url: draft.facebook_url || null,
        x_url: draft.x_url || null,
        seo_title: draft.seo_title || null,
        seo_description: draft.seo_description || null,
        seo_keywords: draft.seo_keywords || null,
        og_image_url: draft.og_image_url || null,
        ga4_measurement_id: draft.ga4_measurement_id || null,
        google_tag_manager_id: draft.google_tag_manager_id || null,
        maintenance_mode: draft.maintenance_mode,
      });
      setDraft(result.settings);
      setMessage(result.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : '設定の保存に失敗しました');
    }
  };

  const renderPanel = (id: SettingsTabId): ReactNode => {
    if (settingsQuery.isLoading) {
      return <p className="text-sm text-muted">読み込み中...</p>;
    }
    switch (id) {
      case 'general':
        return <GeneralSettings value={draft} onChange={patchDraft} />;
      case 'seo':
        return (
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
        );
      case 'social':
        return <SocialSettings value={draft} onChange={patchDraft} />;
      case 'contact':
        return <ContactSettings value={draft} onChange={patchDraft} />;
      case 'integrations':
        return <IntegrationSettings value={draft} onChange={patchDraft} />;
      case 'branding':
        return (
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
        );
      case 'system':
        return <SystemSettings value={draft} onChange={patchDraft} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 pb-4">
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-[0.24em] text-gold">Settings</p>
        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
          Settings編集
        </h2>
        <p className="mt-2 text-sm text-muted">
          ブランド・SEO・SNS・連携・メンテナンスをコード変更なしで運用します。
        </p>
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

      {isDesktop ? (
        <>
          <div className="scrollbar-thin -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {SETTINGS_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={[
                  'touch-target shrink-0 rounded-2xl border px-4 py-2 text-sm font-medium transition-colors',
                  tab === item.id
                    ? 'border-youtube-red/50 bg-youtube-red/15 text-white'
                    : 'border-white/10 bg-white/[0.03] text-muted hover:text-white',
                ].join(' ')}
              >
                {item.label}
              </button>
            ))}
          </div>
          <Card className="p-4 sm:p-6">{renderPanel(tab)}</Card>
        </>
      ) : (
        <div className="space-y-2">
          {SETTINGS_TABS.map((item) => {
            const open = tab === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
              >
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setTab(item.id)}
                  className="touch-target flex min-h-11 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span
                    className={[
                      'text-sm font-medium',
                      open ? 'text-white' : 'text-muted',
                    ].join(' ')}
                  >
                    {item.label}
                  </span>
                  <ChevronDown
                    size={18}
                    className={[
                      'shrink-0 text-muted transition-transform',
                      open ? 'rotate-180 text-gold' : '',
                    ].join(' ')}
                    aria-hidden
                  />
                </button>
                {open ? (
                  <div className="border-t border-white/10 px-4 py-4">
                    {renderPanel(item.id)}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <AdminStickyActions>
        <Button
          type="button"
          className="w-full sm:w-auto"
          onClick={() => void handleSave()}
          disabled={!dirty || updateMutation.isPending || settingsQuery.isLoading}
        >
          {updateMutation.isPending ? '保存中...' : '変更を保存'}
        </Button>
      </AdminStickyActions>
    </div>
  );
}
