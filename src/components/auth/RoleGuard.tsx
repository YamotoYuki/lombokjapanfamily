import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types/user';

interface RoleGuardProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { hasRole } = useAuth();
  if (!hasRole(...allowedRoles)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
