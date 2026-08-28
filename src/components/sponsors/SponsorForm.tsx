import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Button, Card, Input, Textarea } from '@/components/ui';
import {
  SPONSOR_STATUS_LABEL,
  SPONSOR_TYPE_LABEL,
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

export default function SponsorForm({
  initial,
  saving,
  uploading,
  onSubmit,
  onUploadFile,
  submitLabel = '保存する',
}: SponsorFormProps) {
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
      setError('会社名を入力してください');
      return;
    }
    if (!form.project_name.trim()) {
      setError('案件名を入力してください');
      return;
    }
    if (Number(form.amount) < 0) {
      setError('金額は0以上で入力してください');
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
      setError(err instanceof Error ? err.message : '案件の保存に失敗しました');
    }
  };

  return (
    <Card>
      <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="会社名 *"
            value={form.company_name}
            onChange={(event) => setField('company_name', event.target.value)}
          />
          <Input
            label="案件名 *"
            value={form.project_name}
            onChange={(event) => setField('project_name', event.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Input
            label="担当者"
            value={form.contact_person ?? ''}
            onChange={(event) => setField('contact_person', event.target.value)}
          />
          <Input
            label="メール"
            type="email"
            value={form.contact_email ?? ''}
            onChange={(event) => setField('contact_email', event.target.value)}
          />
          <Input
            label="電話番号"
            value={form.contact_phone ?? ''}
            onChange={(event) => setField('contact_phone', event.target.value)}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm text-muted">案件種別 *</label>
            <select
              value={form.project_type}
              onChange={(event) =>
                setField('project_type', event.target.value as SponsorType)
              }
              className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
            >
              {(Object.keys(SPONSOR_TYPE_LABEL) as SponsorType[]).map((key) => (
                <option key={key} value={key}>
                  {SPONSOR_TYPE_LABEL[key]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-muted">状態 *</label>
            <select
              value={form.status}
              onChange={(event) =>
                setField('status', event.target.value as SponsorStatus)
              }
              className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
            >
              {(Object.keys(SPONSOR_STATUS_LABEL) as SponsorStatus[]).map(
                (key) => (
                  <option key={key} value={key}>
                    {SPONSOR_STATUS_LABEL[key]}
                  </option>
                ),
              )}
            </select>
          </div>
          <Input
            label="金額 *"
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
            label="契約日"
            type="date"
            value={form.contract_date ?? ''}
            onChange={(event) => setField('contract_date', event.target.value)}
          />
          <Input
            label="開始日"
            type="date"
            value={form.start_date ?? ''}
            onChange={(event) => setField('start_date', event.target.value)}
          />
          <Input
            label="締切"
            type="date"
            value={form.due_date ?? ''}
            onChange={(event) => setField('due_date', event.target.value)}
          />
          <Input
            label="公開日"
            type="date"
            value={form.publish_date ?? ''}
            onChange={(event) => setField('publish_date', event.target.value)}
          />
        </div>

        <Input
          label="YouTube URL"
          value={form.youtube_url ?? ''}
          onChange={(event) => setField('youtube_url', event.target.value)}
          placeholder="https://youtube.com/..."
        />

        <div className="space-y-2">
          <label className="text-sm text-muted">添付ファイル</label>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={uploading || !onUploadFile}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={14} />
              {uploading ? 'アップロード中...' : 'ファイルを選択'}
            </Button>
            {form.attachment_url && (
              <a
                href={form.attachment_url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-gold hover:underline"
              >
                添付ファイルを確認
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
                    : '添付ファイルのアップロードに失敗しました',
                );
              }
            }}
          />
          <p className="text-xs text-muted">
            pdf / docx / xlsx / zip / png / jpg ・ 20MB以下
          </p>
        </div>

        <Textarea
          label="メモ"
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
          {saving ? '保存中...' : submitLabel}
        </Button>
      </form>
    </Card>
  );
}
