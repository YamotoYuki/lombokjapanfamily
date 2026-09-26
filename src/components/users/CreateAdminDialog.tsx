import { useEffect, useId, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@/components/ui';

export interface CreateAdminInput {
  email: string;
  password: string;
  display_name?: string;
}

interface CreateAdminDialogProps {
  open: boolean;
  submitting?: boolean;
  onSubmit: (input: CreateAdminInput) => void | Promise<void>;
  onCancel: () => void;
}

const MIN_PASSWORD_LENGTH = 8;

/**
 * Admin creation modal (matches ConfirmDialog styling). Client-side
 * validation only guards UX — the backend re-validates and enforces the
 * Admin-only permission check regardless of what this form sends.
 */
export default function CreateAdminDialog({
  open,
  submitting = false,
  onSubmit,
  onCancel,
}: CreateAdminDialogProps) {
  const { t } = useTranslation();
  const titleId = useId();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setEmail('');
      setDisplayName('');
      setPassword('');
      setConfirmPassword('');
      setFormError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (submitting) return;
      onCancel();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, submitting, onCancel]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setFormError(t('admin.users.createFieldsRequired'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setFormError(t('admin.users.createInvalidEmail'));
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(t('admin.users.createPasswordMin'));
      return;
    }
    if (password !== confirmPassword) {
      setFormError(t('admin.users.createPasswordMismatch'));
      return;
    }

    setFormError(null);
    void Promise.resolve(
      onSubmit({
        email: trimmedEmail,
        password,
        display_name: displayName.trim() || undefined,
      }),
    ).catch((err) => {
      setFormError(err instanceof Error ? err.message : t('admin.users.createFailed'));
    });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="presentation"
      onClick={() => {
        if (!submitting) onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-surface p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId} className="text-lg font-semibold text-white">
          {t('admin.users.createTitle')}
        </h3>
        <p className="mt-2 text-sm text-muted">
          {t('admin.users.createDescription')}
        </p>

        <form className="mt-4 space-y-3" onSubmit={handleSubmit}>
          <Input
            type="email"
            label={t('admin.common.email')}
            autoComplete="off"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting}
          />
          <Input
            type="text"
            label={t('admin.users.displayName')}
            autoComplete="off"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            disabled={submitting}
          />
          <Input
            type="password"
            label={t('admin.users.createPassword')}
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
          />
          <Input
            type="password"
            label={t('admin.users.createPasswordConfirm')}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={submitting}
          />

          {formError && (
            <p className="rounded-xl border border-youtube-red/40 bg-youtube-red/10 px-3 py-2 text-xs text-red-200">
              {formError}
            </p>
          )}

          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              className="w-full sm:w-auto"
              disabled={submitting}
              onClick={() => {
                if (!submitting) onCancel();
              }}
            >
              {t('admin.common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              className="w-full sm:w-auto"
              disabled={submitting}
            >
              {submitting ? t('admin.users.creating') : t('admin.users.createSubmit')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
