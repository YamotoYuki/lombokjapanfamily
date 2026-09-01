import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  KPICard,
  ContactTable,
  RecentPosts,
  RecentVideos,
  SponsorTable,
  AnalyticsCharts,
  FamilyCard,
  GalleryCard,
  SocialLinksCard,
  UsersTable,
  SettingsStatusCard,
} from '@/components/dashboard';
import { resolveAnalyticsPreset } from '@/components/analytics';
import { useContacts } from '@/hooks/useContacts';
import { useContactStats } from '@/hooks/useContactStats';
import {
  useFamilyProfiles,
  useFamilyStats,
} from '@/hooks/useFamilyProfiles';
import { useGalleryStats } from '@/hooks/useGallery';
import { useSponsorStats } from '@/hooks/useSponsorStats';
import { useAuth } from '@/contexts/AuthContext';
import {
  useAnalyticsCountries,
  useAnalyticsPages,
  useAnalyticsSummary,
  useAnalyticsTimeseries,
} from '@/hooks/useAnalytics';
import { useUsers } from '@/hooks/useUsers';
import { useUserStats } from '@/hooks/useUserStats';
import { useSettings } from '@/hooks/useSettings';
import { usePublicPosts } from '@/hooks/usePosts';
import { useVideos } from '@/hooks/useVideos';
import { FEATURES } from '@/lib/features';
import { formatNumber } from '@/types/analytics';
import { formatSponsorAmount } from '@/types/sponsor';
import type {
  KpiMetric,
  RecentPostItem,
  RecentVideoItem,
  SocialLinkItem,
} from '@/types/dashboard';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const canManageContacts = hasRole('admin', 'editor');
  const statsQuery = useContactStats(canManageContacts);
  const contactsQuery = useContacts({ page: 1, limit: 4 }, canManageContacts);
  const familyStatsQuery = useFamilyStats();
  const familyQuery = useFamilyProfiles(false);
  const galleryStatsQuery = useGalleryStats();
  const sponsorStatsQuery = useSponsorStats(FEATURES.sponsors);
  const userStatsQuery = useUserStats(isAdmin);
  const usersQuery = useUsers({ page: 1, limit: 5 }, isAdmin);
  const settingsQuery = useSettings();
  const postsQuery = usePublicPosts({ page: 1, limit: 4 });
  const videosQuery = useVideos({ is_visible: true });

  const monthRange = useMemo(() => resolveAnalyticsPreset('this_month'), []);
  const analyticsRange = useMemo(
    () => ({
      start_date: monthRange.start_date,
      end_date: monthRange.end_date,
    }),
    [monthRange.end_date, monthRange.start_date],
  );
  const analyticsSummary = useAnalyticsSummary(analyticsRange);
  const analyticsTimeseries = useAnalyticsTimeseries(analyticsRange);
  const analyticsPages = useAnalyticsPages({ ...analyticsRange, limit: 3 });
  const analyticsCountries = useAnalyticsCountries(analyticsRange);

  const stats = statsQuery.data;
  const sponsorStats = sponsorStatsQuery.data;
  const kpiItems: KpiMetric[] = [
    {
      id: 'views',
      label: t('admin.pages.dashboard.kpiPv'),
      value:
        typeof analyticsSummary.data?.total_pv === 'number'
          ? formatNumber(analyticsSummary.data.total_pv)
          : '—',
      change: analyticsSummary.isLoading
        ? t('admin.common.fetching')
        : 'Analytics',
      trend: 'up',
      icon: 'views',
    },
    {
      id: 'subscribers',
      label: t('admin.pages.dashboard.kpiUu'),
      value:
        typeof analyticsSummary.data?.total_uu === 'number'
          ? formatNumber(analyticsSummary.data.total_uu)
          : '—',
      change:
        typeof analyticsSummary.data?.total_sessions === 'number'
          ? `Session ${formatNumber(analyticsSummary.data.total_sessions)}`
          : t('admin.common.fetching'),
      trend: 'up',
      icon: 'subscribers',
    },
    {
      id: 'contacts',
      label: t('admin.pages.dashboard.kpiContacts'),
      value: String(stats?.total ?? '—'),
      change:
        typeof stats?.new_count === 'number'
          ? t('admin.pages.dashboard.kpiPending', { count: stats.new_count })
          : t('admin.common.fetching'),
      trend: 'up',
      icon: 'contacts',
    },
    {
      id: 'pv',
      label: isAdmin
        ? t('admin.pages.dashboard.kpiUsers')
        : FEATURES.sponsors
          ? t('admin.pages.dashboard.kpiSponsors')
          : t('admin.pages.dashboard.kpiGallery'),
      value: isAdmin
        ? String(userStatsQuery.data?.total ?? '—')
        : FEATURES.sponsors
          ? String(sponsorStats?.in_progress_count ?? '—')
          : String(galleryStatsQuery.data?.total ?? '—'),
      change: isAdmin
        ? `A${userStatsQuery.data?.admin_count ?? 0} / E${userStatsQuery.data?.editor_count ?? 0} / V${userStatsQuery.data?.viewer_count ?? 0}`
        : FEATURES.sponsors &&
            typeof sponsorStats?.monthly_revenue === 'number'
          ? t('admin.pages.dashboard.kpiMonthRevenue', {
              amount: formatSponsorAmount(sponsorStats.monthly_revenue),
            })
          : typeof galleryStatsQuery.data?.featured_count === 'number'
            ? t('admin.pages.dashboard.kpiFeatured', {
                count: galleryStatsQuery.data.featured_count,
              })
            : t('admin.common.fetching'),
      trend: 'up',
      icon: 'pv',
    },
  ];

  const series = (analyticsTimeseries.data ?? []).map((item) => ({
    label: (item.date ?? '').slice(5) || '—',
    pv: item.pv,
    uu: item.uu,
  }));

  const popularPages = (analyticsPages.data ?? []).map((item) => ({
    path: item.page_path,
    views: item.pv,
  }));

  const countries = (analyticsCountries.data ?? []).slice(0, 3).map((item) => ({
    country: item.country,
    value: item.active_users,
  }));

  const recentPostItems: RecentPostItem[] = (postsQuery.data?.items ?? []).map(
    (post) => ({
      id: post.id,
      title: post.title || t('admin.common.untitled'),
      publishedAt: (post.published_at || post.created_at || '').slice(0, 10) || '—',
      category: post.category?.name || 'Blog',
    }),
  );

  const recentVideoItems: RecentVideoItem[] = (videosQuery.data?.items ?? [])
    .slice(0, 4)
    .map((video) => ({
      id: video.id,
      title: video.title || t('admin.common.untitled'),
      publishedAt: (video.published_at || video.created_at || '').slice(0, 10) || '—',
      thumbnailUrl: video.thumbnail_url || '',
      views: formatNumber(video.views ?? 0),
    }));

  const settings = settingsQuery.data;
  const socialLinkItems: SocialLinkItem[] = [
    {
      id: 'instagram',
      platform: 'Instagram' as const,
      handle: settings?.instagram_url || t('admin.common.unset'),
      url: settings?.instagram_url || '#',
      followers: '—',
    },
    {
      id: 'tiktok',
      platform: 'TikTok' as const,
      handle: settings?.tiktok_url || t('admin.common.unset'),
      url: settings?.tiktok_url || '#',
      followers: '—',
    },
    {
      id: 'facebook',
      platform: 'Facebook' as const,
      handle: settings?.facebook_url || t('admin.common.unset'),
      url: settings?.facebook_url || '#',
      followers: '—',
    },
    {
      id: 'x',
      platform: 'X' as const,
      handle: settings?.x_url || t('admin.common.unset'),
      url: settings?.x_url || '#',
      followers: '—',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Overview
          </p>
          <h2 className="mt-2 break-words text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {t('admin.titles.dashboard')}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {t('admin.pages.dashboard.description')}
          </p>
        </div>
        <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted backdrop-blur">
          {t('admin.pages.dashboard.analyticsLinked')}
        </div>
      </div>

      {/* KPI — 4 equal */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiItems.map((metric) => (
          <KPICard key={metric.id} metric={metric} />
        ))}
      </section>

      {/* Activity — 3 equal */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ContactTable
          items={contactsQuery.data?.items ?? []}
          isLoading={contactsQuery.isLoading}
          newCount={stats?.new_count}
        />
        <RecentPosts items={recentPostItems} />
        <RecentVideos items={recentVideoItems} />
      </section>

      {/* Analytics (+ sponsors when enabled) */}
      <section
        className={[
          'grid grid-cols-1 gap-4',
          FEATURES.sponsors ? 'xl:grid-cols-2' : '',
        ].join(' ')}
      >
        {FEATURES.sponsors ? (
          <SponsorTable
            items={sponsorStats?.recent ?? []}
            isLoading={sponsorStatsQuery.isLoading}
            inProgressCount={sponsorStats?.in_progress_count}
            monthlyRevenue={sponsorStats?.monthly_revenue}
            yearlyRevenue={sponsorStats?.yearly_revenue}
          />
        ) : null}
        <AnalyticsCharts
          series={series}
          popularPages={popularPages}
          countries={countries}
          monthlyPv={analyticsSummary.data?.total_pv}
          monthlyUu={analyticsSummary.data?.total_uu}
          isLoading={
            analyticsSummary.isLoading ||
            analyticsTimeseries.isLoading ||
            analyticsPages.isLoading ||
            analyticsCountries.isLoading
          }
        />
      </section>

      {/* Content — 3 equal (orphan fills on tablet) */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <FamilyCard
          members={familyQuery.data ?? []}
          total={familyStatsQuery.data?.total}
          visibleCount={familyStatsQuery.data?.visible_count}
          isLoading={familyQuery.isLoading || familyStatsQuery.isLoading}
        />
        <GalleryCard
          items={galleryStatsQuery.data?.recent ?? []}
          total={galleryStatsQuery.data?.total}
          featuredCount={galleryStatsQuery.data?.featured_count}
          isLoading={galleryStatsQuery.isLoading}
        />
        <div className="h-full sm:col-span-2 lg:col-span-1">
          <SocialLinksCard items={socialLinkItems} />
        </div>
      </section>

      {/* Admin tools — 2 equal */}
      {isAdmin ? (
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <SettingsStatusCard
            settings={settingsQuery.data}
            isLoading={settingsQuery.isLoading}
          />
          <UsersTable
            items={usersQuery.data?.items ?? []}
            isLoading={usersQuery.isLoading || userStatsQuery.isLoading}
            total={userStatsQuery.data?.total}
            adminCount={userStatsQuery.data?.admin_count}
            editorCount={userStatsQuery.data?.editor_count}
            viewerCount={userStatsQuery.data?.viewer_count}
          />
        </section>
      ) : null}
    </div>
  );
}
