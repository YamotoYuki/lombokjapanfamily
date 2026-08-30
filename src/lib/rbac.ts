import type { UserRole } from '@/types/user';

export const ADMIN_ONLY_PATHS = ['/admin/users', '/admin/settings'] as const;

export const VIEWER_ALLOWED_PATHS = [
  '/admin',
  '/admin/dashboard',
  '/admin/analytics',
] as const;

export function canAccessPath(role: UserRole | null | undefined, path: string) {
  // Align with backend: missing role behaves as viewer (avoids redirect loops).
  const effective: UserRole = role ?? 'viewer';
  if (effective === 'admin') return true;

  const normalized = path.replace(/\/$/, '') || '/admin';

  if (effective === 'viewer') {
    return VIEWER_ALLOWED_PATHS.some(
      (allowed) =>
        normalized === allowed || normalized.startsWith(`${allowed}/`),
    );
  }

  // editor
  return !ADMIN_ONLY_PATHS.some(
    (blocked) =>
      normalized === blocked || normalized.startsWith(`${blocked}/`),
  );
}

export function canWrite(role: UserRole | null | undefined) {
  return role === 'admin' || role === 'editor';
}

export function sidebarAllowed(role: UserRole | null | undefined, to: string) {
  return canAccessPath(role, to);
}
