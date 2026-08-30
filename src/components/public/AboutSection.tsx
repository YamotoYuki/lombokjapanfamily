import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import { YOUTUBE_CHANNEL_URL } from '@/data/brand';

interface AboutSectionProps {
  youtubeUrl?: string | null;
}

export default function AboutSection({
  youtubeUrl = YOUTUBE_CHANNEL_URL,
}: AboutSectionProps) {
  const { t } = useTranslation();
  const channelUrl = youtubeUrl || YOUTUBE_CHANNEL_URL;
  const paragraphs = t('about.body').split('\n\n');

  return (
    <section
      id="about"
      className="relative overflow-hidden border-y border-white/5 bg-[#0d1524] py-20 lg:py-28"
    >
      <div className="pointer-events-none absolute -right-24 top-0 h-72 w-72 rounded-full bg-gold/10 blur-3xl" />
      <div className="pointer-events-none absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-youtube-red/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
          <FadeIn>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold sm:text-xs">
              {t('about.eyebrow')}
            </p>
            <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              {t('about.title')}
            </h2>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-white/75 sm:text-base">
              {paragraphs.map((paragraph) => (
                <p key={paragraph} className="whitespace-pre-line">
                  {paragraph}
                </p>
              ))}
            </div>
            <a
              href={channelUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-gold transition-colors hover:text-amber-300"
            >
              {t('about.watchChannel')}
            </a>
          </FadeIn>

          <FadeIn delayMs={120}>
            <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-youtube-red/20 via-white/[0.04] to-gold/10 p-8 sm:p-10">
              <p className="text-xs uppercase tracking-[0.24em] text-gold">
                {t('about.storyEyebrow')}
              </p>
              <p className="mt-4 font-display text-2xl font-semibold leading-snug text-white sm:text-3xl">
                {t('about.storyTitle')}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/70">
                {t('about.storyBody')}
              </p>
              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                    {t('about.fromLabel')}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">
                    Lombok, Indonesia
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted">
                    {t('about.livingLabel')}
                  </p>
                  <p className="mt-2 text-sm font-medium text-white">Japan</p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
