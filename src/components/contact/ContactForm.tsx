import { useState, type FormEvent } from 'react';
import { LoaderCircle, Paperclip, Send } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Textarea } from '@/components/ui';
import { useSubmitContact } from '@/hooks/useContacts';
import type { ContactType } from '@/types/contact';

const TYPE_KEYS: ContactType[] = [
  'general',
  'sponsor',
  'collaboration',
  'media',
  'other',
];

export default function ContactForm() {
  const { t } = useTranslation();
  const submitMutation = useSubmitContact();
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [contactType, setContactType] = useState<ContactType>('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setCompanyName('');
    setContactName('');
    setEmail('');
    setPhone('');
    setContactType('general');
    setSubject('');
    setMessage('');
    setAttachment(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!contactName.trim()) {
      setError(t('contact.errors.contactName'));
      return;
    }
    if (!email.trim()) {
      setError(t('contact.errors.email'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('contact.errors.emailInvalid'));
      return;
    }
    if (!subject.trim()) {
      setError(t('contact.errors.subject'));
      return;
    }
    if (!message.trim()) {
      setError(t('contact.errors.message'));
      return;
    }
    if (attachment && attachment.size > 10 * 1024 * 1024) {
      setError(t('contact.errors.attachmentSize'));
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        company_name: companyName.trim() || undefined,
        contact_name: contactName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
        contact_type: contactType,
        attachment,
      });
      setSuccess(result.message);
      reset();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('contact.errors.submitFailed'),
      );
    }
  };

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={t('contact.companyName')}
          value={companyName}
          onChange={(event) => setCompanyName(event.target.value)}
          placeholder={t('contact.companyPlaceholder')}
        />
        <Input
          label={t('contact.contactName')}
          value={contactName}
          onChange={(event) => setContactName(event.target.value)}
          placeholder={t('contact.contactNamePlaceholder')}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={t('contact.email')}
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t('contact.emailPlaceholder')}
          required
        />
        <Input
          label={t('contact.phone')}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={t('contact.phonePlaceholder')}
        />
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <label className="text-sm font-medium text-muted">
          {t('contact.contactType')}
        </label>
        <select
          value={contactType}
          onChange={(event) =>
            setContactType(event.target.value as ContactType)
          }
          className="touch-input w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none focus:border-youtube-red"
        >
          {TYPE_KEYS.map((value) => (
            <option key={value} value={value}>
              {t(`contact.types.${value}`)}
            </option>
          ))}
        </select>
      </div>

      <Input
        label={t('contact.subject')}
        value={subject}
        onChange={(event) => setSubject(event.target.value)}
        placeholder={t('contact.subjectPlaceholder')}
        required
      />
      <Textarea
        label={t('contact.message')}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder={t('contact.messagePlaceholder')}
        rows={6}
        required
      />

      <div className="space-y-2">
        <label className="text-sm font-medium text-muted">
          {t('contact.attachment')}
        </label>
        <label className="touch-target flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-white/15 bg-primary-bg/40 px-4 py-3 text-sm text-muted transition-colors hover:border-gold/40 hover:text-white">
          <Paperclip size={16} />
          <span className="truncate">
            {attachment ? attachment.name : t('contact.attachment')}
          </span>
          <input
            type="file"
            className="hidden"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xlsx,.zip"
            onChange={(event) =>
              setAttachment(event.target.files?.[0] ?? null)
            }
          />
        </label>
      </div>

      {error && (
        <p className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
          {success}
        </p>
      )}

      <Button
        type="submit"
        className="w-full sm:w-auto"
        disabled={submitMutation.isPending}
      >
        {submitMutation.isPending ? (
          <LoaderCircle size={16} className="animate-spin" />
        ) : (
          <Send size={16} />
        )}
        {submitMutation.isPending
          ? t('contact.submitting')
          : t('contact.submit')}
      </Button>
    </form>
  );
}
