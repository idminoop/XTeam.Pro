import { useCallback, useEffect, useMemo, useState } from 'react';
import { Edit2, Mail, Plus, RefreshCw, Trash2, X } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { adminApiCall, adminApiJson } from '@/utils/adminApi';
import TableSkeleton from '@/components/admin/TableSkeleton';
import EmptyState from '@/components/admin/EmptyState';

interface EmailTemplateItem {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  is_active: boolean;
  created_at: string | null;
  updated_at: string | null;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default function AdminEmailTemplates() {
  const authToken = useAdminStore(state => state.authToken);
  const [items, setItems] = useState<EmailTemplateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editItem, setEditItem] = useState<EmailTemplateItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApiJson<EmailTemplateItem[]>('/api/admin/email-templates', authToken);
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const byКатегория: Record<string, EmailTemplateItem[]> = {};
    for (const item of items) {
      const category = item.category || 'general';
      byКатегория[category] ||= [];
      byКатегория[category].push(item);
    }
    return byКатегория;
  }, [items]);

  const onDelete = async (template: EmailTemplateItem) => {
    if (!confirm(`Удалить шаблон "${template.name}"?`)) return;
    setDeletingId(template.id);
    try {
      await adminApiCall(`/api/admin/email-templates/${template.id}`, authToken, { method: 'DELETE' });
      await load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Шаблоны писем</h1>
          <p className="text-sm text-gray-500">
            Используйте переменные: <code>{'{{name}}'}</code>, <code>{'{{email}}'}</code>, <code>{'{{company}}'}</code>,{' '}
            <code>{'{{subject}}'}</code>.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Новый шаблон
          </button>
        </div>
      </div>

      {loading ? (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <TableSkeleton columns={4} rows={6} className="border-0 rounded-none" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Шаблонов нет"
          description="Создайте первый шаблон письма для быстрых ответов."
          icon={Mail}
          ctaLabel="Создать шаблон"
          onCtaClick={() => setCreateOpen(true)}
        />
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category} className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-4 py-3">
                <h2 className="text-sm font-semibold text-gray-800">{category}</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {categoryItems.map(item => (
                  <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="line-clamp-1 text-sm text-gray-600">{item.subject}</p>
                      <p className="line-clamp-2 text-xs text-gray-500">{item.body}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditItem(item)}
                        className="rounded p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(item)}
                        disabled={deletingId === item.id}
                        className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <EmailTemplateModal
          authToken={authToken}
          mode="create"
          onClose={() => setCreateOpen(false)}
          onSuccess={async () => {
            setCreateOpen(false);
            await load();
          }}
        />
      )}

      {editItem && (
        <EmailTemplateModal
          authToken={authToken}
          mode="edit"
          template={editItem}
          onClose={() => setEditItem(null)}
          onSuccess={async () => {
            setEditItem(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function EmailTemplateModal({
  authToken,
  mode,
  template,
  onClose,
  onSuccess,
}: {
  authToken: string | null;
  mode: 'create' | 'edit';
  template?: EmailTemplateItem;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
}) {
  const [form, setForm] = useState({
    name: template?.name ?? '',
    subject: template?.subject ?? '',
    body: template?.body ?? '',
    category: template?.category ?? 'general',
    is_active: template?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const endpoint = mode === 'create' ? '/api/admin/email-templates' : `/api/admin/email-templates/${template?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      await adminApiCall(endpoint, authToken, {
        method,
        body: JSON.stringify(form),
      });
      await onSuccess();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={mode === 'create' ? 'Create Template' : `Edit Template: ${template?.name ?? ''}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Название</label>
            <input
              required
              value={form.name}
              onChange={event => setField('name', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Категория</label>
            <input
              value={form.category}
              onChange={event => setField('category', event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Тема</label>
          <input
            required
            value={form.subject}
            onChange={event => setField('subject', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Тело письма (HTML)</label>
          <textarea
            required
            rows={10}
            value={form.body}
            onChange={event => setField('body', event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={event => setField('is_active', event.target.checked)}
            className="rounded"
          />
          Шаблон активен
        </label>
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Сохранение...' : 'Сохранить шаблон'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
