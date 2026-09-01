import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Textarea } from '@/components/ui';

interface ContactNoteEditorProps {
  value?: string;
  saving?: boolean;
  onSave: (note: string) => Promise<void>;
}

export default function ContactNoteEditor({
  value = '',
  saving = false,
  onSave,
}: ContactNoteEditorProps) {
  const { t } = useTranslation();
  const [note, setNote] = useState(value);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">
        {t('admin.contact.internalNote')}
      </h3>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={5}
        placeholder={t('admin.contact.notePlaceholder')}
      />
      <Button
        type="button"
        disabled={saving}
        onClick={() => {
          void (async () => {
            setError(null);
            setMessage(null);
            try {
              await onSave(note);
              setMessage(t('admin.contact.noteSaved'));
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : t('admin.common.statusUpdateFailed'),
              );
            }
          })();
        }}
      >
        {t('admin.contact.saveNote')}
      </Button>
      {(message || error) && (
        <p className={error ? 'text-sm text-youtube-red' : 'text-sm text-success'}>
          {error ?? message}
        </p>
      )}
    </div>
  );
}
