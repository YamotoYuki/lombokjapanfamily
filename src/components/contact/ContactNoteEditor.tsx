import { useState } from 'react';
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
  const [note, setNote] = useState(value);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <h3 className="text-sm font-semibold text-white">内部メモ</h3>
      <Textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={5}
        placeholder="社内共有用のメモを入力"
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
              setMessage('ステータスを更新しました');
            } catch (err) {
              setError(
                err instanceof Error
                  ? err.message
                  : 'ステータス更新に失敗しました',
              );
            }
          })();
        }}
      >
        メモを保存
      </Button>
      {(message || error) && (
        <p className={error ? 'text-sm text-youtube-red' : 'text-sm text-success'}>
          {error ?? message}
        </p>
      )}
    </div>
  );
}
