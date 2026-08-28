import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/** Editor or Admin */
export default function RequireEditor() {
  const { isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted">権限確認中...</div>
    );
  }

  if (!hasRole('admin', 'editor')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
