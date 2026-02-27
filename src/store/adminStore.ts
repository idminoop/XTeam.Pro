import { create } from 'zustand';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'analyst' | 'editor' | 'author' | 'moderator';
  can_manage_audits: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  can_export_data: boolean;
  can_manage_content: boolean;
  can_read_audits: boolean;
  can_write_audits: boolean;
  can_delete_audits: boolean;
  can_read_contacts: boolean;
  can_write_contacts: boolean;
  can_delete_contacts: boolean;
  can_publish_content: boolean;
  can_manage_cases: boolean;
  skip_email_verification: boolean;
  last_login: string | null;
}

type Permission = keyof Pick<
  AdminUser,
  | 'can_manage_audits'
  | 'can_manage_users'
  | 'can_view_analytics'
  | 'can_export_data'
  | 'can_manage_content'
  | 'can_read_audits'
  | 'can_write_audits'
  | 'can_delete_audits'
  | 'can_read_contacts'
  | 'can_write_contacts'
  | 'can_delete_contacts'
  | 'can_publish_content'
  | 'can_manage_cases'
>;

const PERMISSION_FALLBACKS: Partial<Record<Permission, Permission[]>> = {
  can_read_audits: ['can_manage_audits'],
  can_write_audits: ['can_manage_audits'],
  can_delete_audits: ['can_manage_audits'],
  can_read_contacts: ['can_manage_audits'],
  can_write_contacts: ['can_manage_audits'],
  can_delete_contacts: ['can_manage_audits'],
  can_publish_content: ['can_manage_content'],
  can_manage_cases: ['can_manage_content'],
  can_manage_audits: ['can_read_audits', 'can_write_audits', 'can_delete_audits'],
  can_manage_content: ['can_publish_content', 'can_manage_cases'],
};

interface AdminStore {
  authToken: string | null;
  refreshToken: string | null;
  adminUser: AdminUser | null;
  sidebarCollapsed: boolean;
  setAuth: (token: string, refreshToken: string, user: AdminUser) => void;
  setAuthToken: (token: string) => void;
  setAdminUser: (user: AdminUser | null) => void;
  toggleSidebar: () => void;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
}

const readStoredUser = (): AdminUser | null => {
  try {
    const stored = sessionStorage.getItem('admin_user');
    return stored ? (JSON.parse(stored) as AdminUser) : null;
  } catch {
    return null;
  }
};

export const useAdminStore = create<AdminStore>((set, get) => ({
  authToken: sessionStorage.getItem('admin_token'),
  refreshToken: sessionStorage.getItem('admin_refresh_token'),
  adminUser: readStoredUser(),
  sidebarCollapsed: localStorage.getItem('admin_sidebar_collapsed') === 'true',

  setAuth: (token, refreshToken, user) => {
    sessionStorage.setItem('admin_token', token);
    sessionStorage.setItem('admin_refresh_token', refreshToken);
    sessionStorage.setItem('admin_user', JSON.stringify(user));
    set({ authToken: token, refreshToken, adminUser: user });
  },

  setAuthToken: (token) => {
    sessionStorage.setItem('admin_token', token);
    set({ authToken: token });
  },

  setAdminUser: (user) => {
    if (user) {
      sessionStorage.setItem('admin_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('admin_user');
    }
    set({ adminUser: user });
  },

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    localStorage.setItem('admin_sidebar_collapsed', String(next));
    set({ sidebarCollapsed: next });
  },

  logout: () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_refresh_token');
    sessionStorage.removeItem('admin_user');
    set({ authToken: null, refreshToken: null, adminUser: null });
  },

  hasPermission: (permission) => {
    const { adminUser } = get();
    if (!adminUser) return false;
    if (adminUser.role === 'super_admin') return true;
    if (Boolean(adminUser[permission])) return true;
    const aliases = PERMISSION_FALLBACKS[permission] ?? [];
    return aliases.some(alias => Boolean(adminUser[alias]));
  },
}));
