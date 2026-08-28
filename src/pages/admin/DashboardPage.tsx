import { useMemo } from 'react';
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
import {
  recentPosts,
  recentVideos,
  socialLinks,
} from '@/data/dashboardDummy';
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
import { formatNumber } from '@/types/analytics';
import { formatSponsorAmount } from '@/types/sponsor';
import type { KpiMetric } from '@/types/dashboard';

export default function DashboardPage() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const statsQuery = useContactStats();
  const contactsQuery = useContacts({ page: 1, limit: 4 });
  const familyStatsQuery = useFamilyStats();
  const familyQuery = useFamilyProfiles(false);
  const galleryStatsQuery = useGalleryStats();
  const sponsorStatsQuery = useSponsorStats();
  const userStatsQuery = useUserStats(isAdmin);
  const usersQuery = useUsers({ page: 1, limit: 5 }, isAdmin);
  const settingsQuery = useSettings();

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
      label: '今月PV',
      value:
        typeof analyticsSummary.data?.total_pv === 'number'
          ? formatNumber(analyticsSummary.data.total_pv)
          : '—',
      change: analyticsSummary.isLoading ? '取得中' : 'Analytics',
      trend: 'up',
      icon: 'views',
    },
    {
      id: 'subscribers',
      label: '今月UU',
      value:
        typeof analyticsSummary.data?.total_uu === 'number'
          ? formatNumber(analyticsSummary.data.total_uu)
          : '—',
      change:
        typeof analyticsSummary.data?.total_sessions === 'number'
          ? `Session ${formatNumber(analyticsSummary.data.total_sessions)}`
          : '取得中',
      trend: 'up',
      icon: 'subscribers',
    },
    {
      id: 'contacts',
      label: 'お問い合わせ件数',
      value: String(stats?.total ?? '—'),
      change:
        typeof stats?.new_count === 'number'
          ? `未対応 ${stats.new_count}件`
          : '取得中',
      trend: 'up',
      icon: 'contacts',
    },
    {
      id: 'pv',
      label: isAdmin ? '総ユーザー数' : '進行中案件',
      value: isAdmin
        ? String(userStatsQuery.data?.total ?? '—')
        : String(sponsorStats?.in_progress_count ?? '—'),
      change: isAdmin
        ? `A${userStatsQuery.data?.admin_count ?? 0} / E${userStatsQuery.data?.editor_count ?? 0} / V${userStatsQuery.data?.viewer_count ?? 0}`
        : typeof sponsorStats?.monthly_revenue === 'number'
          ? `今月 ${formatSponsorAmount(sponsorStats.monthly_revenue)}`
          : '取得中',
      trend: 'up',
      icon: 'pv',
    },
  ];

  const series = (analyticsTimeseries.data ?? []).map((item) => ({
    label: item.date.slice(5),
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-gold">
            Overview
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-white">
            Dashboard
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Lombok-Japan Family チャンネル運営の全体像をひと目で把握できます。
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted backdrop-blur">
          Analytics API 連携済み
        </div>
      </div>

      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {kpiItems.map((metric) => (
          <KPICard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        <ContactTable
          items={contactsQuery.data?.items ?? []}
          isLoading={contactsQuery.isLoading}
          newCount={stats?.new_count}
        />
        <RecentPosts items={recentPosts} />
        <RecentVideos items={recentVideos} />
      </section>

      <section className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <SponsorTable
          items={sponsorStats?.recent ?? []}
          isLoading={sponsorStatsQuery.isLoading}
          inProgressCount={sponsorStats?.in_progress_count}
          monthlyRevenue={sponsorStats?.monthly_revenue}
          yearlyRevenue={sponsorStats?.yearly_revenue}
        />
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

      <section className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
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
        <SocialLinksCard items={socialLinks} />
        {isAdmin && (
          <SettingsStatusCard
            settings={settingsQuery.data}
            isLoading={settingsQuery.isLoading}
          />
        )}
        {isAdmin && (
          <UsersTable
            items={usersQuery.data?.items ?? []}
            isLoading={usersQuery.isLoading || userStatsQuery.isLoading}
            total={userStatsQuery.data?.total}
            adminCount={userStatsQuery.data?.admin_count}
            editorCount={userStatsQuery.data?.editor_count}
            viewerCount={userStatsQuery.data?.viewer_count}
          />
        )}
      </section>
    </div>
  );
}
