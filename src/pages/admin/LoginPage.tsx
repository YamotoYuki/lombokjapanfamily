import { useEffect, useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { LanguageSwitcher } from '@/components/public';
import { Button, Card, Input } from '@/components/ui';
import { restorePublicLanguage } from '@/i18n';
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  const { signIn, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void restorePublicLanguage();
  }, []);

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? '/admin/dashboard';

  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn(email, password);

    if (result.error) {
      setSubmitting(false);
      setError(result.error);
      return;
    }

    // Keep submitting until AuthContext finishes hydrate; Navigate above will redirect.
    setSubmitting(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-primary-bg px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.12),transparent_40%)]" />

      <div className="absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <LanguageSwitcher compact />
      </div>

      <Card className="relative z-10 w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-youtube-red/15 text-youtube-red">
            <LockKeyhole size={22} />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            <span className="text-youtube-red">Lombok</span>
            <span className="text-white">-Japan </span>
            <span className="text-gold">Family</span>
          </h1>
          <p className="text-sm text-muted">{t('admin.loginTitle')}</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@example.com"
          />
          <Input
            label="Password"
            type="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <p className="rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || isLoading}
          >
            {submitting ? t('admin.signingIn') : t('admin.signIn')}
          </Button>
        </form>

        <p className="text-center text-[11px] leading-relaxed text-muted">
          {t('admin.loginSecurityHint')}
        </p>
      </Card>
    </div>
  );
}
