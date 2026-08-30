import { useTranslation } from 'react-i18next';
import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import ContactForm from '@/components/public/ContactForm';

export default function ContactSection() {
  const { t } = useTranslation();

  return (
    <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <FadeIn>
          <SectionHeading
            eyebrow={t('contact.sectionEyebrow')}
            title={t('contact.sectionTitle')}
            description={t('contact.sectionDescription')}
          />
          <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gold">
                {t('contact.emailLabel')}
              </p>
              <p className="mt-1 text-sm text-white">hello@lombokjapan.family</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gold">
                {t('contact.basedInLabel')}
              </p>
              <p className="mt-1 text-sm text-white">
                {t('contact.basedInValue')}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gold">
                {t('contact.responseLabel')}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t('contact.responseValue')}
              </p>
            </div>
          </div>
        </FadeIn>
        <FadeIn delayMs={120}>
          <ContactForm />
        </FadeIn>
      </div>
    </section>
  );
}
