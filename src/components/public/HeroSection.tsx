import { Link } from 'react-router-dom';
import { ArrowRight, Play, Youtube } from 'lucide-react';
import { channelStats, YOUTUBE_CHANNEL_URL } from '@/data/publicDummy';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&h=1080&fit=crop&auto=format';

export default function HeroSection() {
  return (
    <section className="hero-viewport relative flex min-h-[70vh] items-end overflow-hidden md:min-h-[85vh] lg:min-h-screen">
      <div
        className="absolute inset-0 scale-105 bg-cover bg-center will-change-transform"
        style={{
          backgroundImage: `url(${HERO_IMAGE})`,
          animation: 'hero-pan 28s ease-in-out infinite alternate',
        }}
        role="img"
        aria-label="ビーチの風景"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-primary-bg" />
      <div className="absolute inset-0 bg-gradient-to-r from-primary-bg/80 via-transparent to-primary-bg/40" />

      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-14 pt-28 sm:px-6 sm:pb-20 sm:pt-36 lg:px-8 lg:pb-28">
        <p className="animate-fade-up text-[10px] font-medium uppercase tracking-[0.28em] text-gold sm:text-xs sm:tracking-[0.35em]">
          Lombok-Japan Family
        </p>
        <h1 className="animate-fade-up mt-4 max-w-4xl font-display text-[1.85rem] font-semibold leading-[1.2] tracking-tight text-white delay-100 sm:mt-5 sm:text-5xl sm:leading-[1.15] lg:text-6xl">
          日本とインドネシアを繋ぐ
          <br className="hidden sm:block" />
          <span className="sm:hidden"> </span>
          ファミリーチャンネル
        </h1>
        <p className="animate-fade-up mt-4 max-w-xl text-sm leading-relaxed text-white/80 delay-200 sm:mt-6 sm:text-base md:text-lg">
          家族の日常、旅行、文化交流を発信
        </p>

        <div className="animate-fade-up mt-6 flex flex-col gap-3 delay-300 xs:flex-row sm:mt-8 sm:flex-row sm:flex-wrap">
          <a
            href={YOUTUBE_CHANNEL_URL}
            target="_blank"
            rel="noreferrer"
            className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl bg-youtube-red px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-youtube-red/30 transition-all hover:-translate-y-0.5 hover:bg-red-600"
          >
            <Youtube size={18} aria-hidden />
            YouTubeを見る
          </a>
          <Link
            to="/blog"
            className="touch-target inline-flex items-center justify-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition-all hover:-translate-y-0.5 hover:border-gold/50 hover:bg-white/10"
          >
            ブログを見る
            <ArrowRight size={16} aria-hidden />
          </Link>
        </div>

        <div className="animate-fade-up mt-8 grid max-w-3xl grid-cols-3 gap-2 delay-500 sm:mt-12 sm:gap-4">
          {channelStats.map((stat) => (
            <div
              key={stat.id}
              className="rounded-2xl border border-white/10 bg-black/30 px-2 py-3 backdrop-blur-md sm:px-5 sm:py-4"
            >
              <p className="font-display text-lg font-semibold text-white sm:text-3xl">
                {stat.value}
              </p>
              <p className="mt-1 text-[10px] text-muted sm:text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        <a
          href="#popular-videos"
          className="animate-fade-up mt-8 inline-flex min-h-11 items-center gap-2 text-xs uppercase tracking-[0.24em] text-white/60 transition-colors hover:text-gold delay-700 sm:mt-10"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20">
            <Play size={12} fill="currentColor" aria-hidden />
          </span>
          Scroll
        </a>
      </div>
    </section>
  );
}
