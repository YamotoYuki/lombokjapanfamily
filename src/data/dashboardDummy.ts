import type {
  AdminUserRow,
  AnalyticsPoint,
  ContactTicket,
  CountryTraffic,
  FamilyMember,
  GalleryItem,
  KpiMetric,
  PopularPage,
  RecentPostItem,
  RecentVideoItem,
  SocialLinkItem,
  SponsorDeal,
} from '@/types/dashboard';

export const kpiMetrics: KpiMetric[] = [
  {
    id: 'views',
    label: '総視聴回数',
    value: '3,245,678',
    change: '+12.5%',
    trend: 'up',
    icon: 'views',
  },
  {
    id: 'subscribers',
    label: '総登録者数',
    value: '128,450',
    change: '+4.2%',
    trend: 'up',
    icon: 'subscribers',
  },
  {
    id: 'contacts',
    label: 'お問い合わせ件数',
    value: '86',
    change: '+9.1%',
    trend: 'up',
    icon: 'contacts',
  },
  {
    id: 'pv',
    label: '今月PV',
    value: '452,310',
    change: '-1.8%',
    trend: 'down',
    icon: 'pv',
  },
];

export const recentContacts: ContactTicket[] = [
  {
    id: 'c1',
    companyName: 'Sakura Travel Co.',
    contactName: '田中 美咲',
    subject: 'コラボ企画のご相談',
    status: 'new',
    createdAt: '2026-03-14',
  },
  {
    id: 'c2',
    companyName: 'Bali Resort Group',
    contactName: 'James Wong',
    subject: 'スポンサーシップ提案',
    status: 'in_progress',
    createdAt: '2026-03-13',
  },
  {
    id: 'c3',
    companyName: 'Nippon Foods',
    contactName: '佐藤 健',
    subject: '商品レビュー依頼',
    status: 'completed',
    createdAt: '2026-03-11',
  },
  {
    id: 'c4',
    companyName: 'Ocean Dive Club',
    contactName: 'Putri Ayu',
    subject: '撮影ロケ協力',
    status: 'new',
    createdAt: '2026-03-10',
  },
];

export const recentPosts: RecentPostItem[] = [
  {
    id: 'p1',
    title: 'ロンボク島で見つけた家族の休日',
    publishedAt: '2026-03-12',
    category: 'Lifestyle',
  },
  {
    id: 'p2',
    title: '日本食材で作るバリ風朝食レシピ',
    publishedAt: '2026-03-08',
    category: 'Food',
  },
  {
    id: 'p3',
    title: 'チャンネル登録者10万人達成レポート',
    publishedAt: '2026-03-01',
    category: 'News',
  },
  {
    id: 'p4',
    title: '撮影裏側：夕陽タイムラプスの作り方',
    publishedAt: '2026-02-22',
    category: 'Production',
  },
];

export const recentVideos: RecentVideoItem[] = [
  {
    id: 'v1',
    title: 'Family Trip to Gili Islands',
    publishedAt: '2026-03-14',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=320&h=180&fit=crop',
    views: '128K',
  },
  {
    id: 'v2',
    title: 'Japanese Breakfast in Lombok',
    publishedAt: '2026-03-09',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=320&h=180&fit=crop',
    views: '94K',
  },
  {
    id: 'v3',
    title: 'Sunset Cinematic Vlog',
    publishedAt: '2026-03-03',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=320&h=180&fit=crop',
    views: '210K',
  },
];

export const sponsorDeals: SponsorDeal[] = [
  {
    id: 's1',
    companyName: 'AquaPure',
    projectName: '夏の水分補給キャンペーン',
    amount: '¥1,200,000',
    status: 'production',
    youtubeUrl: 'https://youtube.com/watch?v=demo1',
  },
  {
    id: 's2',
    companyName: 'Island Stay',
    projectName: 'ヴィラ宿泊タイアップ',
    amount: '¥850,000',
    status: 'contracted',
    youtubeUrl: 'https://youtube.com/watch?v=demo2',
  },
  {
    id: 's3',
    companyName: 'Nippon Motors',
    projectName: 'ファミリーカー紹介',
    amount: '¥2,400,000',
    status: 'published',
    youtubeUrl: 'https://youtube.com/watch?v=demo3',
  },
  {
    id: 's4',
    companyName: 'Taste Bali',
    projectName: '調味料PR企画',
    amount: '¥480,000',
    status: 'proposal',
    youtubeUrl: 'https://youtube.com/watch?v=demo4',
  },
];

export const analyticsSeries: AnalyticsPoint[] = [
  { label: 'Mon', pv: 18200, uu: 9400 },
  { label: 'Tue', pv: 22100, uu: 11200 },
  { label: 'Wed', pv: 19800, uu: 10100 },
  { label: 'Thu', pv: 25400, uu: 13100 },
  { label: 'Fri', pv: 27600, uu: 14200 },
  { label: 'Sat', pv: 31200, uu: 16800 },
  { label: 'Sun', pv: 29800, uu: 15900 },
];

export const popularPages: PopularPage[] = [
  { path: '/videos', views: 48200 },
  { path: '/blog', views: 31500 },
  { path: '/gallery', views: 22100 },
  { path: '/contact', views: 12800 },
];

export const countryTraffic: CountryTraffic[] = [
  { country: 'Japan', value: 48 },
  { country: 'Indonesia', value: 27 },
  { country: 'Singapore', value: 12 },
  { country: 'Other', value: 13 },
];

export const familyMembers: FamilyMember[] = [
  {
    id: 'f1',
    name: 'Tomoaki',
    role: 'Father / Creator',
    bio: 'チャンネル企画・撮影・編集を担当。旅と食が好き。',
    photoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
  },
  {
    id: 'f2',
    name: 'Yuki',
    role: 'Mother / Host',
    bio: 'ファミリーシーンの演出と現地文化の紹介を担当。',
    photoUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
  },
  {
    id: 'f3',
    name: 'Hana',
    role: 'Daughter',
    bio: 'ロケ出演とショート動画のアイデア担当。',
    photoUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  },
  {
    id: 'f4',
    name: 'Sora',
    role: 'Son',
    bio: '冒険ロケのムードメーカー。海が大好き。',
    photoUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  },
];

export const galleryItems: GalleryItem[] = [
  {
    id: 'g1',
    title: 'Gili Sunset',
    category: 'Travel',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop',
  },
  {
    id: 'g2',
    title: 'Family Breakfast',
    category: 'Food',
    imageUrl:
      'https://images.unsplash.com/photo-1496412705860-fb6f76913ec6?w=400&h=300&fit=crop',
  },
  {
    id: 'g3',
    title: 'Behind the Scenes',
    category: 'Production',
    imageUrl:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=400&h=300&fit=crop',
  },
  {
    id: 'g4',
    title: 'Temple Visit',
    category: 'Culture',
    imageUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab0?w=400&h=300&fit=crop',
  },
  {
    id: 'g5',
    title: 'Ocean Day',
    category: 'Travel',
    imageUrl:
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=400&h=300&fit=crop',
  },
  {
    id: 'g6',
    title: 'Studio Setup',
    category: 'Production',
    imageUrl:
      'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=300&fit=crop',
  },
];

export const socialLinks: SocialLinkItem[] = [
  {
    id: 'sn1',
    platform: 'Instagram',
    handle: '@lombokjapanfamily',
    url: 'https://instagram.com',
    followers: '86.2K',
  },
  {
    id: 'sn2',
    platform: 'TikTok',
    handle: '@ljfamily',
    url: 'https://tiktok.com',
    followers: '112K',
  },
  {
    id: 'sn3',
    platform: 'Facebook',
    handle: 'Lombok-Japan Family',
    url: 'https://facebook.com',
    followers: '24.8K',
  },
  {
    id: 'sn4',
    platform: 'X',
    handle: '@LJFamily',
    url: 'https://x.com',
    followers: '18.4K',
  },
];

export const adminUsers: AdminUserRow[] = [
  {
    id: 'u1',
    name: 'Admin Owner',
    email: 'admin@lombokjapan.family',
    role: 'admin',
    status: 'active',
    lastLogin: '2026-03-15 09:12',
  },
  {
    id: 'u2',
    name: 'Content Editor',
    email: 'editor@lombokjapan.family',
    role: 'editor',
    status: 'active',
    lastLogin: '2026-03-14 18:40',
  },
  {
    id: 'u3',
    name: 'Analytics Viewer',
    email: 'viewer@lombokjapan.family',
    role: 'viewer',
    status: 'invited',
    lastLogin: '—',
  },
  {
    id: 'u4',
    name: 'Legacy Staff',
    email: 'legacy@lombokjapan.family',
    role: 'editor',
    status: 'disabled',
    lastLogin: '2025-12-02 11:05',
  },
];
