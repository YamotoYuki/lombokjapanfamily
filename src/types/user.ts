export type UserRole = 'admin' | 'editor' | 'viewer';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  role: UserRole;
  status: UserStatus;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export type UserListParams = {
  keyword?: string;
  role?: UserRole;
  status?: UserStatus;
  page?: number;
  limit?: number;
};

export type UserListResponse = {
  items: User[];
  page: number;
  limit: number;
  total: number;
};

export type UserStats = {
  total: number;
  admin_count: number;
  editor_count: number;
  viewer_count: number;
};

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: 'Admin',
  editor: 'Editor',
  viewer: 'Viewer',
};

export const USER_STATUS_LABEL: Record<UserStatus, string> = {
  active: '有効',
  inactive: '無効',
  suspended: '停止',
};
