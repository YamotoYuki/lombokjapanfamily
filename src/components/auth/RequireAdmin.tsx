import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function RequireAdmin() {
  const { isLoading, hasRole } = useAuth();

  if (isLoading) {
    return (
      <div className="py-20 text-center text-sm text-muted">権限確認中...</div>
    );
  }

  if (!hasRole('admin')) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <Outlet />;
}
