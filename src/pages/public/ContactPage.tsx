import { useTranslation } from 'react-i18next';
import { ContactForm, FadeIn, PageHero } from '@/components/public';
import { PAGE_IMAGES } from '@/data/pageImages';

export default function ContactPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHero
        eyebrow={t('contact.eyebrow')}
        title={t('contact.title')}
        description={t('contact.description')}
        backgroundImage={PAGE_IMAGES.contact}
      />
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <FadeIn>
          <ContactForm />
        </FadeIn>
      </section>
    </>
  );
}
