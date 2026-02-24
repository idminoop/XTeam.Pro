import { useEffect, useState, useCallback } from 'react';
import {
  UserPlus, Edit2, Trash2, Lock, Unlock, Key, Shield, RefreshCw, X, Check,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

interface AdminUserItem {
  id: number;
  username: string;
  email: string;
  full_name: string;
  first_name: string;
  last_name: string;
  role: 'admin' | 'super_admin' | 'analyst';
  is_active: boolean;
  is_verified: boolean;
  can_manage_audits: boolean;
  can_manage_users: boolean;
  can_view_analytics: boolean;
  can_export_data: boolean;
  can_manage_content: boolean;
  last_login: string | null;
  created_at: string | null;
  failed_login_attempts: number;
  locked_until: string | null;
}

const ROLE_CONFIG = {
  super_admin: { label: 'Super Admin', cls: 'bg-red-100 text-red-700' },
  admin:       { label: 'Admin',       cls: 'bg-blue-100 text-blue-700' },
  analyst:     { label: 'Analyst',     cls: 'bg-gray-100 text-gray-600' },
} as const;

const PERMISSIONS = [
  { key: 'can_manage_audits',   label: 'Manage Audits' },
  { key: 'can_manage_users',    label: 'Manage Users' },
  { key: 'can_view_analytics',  label: 'View Analytics' },
  { key: 'can_export_data',     label: 'Export Data' },
  { key: 'can_manage_content',  label: 'Manage Content' },
] as const;

interface ModalProps { onClose: () => void; children: React.ReactNode; title: string; }
function Modal({ onClose, children, title }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { authToken, adminUser: me } = useAdminStore();
  const isSuperAdmin = me?.role === 'super_admin';

  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<AdminUserItem | null>(null);
  const [passwordUser, setPasswordUser] = useState<AdminUserItem | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [unlocking, setUnlocking] = useState<number | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setUsers(data);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async (user: AdminUserItem) => {
    if (!confirm(`Delete user "${user.username}"? This cannot be undone.`)) return;
    setDeleting(user.id);
    try {
      await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      await fetchUsers();
    } finally {
      setDeleting(null);
    }
  };

  const handleUnlock = async (user: AdminUserItem) => {
    setUnlocking(user.id);
    try {
      await fetch(`/api/admin/users/${user.id}/unlock`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      await fetchUsers();
    } finally {
      setUnlocking(null);
    }
  };

  const isLocked = (u: AdminUserItem) =>
    u.locked_until && new Date(u.locked_until) > new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} admin users</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} title="Refresh" className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add User
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
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
                  const rc = ROLE_CONFIG[user.role] ?? ROLE_CONFIG.admin;
                  const locked = isLocked(user);
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm shrink-0">
                            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-xs text-gray-400">{user.email}</div>
                            <div className="text-xs text-gray-400">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${rc.cls}`}>
                          {rc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {PERMISSIONS.filter(p => user[p.key]).map(p => (
                            <span key={p.key} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              {p.label}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1 text-xs font-medium ${user.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                            {user.is_active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                          {locked && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600">
                              <Lock className="w-3 h-3" />
                              Locked
                            </span>
                          )}
                          {user.failed_login_attempts > 0 && !locked && (
                            <span className="text-xs text-orange-500">{user.failed_login_attempts} failed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {locked && isSuperAdmin && (
                            <button
                              onClick={() => handleUnlock(user)}
                              disabled={unlocking === user.id}
                              title="Unlock account"
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                            >
                              <Unlock className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => setPasswordUser(user)}
                            title="Reset password"
                            className="p-1.5 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded transition-colors"
                          >
                            <Key className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditUser(user)}
                            title="Edit user"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {isSuperAdmin && String(user.id) !== me?.id && (
                            <button
                              onClick={() => handleDelete(user)}
                              disabled={deleting === user.id}
                              title="Delete user"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* Create user modal */}
      {showCreate && (
        <CreateUserModal
          authToken={authToken ?? ''}
          onClose={() => setShowCreate(false)}
          onSuccess={() => { setShowCreate(false); fetchUsers(); }}
        />
      )}

      {/* Edit user modal */}
      {editUser && (
        <EditUserModal
          user={editUser}
          authToken={authToken ?? ''}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setEditUser(null)}
          onSuccess={() => { setEditUser(null); fetchUsers(); }}
        />
      )}

      {/* Password reset modal */}
      {passwordUser && (
        <PasswordModal
          user={passwordUser}
          authToken={authToken ?? ''}
          onClose={() => setPasswordUser(null)}
          onSuccess={() => setPasswordUser(null)}
        />
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CreateUserModal({ authToken, onClose, onSuccess }: {
  authToken: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    username: '', email: '', password: '', first_name: '', last_name: '',
    role: 'admin',
    can_manage_audits: true, can_manage_users: false,
    can_view_analytics: true, can_export_data: true, can_manage_content: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Error'); }
      onSuccess();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title="Create Admin User" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">First name</label>
            <input required value={form.first_name} onChange={e => set('first_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last name</label>
            <input required value={form.last_name} onChange={e => set('last_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Username</label>
          <input required value={form.username} onChange={e => set('username', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
          <input required type="password" minLength={8} value={form.password} onChange={e => set('password', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
          <select value={form.role} onChange={e => set('role', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="analyst">Analyst</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">Permissions</label>
          <div className="space-y-2">
            {PERMISSIONS.map(p => (
              <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={form[p.key]} onChange={e => set(p.key, e.target.checked)} className="rounded" />
                {p.label}
              </label>
            ))}
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Creating…' : 'Create User'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditUserModal({ user, authToken, isSuperAdmin, onClose, onSuccess }: {
  user: AdminUserItem;
  authToken: string;
  isSuperAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    role: user.role,
    is_active: user.is_active,
    can_manage_audits: user.can_manage_audits,
    can_manage_users: user.can_manage_users,
    can_view_analytics: user.can_view_analytics,
    can_export_data: user.can_export_data,
    can_manage_content: user.can_manage_content,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Error'); }
      onSuccess();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`Edit — ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">First name</label>
            <input value={form.first_name} onChange={e => set('first_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Last name</label>
            <input value={form.last_name} onChange={e => set('last_name', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
          <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        {isSuperAdmin && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select value={form.role} onChange={e => set('role', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="analyst">Analyst</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
        )}
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.is_active} onChange={e => set('is_active', e.target.checked)} className="rounded" />
          Active account
        </label>
        {isSuperAdmin && (
          <div>
            <p className="text-xs font-medium text-gray-600 mb-2">Permissions</p>
            <div className="space-y-2">
              {PERMISSIONS.map(p => (
                <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="checkbox" checked={form[p.key]} onChange={e => set(p.key, e.target.checked)} className="rounded" />
                  {p.label}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordModal({ user, authToken, onClose, onSuccess }: {
  user: AdminUserItem;
  authToken: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError('Min 8 characters'); return; }
    setSaving(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/password`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: password }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail ?? 'Error'); }
      onSuccess();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <Modal title={`Reset password — ${user.username}`} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">{error}</p>}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">New password (min 8 chars)</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
            {saving ? 'Updating…' : 'Reset Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
