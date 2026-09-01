import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Input, Textarea } from '@/components/ui';
import {
  type Sponsor,
  type SponsorInput,
  type SponsorStatus,
  type SponsorType,
} from '@/types/sponsor';

interface SponsorFormProps {
  initial?: Sponsor | null;
  saving?: boolean;
  uploading?: boolean;
  onSubmit: (input: SponsorInput) => Promise<void>;
  onUploadFile?: (file: File) => Promise<string>;
  submitLabel?: string;
}

const empty: SponsorInput = {
  company_name: '',
  project_name: '',
  contact_person: '',
  contact_email: '',
  contact_phone: '',
  project_type: 'sponsor',
  status: 'proposal',
  amount: 0,
  contract_date: '',
  start_date: '',
  due_date: '',
  publish_date: '',
  youtube_url: '',
  notes: '',
  attachment_url: '',
  is_visible: true,
};

const TYPE_KEYS: SponsorType[] = [
  'sponsor',
  'collaboration',
  'advertisement',
  'media',
  'other',
];

const STATUS_KEYS: SponsorStatus[] = [
  'proposal',
  'negotiating',
  'contracted',
  'production',
  'review',
  'published',
  'completed',
  'cancelled',
];

export default function SponsorForm({
  initial,
  saving,
  uploading,
  onSubmit,
  onUploadFile,
  submitLabel,
}: SponsorFormProps) {
  const { t } = useTranslation();
  const resolvedSubmit = submitLabel ?? t('admin.common.save');
  const [form, setForm] = useState<SponsorInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!initial) {
      setForm(empty);
      return;
    }
    setForm({
      company_name: initial.company_name,
      project_name: initial.project_name,
      contact_person: initial.contact_person ?? '',
      contact_email: initial.contact_email ?? '',
      contact_phone: initial.contact_phone ?? '',
      project_type: initial.project_type,
      status: initial.status,
      amount: initial.amount,
      contract_date: initial.contract_date ?? '',
      start_date: initial.start_date ?? '',
      due_date: initial.due_date ?? '',
      publish_date: initial.publish_date ?? '',
      youtube_url: initial.youtube_url ?? '',
      notes: initial.notes ?? '',
      attachment_url: initial.attachment_url ?? '',
      is_visible: initial.is_visible,
    });
  }, [initial]);

  const setField = (field: keyof SponsorInput, value: string | number | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!form.company_name.trim()) {
      setError(t('admin.sponsors.companyRequired'));
      return;
    }
    if (!form.project_name.trim()) {
      setError(t('admin.sponsors.projectRequired'));
      return;
    }
    if (Number(form.amount) < 0) {
      setError(t('admin.sponsors.amountMin'));
      return;
    }
    try {
      await onSubmit({
        ...form,
        company_name: form.company_name.trim(),
        project_name: form.project_name.trim(),
        contact_person: form.contact_person?.trim() || undefined,
        contact_email: form.contact_email?.trim() || undefined,
        contact_phone: form.contact_phone?.trim() || undefined,
        amount: Number(form.amount),
        contract_date: form.contract_date || undefined,
        start_date: form.start_date || undefined,
        due_date: form.due_date || undefined,
        publish_date: form.publish_date || undefined,
        youtube_url: form.youtube_url?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        attachment_url: form.attachment_url?.trim() || undefined,
        is_visible: form.is_visible ?? true,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('admin.sponsors.saveFailed'),
      );
    }
  };

  return (
    <Card>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label={`${t('admin.common.companyName')} *`}
            value={form.company_name}
            onChange={(event) => setField('company_name', event.target.value)}
          />
          <Input
            label={`${t('admin.common.projectName')} *`}
            value={form.project_name}
            onChange={(event) => setField('project_name', event.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label={t('admin.common.assignee')}
            value={form.contact_person ?? ''}
            onChange={(event) => setField('contact_person', event.target.value)}
          />
          <Input
            label={t('admin.common.email')}
            type="email"
            value={form.contact_email ?? ''}
            onChange={(event) => setField('contact_email', event.target.value)}
          />
          <Input
            label={t('admin.common.phone')}
            value={form.contact_phone ?? ''}
            onChange={(event) => setField('contact_phone', event.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-muted">
              {t('admin.sponsors.projectType')} *
            </label>
            <select
              value={form.project_type}
              onChange={(event) =>
                setField('project_type', event.target.value as SponsorType)
              }
              className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
            >
              {TYPE_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`admin.sponsors.types.${key}`)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted">
              {t('admin.common.status')} *
            </label>
            <select
              value={form.status}
              onChange={(event) =>
                setField('status', event.target.value as SponsorStatus)
              }
              className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
            >
              {STATUS_KEYS.map((key) => (
                <option key={key} value={key}>
                  {t(`admin.sponsors.statuses.${key}`)}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={`${t('admin.common.amount')} *`}
            type="number"
            min={0}
            value={String(form.amount ?? 0)}
            onChange={(event) =>
              setField('amount', Number(event.target.value || 0))
            }
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Input
            label={t('admin.common.contractDate')}
            type="date"
            value={form.contract_date ?? ''}
            onChange={(event) => setField('contract_date', event.target.value)}
          />
          <Input
            label={t('admin.common.startDate')}
            type="date"
            value={form.start_date ?? ''}
            onChange={(event) => setField('start_date', event.target.value)}
          />
          <Input
            label={t('admin.common.deadline')}
            type="date"
            value={form.due_date ?? ''}
            onChange={(event) => setField('due_date', event.target.value)}
          />
          <Input
            label={t('admin.sponsors.publishDate')}
            type="date"
            value={form.publish_date ?? ''}
            onChange={(event) => setField('publish_date', event.target.value)}
          />
        </div>

        <Input
          label={t('admin.settings.youtubeUrl')}
          value={form.youtube_url ?? ''}
          onChange={(event) => setField('youtube_url', event.target.value)}
          placeholder="https://youtube.com/..."
        />

        <div className="space-y-2">
          <label className="text-sm text-muted">
            {t('admin.common.attachment')}
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading || !onUploadFile}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} />
              {uploading
                ? t('admin.common.uploading')
                : t('admin.common.selectFile')}
            </Button>
            {form.attachment_url && (
              <a
                href={form.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gold hover:underline"
              >
                {t('admin.common.viewAttachment')}
              </a>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.docx,.xlsx,.zip,.png,.jpg,.jpeg"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file || !onUploadFile) return;
              setError(null);
              try {
                const url = await onUploadFile(file);
                setField('attachment_url', url);
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : t('admin.sponsors.uploadFailed'),
                );
              }
            }}
          />
          <p className="text-xs text-muted">{t('admin.sponsors.fileHint')}</p>
        </div>

        <Textarea
          label={t('admin.common.memo')}
          value={form.notes ?? ''}
          onChange={(event) => setField('notes', event.target.value)}
          rows={5}
        />

        {error && (
          <div className="rounded-2xl border border-youtube-red/40 bg-youtube-red/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <Button type="submit" disabled={saving}>
          {saving ? t('admin.common.saving') : resolvedSubmit}
        </Button>
      </form>
    </Card>
  );
}
