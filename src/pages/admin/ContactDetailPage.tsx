import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AdminEditChrome, AdminResourceNotFound } from '@/components/admin';
import {
  ContactDetailCard,
  ContactNoteEditor,
} from '@/components/contact';
import { Button, Card, Input } from '@/components/ui';
import { useContact, useUpdateContact } from '@/hooks/useContacts';
import type { ContactPriority, ContactStatus } from '@/types/contact';

export default function ContactDetailPage() {
  const { id } = useParams();
  const contactQuery = useContact(id);
  const updateMutation = useUpdateContact();
  const [assignedTo, setAssignedTo] = useState('');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setAssignedTo(contactQuery.data?.assigned_to ?? '');
  }, [contactQuery.data?.assigned_to]);

  if (contactQuery.isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted">
        お問い合わせ詳細を読み込んでいます...
      </div>
    );
  }

  if (contactQuery.isError || !contactQuery.data || (id && contactQuery.data.id !== id)) {
    return (
      <AdminResourceNotFound
        resourceLabel="お問い合わせ"
        backTo="/admin/contact"
        detail={
          contactQuery.error instanceof Error
            ? contactQuery.error.message
            : undefined
        }
      />
    );
  }

  const contact = contactQuery.data;

  const runUpdate = async (
    input: Parameters<typeof updateMutation.mutateAsync>[0]['input'],
  ) => {
    setActionError(null);
    setActionMessage(null);
    try {
      const result = await updateMutation.mutateAsync({
        id: contact.id,
        input,
      });
      setActionMessage(result.message ?? 'ステータスを更新しました');
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'ステータス更新に失敗しました',
      );
    }
  };

  return (
    <AdminEditChrome
      eyebrow="Contact編集"
      title={contact.contact_name || contact.subject || 'お問い合わせ'}
      subtitle={contact.email}
      backTo="/admin/contact"
      message={actionMessage}
      error={actionError}
    >
      <div className="space-y-6">

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <ContactDetailCard contact={contact} />

        <div className="space-y-4">
          <Card className="space-y-4">
            <h3 className="text-sm font-semibold text-white">対応設定</h3>
            <div className="space-y-2">
              <label className="text-sm text-muted">ステータス</label>
              <select
                value={contact.status}
                onChange={(event) =>
                  void runUpdate({
                    status: event.target.value as ContactStatus,
                  })
                }
                className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="new">未対応</option>
                <option value="in_progress">対応中</option>
                <option value="completed">完了</option>
                <option value="archived">アーカイブ</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-muted">優先度</label>
              <select
                value={contact.priority}
                onChange={(event) =>
                  void runUpdate({
                    priority: event.target.value as ContactPriority,
                  })
                }
                className="w-full rounded-2xl border border-border bg-primary-bg/60 px-3 py-2.5 text-sm text-white outline-none"
              >
                <option value="low">低</option>
                <option value="normal">通常</option>
                <option value="high">高</option>
                <option value="urgent">緊急</option>
              </select>
            </div>
            <Input
              label="担当者（ユーザーID）"
              value={assignedTo}
              onChange={(event) => setAssignedTo(event.target.value)}
              placeholder="Supabase user UUID"
            />
            <Button
              type="button"
              variant="ghost"
              onClick={() =>
                void runUpdate({ assigned_to: assignedTo || undefined })
              }
            >
              担当者を保存
            </Button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => void runUpdate({ status: 'completed' })}
              >
                完了にする
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => void runUpdate({ status: 'archived' })}
              >
                アーカイブ
              </Button>
            </div>
          </Card>

          <ContactNoteEditor
            key={contact.id}
            value={contact.internal_note ?? ''}
            saving={updateMutation.isPending}
            onSave={async (note) => {
              await runUpdate({ internal_note: note });
            }}
          />
        </div>
      </div>
      </div>
    </AdminEditChrome>
  );
}
