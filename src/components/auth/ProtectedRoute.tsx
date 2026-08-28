import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { canAccessPath } from '@/lib/rbac';

/**
 * Compatibility wrapper: auth required + role-based path access.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading, role } = useAuth();
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

  if (!canAccessPath(role, location.pathname)) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
