import { useTranslation } from 'react-i18next';
import { ContactForm, FadeIn, PageHero } from '@/components/public';

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        eyebrow={t('contact.eyebrow')}
        title={t('contact.title')}
        description={t('contact.description')}
        backgroundImage="https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=1600&h=900&fit=crop"
      />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <FadeIn>
          <ContactForm />
        </FadeIn>
      </section>
    </>
  );
}
