/** Public brand defaults (used when Settings / YouTube API are empty). */

export const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@lombokjapanfamily';

export const YOUTUBE_SUBSCRIBE_URL =
  'https://www.youtube.com/@lombokjapanfamily?sub_confirmation=1';

export const BRAND_NAME = 'Lombok-Japan Family';

export const BRAND_TAGLINE =
  '日本とインドネシアをつなぐファミリーYouTubeチャンネル';

export const BRAND_HERO_DESCRIPTION = [
  'インドネシア・ロンボク島出身の夫と日本人の妻、',
  'そして家族の日常を通じて、',
  '日本とインドネシアの文化・暮らし・食・交流を発信しています。',
].join('\n');

export const BRAND_ABOUT_TITLE = 'Lombok-Japan Familyについて';

export const BRAND_ABOUT_BODY = [
  '私たちは日本とインドネシア、',
  '二つの文化を大切にしながら生活している国際ファミリーです。',
  '',
  '家族の日常や田舎暮らし、',
  '日本とインドネシアの文化の違い、',
  '食べ物や旅、',
  '家族との交流などを動画で発信しています。',
].join('\n');

export const BRAND_SEO_TITLE =
  'Lombok-Japan Family | 日本とインドネシアをつなぐファミリーサイト';

export const BRAND_SEO_DESCRIPTION =
  '日本とインドネシアの国際ファミリーの日常、文化交流、旅行、グルメ情報を発信。';
export const BRAND_SEO_KEYWORDS = [
  'Lombok',
  'Japan',
  'Indonesia',
  '国際結婚',
  '国際家族',
  'ロンボク島',
  '日本生活',
  'インドネシア生活',
  'YouTube',
].join(', ');

/** Fallback when YouTube API / live channel stats are unavailable. */
export const CHANNEL_STATS_FALLBACK = [
  { id: 'subs', label: '登録者数', value: '313,000+' },
  { id: 'videos', label: '動画数', value: '773+' },
] as const;
