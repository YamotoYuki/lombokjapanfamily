import type {
  ChannelStat,
  PublicBlogPost,
  PublicFamilyMember,
  PublicGalleryItem,
  PublicSponsor,
  PublicVideo,
} from '@/types/public';

export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@lombokjapanfamily';

export const channelStats: ChannelStat[] = [
  { id: 'subs', label: '登録者', value: '30万+' },
  { id: 'views', label: '累計再生数', value: '4,800万' },
  { id: 'videos', label: '動画本数', value: '420+' },
];

export const popularVideos: PublicVideo[] = [
  {
    id: 'pv1',
    title: 'Gili Islands Family Adventure',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=450&fit=crop',
    views: '128.2万回',
    publishedAt: '2026-03-10',
    duration: '14:28',
    youtubeUrl: YOUTUBE_CHANNEL_URL,
  },
  {
    id: 'pv2',
    title: '日本食材で作るバリ風朝食',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=800&h=450&fit=crop',
    views: '94.5万回',
    publishedAt: '2026-03-02',
    duration: '11:05',
    youtubeUrl: YOUTUBE_CHANNEL_URL,
  },
  {
    id: 'pv3',
    title: 'Lombok Sunset Cinematic Vlog',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=450&fit=crop',
    views: '210万回',
    publishedAt: '2026-02-21',
    duration: '18:42',
    youtubeUrl: YOUTUBE_CHANNEL_URL,
  },
  {
    id: 'pv4',
    title: 'Temple Visit with Kids',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab0?w=800&h=450&fit=crop',
    views: '76.8万回',
    publishedAt: '2026-02-14',
    duration: '12:17',
    youtubeUrl: YOUTUBE_CHANNEL_URL,
  },
  {
    id: 'pv5',
    title: 'Family Day at the Beach',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=800&h=450&fit=crop',
    views: '132万回',
    publishedAt: '2026-02-05',
    duration: '15:33',
    youtubeUrl: YOUTUBE_CHANNEL_URL,
  },
  {
    id: 'pv6',
    title: 'Behind the Scenes: 撮影の裏側',
    thumbnailUrl:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=450&fit=crop',
    views: '58.1万回',
    publishedAt: '2026-01-28',
    duration: '09:56',
    youtubeUrl: YOUTUBE_CHANNEL_URL,
  },
];

export const familyMembers: PublicFamilyMember[] = [
  {
    id: 'fm1',
    name: 'Tomoaki',
    role: 'Father / Creator',
    bio: '企画・撮影・編集を担当。日本とロンボクの日常を映像でつなぎます。',
    photoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=480&h=480&fit=crop',
    instagram: 'https://instagram.com',
    youtube: YOUTUBE_CHANNEL_URL,
  },
  {
    id: 'fm2',
    name: 'Yuki',
    role: 'Mother / Host',
    bio: 'ファミリーシーンの演出と、食・文化の紹介を担当しています。',
    photoUrl:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=480&h=480&fit=crop',
    instagram: 'https://instagram.com',
    youtube: YOUTUBE_CHANNEL_URL,
  },
  {
    id: 'fm3',
    name: 'Hana',
    role: 'Daughter',
    bio: 'ロケ出演とショート動画のアイデア係。笑顔で旅を盛り上げます。',
    photoUrl:
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=480&h=480&fit=crop',
    instagram: 'https://instagram.com',
  },
  {
    id: 'fm4',
    name: 'Sora',
    role: 'Son',
    bio: '海と冒険が大好き。ファミリー旅行のムードメーカーです。',
    photoUrl:
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=480&h=480&fit=crop',
    youtube: YOUTUBE_CHANNEL_URL,
  },
];

export const latestArticles: PublicBlogPost[] = [
  {
    id: 'ba1',
    title: 'ロンボク島で見つけた家族の休日',
    excerpt:
      '静かなビーチと温かい人々に囲まれた、私たちの新しい日常の始まり。',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=520&fit=crop',
    publishedAt: '2026-03-12',
    category: 'Lifestyle',
  },
  {
    id: 'ba2',
    title: '日本食材で作るバリ風朝食レシピ',
    excerpt: 'スーパーで買える材料だけで、家庭でも再現できる朝食アイデア。',
    imageUrl:
      'https://images.unsplash.com/photo-1496412705860-fb6f76913ec6?w=800&h=520&fit=crop',
    publishedAt: '2026-03-08',
    category: 'Food',
  },
  {
    id: 'ba3',
    title: 'チャンネル登録者30万人達成レポート',
    excerpt: '応援してくださったみなさまへの感謝と、これからの展望をまとめました。',
    imageUrl:
      'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=520&fit=crop',
    publishedAt: '2026-03-01',
    category: 'News',
  },
  {
    id: 'ba4',
    title: '撮影裏側：夕陽タイムラプスの作り方',
    excerpt: '機材・構図・編集のポイントを、実際のロケをもとに解説します。',
    imageUrl:
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=520&fit=crop',
    publishedAt: '2026-02-22',
    category: 'Production',
  },
  {
    id: 'ba5',
    title: '子どもと楽しむインドネシア文化体験',
    excerpt: '寺院見学からダンス体験まで、家族で学べるアクティビティ紹介。',
    imageUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab0?w=800&h=520&fit=crop',
    publishedAt: '2026-02-15',
    category: 'Culture',
  },
  {
    id: 'ba6',
    title: '東京とロンボク、ふたつの拠点生活',
    excerpt: '行き来する家族だからこそ見えてきた、両国の魅力と工夫。',
    imageUrl:
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=520&fit=crop',
    publishedAt: '2026-02-08',
    category: 'Lifestyle',
  },
];

export const galleryItems: PublicGalleryItem[] = [
  {
    id: 'pg1',
    title: 'Gili Sunset',
    category: '旅行',
    imageUrl:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=900&h=700&fit=crop',
  },
  {
    id: 'pg2',
    title: 'Morning Kitchen',
    category: '日常',
    imageUrl:
      'https://images.unsplash.com/photo-1496412705860-fb6f76913ec6?w=900&h=700&fit=crop',
  },
  {
    id: 'pg3',
    title: 'Channel Event',
    category: 'イベント',
    imageUrl:
      'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=900&h=700&fit=crop',
  },
  {
    id: 'pg4',
    title: 'Kids at Beach',
    category: '子供',
    imageUrl:
      'https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=900&h=700&fit=crop',
  },
  {
    id: 'pg5',
    title: 'Bali Temple',
    category: 'インドネシア',
    imageUrl:
      'https://images.unsplash.com/photo-1537996194471-e657df975ab0?w=900&h=700&fit=crop',
  },
  {
    id: 'pg6',
    title: 'Tokyo Night',
    category: '日本',
    imageUrl:
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=900&h=700&fit=crop',
  },
  {
    id: 'pg7',
    title: 'Island Road Trip',
    category: '旅行',
    imageUrl:
      'https://images.unsplash.com/photo-1505142468610-359e7d316be0?w=900&h=700&fit=crop',
  },
  {
    id: 'pg8',
    title: 'Family Dinner',
    category: '日常',
    imageUrl:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=900&h=700&fit=crop',
  },
];

export const sponsors: PublicSponsor[] = [
  {
    id: 'sp1',
    name: 'AquaPure',
    logoLabel: 'AquaPure',
    description: '夏の水分補給キャンペーンを共同制作',
    website: '#',
  },
  {
    id: 'sp2',
    name: 'Island Stay',
    logoLabel: 'Island Stay',
    description: 'ヴィラ宿泊タイアップパートナー',
    website: '#',
  },
  {
    id: 'sp3',
    name: 'Nippon Motors',
    logoLabel: 'Nippon Motors',
    description: 'ファミリーカー紹介シリーズ',
    website: '#',
  },
  {
    id: 'sp4',
    name: 'Taste Bali',
    logoLabel: 'Taste Bali',
    description: '調味料・食文化コラボ',
    website: '#',
  },
  {
    id: 'sp5',
    name: 'Ocean Dive',
    logoLabel: 'Ocean Dive',
    description: '海洋アクティビティ協力',
    website: '#',
  },
  {
    id: 'sp6',
    name: 'Sakura Travel',
    logoLabel: 'Sakura Travel',
    description: '日印ファミリーツアー企画',
    website: '#',
  },
];
