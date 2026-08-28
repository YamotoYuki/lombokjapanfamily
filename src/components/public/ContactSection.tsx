import FadeIn from '@/components/public/FadeIn';
import SectionHeading from '@/components/public/SectionHeading';
import ContactForm from '@/components/public/ContactForm';

export default function ContactSection() {
  return (
    <section id="contact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
        <FadeIn>
          <SectionHeading
            eyebrow="Connect"
            title="Contact Us"
            description="コラボレーション、スポンサーシップ、取材のご依頼はこちらから。"
          />
          <div className="mt-8 space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div>
              <p className="text-xs uppercase tracking-wide text-gold">Email</p>
              <p className="mt-1 text-sm text-white">hello@lombokjapan.family</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gold">Based in</p>
              <p className="mt-1 text-sm text-white">Japan × Lombok, Indonesia</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gold">Response</p>
              <p className="mt-1 text-sm text-muted">通常2〜3営業日以内にご連絡します</p>
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
