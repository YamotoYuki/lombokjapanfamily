import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessPath } from '@/lib/rbac';

/**
 * Compatibility wrapper: auth required + role-based path access.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, role, authUnavailable, signOut } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-bg text-muted">
        ログイン確認中...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  if (role === null) {
    // Signed in, but role/status could not be confirmed. Account-level
    // denials are signed out by AuthContext (and land on the login page
    // with a reason), so reaching here means the check itself failed:
    // keep the session and ask for a reload rather than logging out.
    return (
      <div className="flex min-h-screen items-center justify-center bg-primary-bg px-4">
        <div
          role="alert"
          className="w-full max-w-md space-y-4 rounded-2xl border border-gold/30 bg-gold/10 p-6 text-center"
        >
          <p className="text-base font-semibold text-white">
            {t('admin.auth.unavailableTitle')}
          </p>
          <p className="text-sm text-muted">
            {authUnavailable ? t('admin.auth.unavailable') : t('admin.auth.roleMissing')}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="touch-target rounded-xl bg-gold/20 px-4 text-sm font-medium text-gold hover:bg-gold/30"
            >
              {t('admin.auth.reload')}
            </button>
            <button
              type="button"
              onClick={() => void signOut()}
              className="touch-target rounded-xl border border-white/10 px-4 text-sm text-muted hover:text-white"
            >
              {t('admin.logout')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!canAccessPath(role, location.pathname)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return (
    <>
      {authUnavailable ? (
        // Role already known from an earlier check; a later re-check (e.g.
        // on token refresh) failed. Keep working, but say so.
        <div
          role="status"
          className="sticky top-0 z-[70] border-b border-gold/30 bg-gold/15 px-4 py-2 text-center text-xs text-gold backdrop-blur-md"
        >
          {t('admin.auth.unavailable')}{' '}
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="underline underline-offset-2"
          >
            {t('admin.auth.reload')}
          </button>
        </div>
      ) : null}
      <Outlet />
    </>
  );
}
