import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Edit2,
  Key,
  Lock,
  RefreshCw,
  ShieldPlus,
  Trash2,
  Unlock,
  UserPlus,
  X,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { adminApiCall, adminApiJson } from '@/utils/adminApi';
import TableSkeleton from '@/components/admin/TableSkeleton';
import EmptyState from '@/components/admin/EmptyState';

type RoleValue = 'super_admin' | 'admin' | 'analyst' | 'editor' | 'author' | 'moderator';
type PermissionKey =
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
  | 'skip_email_verification';

type PermissionState = Record<PermissionKey, boolean>;

interface AdminUserItem extends PermissionState {
  id: number;
  username: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: RoleValue;
  is_active: boolean;
  is_verified: boolean;
  last_login: string | null;
  created_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
}

interface RoleTemplateItem extends PermissionState {
  id: number;
  name: string;
  description: string | null;
  role: RoleValue;
  is_system: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const ROLE_CONFIG: Record<RoleValue, { label: string; cls: string }> = {
  super_admin: { label: 'Super Admin', cls: 'bg-red-100 text-red-700' },
  admin: { label: 'Admin', cls: 'bg-blue-100 text-blue-700' },
  analyst: { label: 'Analyst', cls: 'bg-gray-100 text-gray-700' },
  editor: { label: 'Editor', cls: 'bg-emerald-100 text-emerald-700' },
  author: { label: 'Author', cls: 'bg-indigo-100 text-indigo-700' },
  moderator: { label: 'Moderator', cls: 'bg-amber-100 text-amber-700' },
};

const ROLE_OPTIONS: Array<{ value: RoleValue; label: string }> = [
  { value: 'analyst', label: 'Analyst' },
  { value: 'author', label: 'Author' },
  { value: 'editor', label: 'Editor' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

const PERMISSIONS: Array<{ key: PermissionKey; label: string }> = [
  { key: 'can_manage_users', label: 'Manage Users' },
  { key: 'can_view_analytics', label: 'View Analytics' },
  { key: 'can_export_data', label: 'Export Data' },
  { key: 'can_manage_audits', label: 'Legacy: Manage Audits' },
  { key: 'can_manage_content', label: 'Legacy: Manage Content' },
  { key: 'can_read_audits', label: 'Read Audits' },
  { key: 'can_write_audits', label: 'Write Audits' },
  { key: 'can_delete_audits', label: 'Delete Audits' },
  { key: 'can_read_contacts', label: 'Read Contacts' },
  { key: 'can_write_contacts', label: 'Write Contacts' },
  { key: 'can_delete_contacts', label: 'Delete Contacts' },
  { key: 'can_publish_content', label: 'Publish Content' },
  { key: 'can_manage_cases', label: 'Manage Cases' },
  { key: 'skip_email_verification', label: 'Skip Email Verification' },
];

const DEFAULT_PERMISSIONS: PermissionState = {
  can_manage_audits: true,
  can_manage_users: false,
  can_view_analytics: true,
  can_export_data: true,
  can_manage_content: false,
  can_read_audits: true,
  can_write_audits: true,
  can_delete_audits: false,
  can_read_contacts: true,
  can_write_contacts: true,
  can_delete_contacts: false,
  can_publish_content: false,
  can_manage_cases: false,
  skip_email_verification: false,
};

const EMPTY_ROLE_TEMPLATE: Omit<RoleTemplateItem, 'id' | 'created_at' | 'updated_at'> = {
  name: '',
  description: '',
  role: 'admin',
  is_system: false,
  ...DEFAULT_PERMISSIONS,
};

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

function Modal({ title, onClose, children }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function permissionCount(item: PermissionState) {
  return PERMISSIONS.filter(permission => item[permission.key]).length;
}

function PermissionGrid({
  values,
  onChange,
}: {
  values: PermissionState;
  onChange: (permission: PermissionKey, value: boolean) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {PERMISSIONS.map(permission => (
        <label key={permission.key} className="flex cursor-pointer items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={values[permission.key]}
            onChange={event => onChange(permission.key, event.target.checked)}
            className="rounded"
          />
          <span className="text-gray-700">{permission.label}</span>
        </label>
      ))}
    </div>
  );
}

export default function AdminUsers() {
  const authToken = useAdminStore(state => state.authToken);
  const me = useAdminStore(state => state.adminUser);
  const isSuperAdmin = me?.role === 'super_admin';

  const [tab, setTab] = useState<'users' | 'roles'>('users');
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplateItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [passwordUser, setPasswordUser] = useState<AdminUserItem | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [unlockingUserId, setUnlockingUserId] = useState<number | null>(null);

  const [createRoleModal, setCreateRoleModal] = useState(false);
  const [editRoleTemplate, setEditRoleTemplate] = useState<RoleTemplateItem | null>(null);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const data = await adminApiJson<AdminUserItem[]>('/api/admin/users', authToken);
      setUsers(data);
    } finally {
      setLoadingUsers(false);
    }
  }, [authToken]);

  const fetchRoleTemplates = useCallback(async () => {
    setLoadingRoles(true);
    try {
      const data = await adminApiJson<RoleTemplateItem[]>('/api/admin/roles', authToken);
      setRoleTemplates(data);
    } finally {
      setLoadingRoles(false);
    }
  }, [authToken]);

  useEffect(() => {
    fetchUsers();
    fetchRoleTemplates();
  }, [fetchUsers, fetchRoleTemplates]);

  const handleDeleteUser = async (user: AdminUserItem) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    setDeletingUserId(user.id);
    try {
      await adminApiCall(`/api/admin/users/${user.id}`, authToken, { method: 'DELETE' });
      await fetchUsers();
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleUnlockUser = async (user: AdminUserItem) => {
    setUnlockingUserId(user.id);
    try {
      await adminApiCall(`/api/admin/users/${user.id}/unlock`, authToken, { method: 'PATCH' });
      await fetchUsers();
    } finally {
      setUnlockingUserId(null);
    }
  };

  const handleDeleteRoleTemplate = async (template: RoleTemplateItem) => {
    if (!confirm(`Delete role template "${template.name}"?`)) return;
    setDeletingRoleId(template.id);
    try {
      await adminApiCall(`/api/admin/roles/${template.id}`, authToken, { method: 'DELETE' });
      await fetchRoleTemplates();
    } finally {
      setDeletingRoleId(null);
    }
  };

  const isLocked = (user: AdminUserItem) => Boolean(user.locked_until && new Date(user.locked_until) > new Date());
  const userTitle = useMemo(() => `${users.length} admin users`, [users.length]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users & Roles</h1>
          <p className="mt-0.5 text-sm text-gray-500">{tab === 'users' ? userTitle : `${roleTemplates.length} role templates`}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (tab === 'users') fetchUsers();
              else fetchRoleTemplates();
            }}
            title="Refresh"
            className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
          {isSuperAdmin && tab === 'users' && (
            <button
              onClick={() => setShowCreateUser(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              <UserPlus className="h-4 w-4" />
              Add User
            </button>
          )}
          {isSuperAdmin && tab === 'roles' && (
            <button
              onClick={() => setCreateRoleModal(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <ShieldPlus className="h-4 w-4" />
              Add Role
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setTab('users')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === 'users' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Users
          </button>
          <button
            onClick={() => setTab('roles')}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${tab === 'roles' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            Roles
          </button>
        </div>
      </div>

      {tab === 'users' ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {loadingUsers ? (
            <TableSkeleton columns={6} rows={6} className="border-0 rounded-none" />
          ) : users.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No users found" description="Create your first admin user." icon={UserPlus} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Last Login</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(user => {
                    const roleConfig = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.admin;
                    const locked = isLocked(user);
                    return (
                      <tr key={user.id} className="transition-colors hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {user.first_name.charAt(0)}
                              {user.last_name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{user.full_name}</div>
                              <div className="text-xs text-gray-400">{user.email}</div>
                              <div className="text-xs text-gray-400">@{user.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`rounded-full px-2 py-1 text-xs font-medium ${roleConfig.cls}`}>{roleConfig.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="mb-1 text-xs text-gray-500">{permissionCount(user)} permissions</div>
                          <div className="flex flex-wrap gap-1">
                            {PERMISSIONS.filter(permission => user[permission.key]).slice(0, 6).map(permission => (
                              <span key={permission.key} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                {permission.label}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                              {user.is_active ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                            {locked && (
                              <span className="inline-flex items-center gap-1 text-xs text-red-600">
                                <Lock className="h-3 w-3" />
                                Locked
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            {locked && isSuperAdmin && (
                              <button
                                onClick={() => handleUnlockUser(user)}
                                disabled={unlockingUserId === user.id}
                                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                                title="Unlock account"
                              >
                                <Unlock className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => setPasswordUser(user)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-yellow-50 hover:text-yellow-600"
                              title="Reset password"
                            >
                              <Key className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditUser(user)}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                              title="Edit user"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {isSuperAdmin && String(user.id) !== me?.id && (
                              <button
                                onClick={() => handleDeleteUser(user)}
                                disabled={deletingUserId === user.id}
                                className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          {loadingRoles ? (
            <TableSkeleton columns={5} rows={4} className="border-0 rounded-none" />
          ) : roleTemplates.length === 0 ? (
            <div className="p-6">
              <EmptyState title="No role templates found" description="Create a role template to reuse permission sets." icon={ShieldPlus} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roleTemplates.map(template => (
                    <tr key={template.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">{template.name}</div>
                        {template.description && <div className="text-xs text-gray-500">{template.description}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${(ROLE_CONFIG[template.role] ?? ROLE_CONFIG.admin).cls}`}>
                          {(ROLE_CONFIG[template.role] ?? ROLE_CONFIG.admin).label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{permissionCount(template)} enabled</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-1 text-xs font-medium ${template.is_system ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                          {template.is_system ? 'System' : 'Custom'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setEditRoleTemplate(template)}
                            className="rounded p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                            title="Edit role"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          {!template.is_system && isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteRoleTemplate(template)}
                              disabled={deletingRoleId === template.id}
                              className="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Delete role"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showCreateUser && (
        <CreateUserModal
          authToken={authToken}
          roleTemplates={roleTemplates}
          onClose={() => setShowCreateUser(false)}
          onSuccess={async () => {
            setShowCreateUser(false);
            await fetchUsers();
          }}
        />
      )}

      {editUser && (
        <EditUserModal
          user={editUser}
          authToken={authToken}
          isSuperAdmin={isSuperAdmin}
          roleTemplates={roleTemplates}
          onClose={() => setEditUser(null)}
          onSuccess={async () => {
            setEditUser(null);
            await fetchUsers();
          }}
        />
      )}

      {passwordUser && (
        <PasswordModal
          user={passwordUser}
          authToken={authToken}
          onClose={() => setPasswordUser(null)}
          onSuccess={() => setPasswordUser(null)}
        />
      )}

      {createRoleModal && (
        <RoleTemplateModal
          authToken={authToken}
          mode="create"
          onClose={() => setCreateRoleModal(false)}
          onSuccess={async () => {
            setCreateRoleModal(false);
            await fetchRoleTemplates();
          }}
        />
      )}

      {editRoleTemplate && (
        <RoleTemplateModal
          authToken={authToken}
          mode="edit"
          template={editRoleTemplate}
          onClose={() => setEditRoleTemplate(null)}
          onSuccess={async () => {
            setEditRoleTemplate(null);
            await fetchRoleTemplates();
          }}
        />
      )}
    </div>
  );
}
function CreateUserModal({
  authToken,
  roleTemplates,
  onClose,
  onSuccess,
}: {
  authToken: string | null;
  roleTemplates: RoleTemplateItem[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'admin' as RoleValue,
    ...DEFAULT_PERMISSIONS,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const template = roleTemplates.find(item => String(item.id) === templateId);
    if (!template) return;
    setForm(prev => ({
      ...prev,
      role: template.role,
      ...PERMISSIONS.reduce((acc, permission) => ({ ...acc, [permission.key]: template[permission.key] }), {} as PermissionState),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminApiCall('/api/admin/users', authToken, {
        method: 'POST',
        body: JSON.stringify(form),
      });
      await onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Create Admin User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">First Name</label>
            <input
              required
              value={form.first_name}
              onChange={event => setField('first_name', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Last Name</label>
            <input
              required
              value={form.last_name}
              onChange={event => setField('last_name', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Username</label>
            <input
              required
              value={form.username}
              onChange={event => setField('username', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={event => setField('email', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Password</label>
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={event => setField('password', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
            <select
              value={form.role}
              onChange={event => setField('role', event.target.value as RoleValue)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Apply Role Template</label>
            <select
              value={selectedTemplate}
              onChange={event => applyTemplate(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No template</option>
              {roleTemplates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-600">Permissions</p>
          <PermissionGrid
            values={form}
            onChange={(permission, value) => setField(permission, value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({
  user,
  authToken,
  isSuperAdmin,
  roleTemplates,
  onClose,
  onSuccess,
}: {
  user: AdminUserItem;
  authToken: string | null;
  isSuperAdmin: boolean;
  roleTemplates: RoleTemplateItem[];
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [form, setForm] = useState({
    email: user.email,
    first_name: user.first_name,
    last_name: user.last_name,
    role: user.role,
    is_active: user.is_active,
    is_verified: user.is_verified,
    ...PERMISSIONS.reduce((acc, permission) => ({ ...acc, [permission.key]: user[permission.key] }), {} as PermissionState),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const applyTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
    if (!templateId) return;
    const template = roleTemplates.find(item => String(item.id) === templateId);
    if (!template) return;
    setForm(prev => ({
      ...prev,
      role: template.role,
      ...PERMISSIONS.reduce((acc, permission) => ({ ...acc, [permission.key]: template[permission.key] }), {} as PermissionState),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await adminApiCall(`/api/admin/users/${user.id}`, authToken, {
        method: 'PUT',
        body: JSON.stringify(form),
      });
      await onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit User - ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">First Name</label>
            <input
              value={form.first_name}
              onChange={event => setField('first_name', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Last Name</label>
            <input
              value={form.last_name}
              onChange={event => setField('last_name', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={event => setField('email', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {isSuperAdmin && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Role</label>
              <select
                value={form.role}
                onChange={event => setField('role', event.target.value as RoleValue)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {ROLE_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Apply Role Template</label>
              <select
                value={selectedTemplate}
                onChange={event => applyTemplate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No template</option>
                {roleTemplates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={event => setField('is_active', event.target.checked)} className="rounded" />
            Active account
          </label>
          {isSuperAdmin && (
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_verified} onChange={event => setField('is_verified', event.target.checked)} className="rounded" />
              Verified
            </label>
          )}
        </div>

        {isSuperAdmin && (
          <div>
            <p className="mb-2 text-xs font-medium text-gray-600">Permissions</p>
            <PermissionGrid values={form} onChange={(permission, value) => setField(permission, value)} />
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordModal({
  user,
  authToken,
  onClose,
  onSuccess,
}: {
  user: AdminUserItem;
  authToken: string | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await adminApiCall(`/api/admin/users/${user.id}/password`, authToken, {
        method: 'PATCH',
        body: JSON.stringify({ new_password: password }),
      });
      onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Reset Password - ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">New Password</label>
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={event => setPassword(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-yellow-600 disabled:opacity-50"
          >
            {saving ? 'Updating...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function RoleTemplateModal({
  authToken,
  mode,
  template,
  onClose,
  onSuccess,
}: {
  authToken: string | null;
  mode: 'create' | 'edit';
  template?: RoleTemplateItem;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const [form, setForm] = useState(() => {
    if (!template) return { ...EMPTY_ROLE_TEMPLATE };
    return {
      name: template.name,
      description: template.description ?? '',
      role: template.role,
      is_system: template.is_system,
      ...PERMISSIONS.reduce((acc, permission) => ({ ...acc, [permission.key]: template[permission.key] }), {} as PermissionState),
    };
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const endpoint = mode === 'create' ? '/api/admin/roles' : `/api/admin/roles/${template?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      await adminApiCall(endpoint, authToken, { method, body: JSON.stringify(form) });
      await onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save role template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={mode === 'create' ? 'Create Role Template' : `Edit Role Template - ${template?.name ?? ''}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Template Name</label>
            <input
              required
              value={form.name}
              onChange={event => setField('name', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Default Role</label>
            <select
              value={form.role}
              onChange={event => setField('role', event.target.value as RoleValue)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ROLE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
          <textarea
            value={form.description}
            onChange={event => setField('description', event.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={form.is_system} onChange={event => setField('is_system', event.target.checked)} className="rounded" />
          System template
        </label>

        <div>
          <p className="mb-2 text-xs font-medium text-gray-600">Permissions</p>
          <PermissionGrid values={form} onChange={(permission, value) => setField(permission, value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Save Role'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
