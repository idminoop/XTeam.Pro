import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Download, Eye, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { adminApiCall } from '@/utils/adminApi';
import TableSkeleton from '@/components/admin/TableSkeleton';
import EmptyState from '@/components/admin/EmptyState';
import BulkActionBar from '@/components/admin/BulkActionBar';

interface ContactRow {
  inquiry_id: string;
  id: number;
  name: string;
  email: string;
  company: string | null;
  inquiry_type: string;
  subject: string;
  source?: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  pipeline_stage: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  score: number;
  tags: string[];
  created_at: string;
  response_sent: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STAGE_LABELS: Record<string, string> = {
  new: 'Новый',
  contacted: 'На связи',
  qualified: 'Квалифицирован',
  converted: 'Конвертирован',
  closed: 'Закрыт',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: 'Срочный',
  high: 'Высокий',
  medium: 'Средний',
  low: 'Низкий',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Новый',
  contacted: 'На связи',
  qualified: 'Квалифицирован',
  converted: 'Конвертирован',
  closed: 'Закрыт',
};

export default function AdminContacts() {
  const authToken = useAdminStore(state => state.authToken);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all');
  const [pipelineFilter, setPipelineFilter] = useState<'all' | ContactRow['pipeline_stage']>('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<ContactRow['status']>('contacted');
  const [bulkAssign, setBulkAssign] = useState('');

  const load = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status_filter', statusFilter);
      if (inquiryTypeFilter !== 'all') params.set('inquiry_type_filter', inquiryTypeFilter);
      if (pipelineFilter !== 'all') params.set('pipeline_stage', pipelineFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const query = params.size ? `?${params.toString()}` : '';
      const response = await adminApiCall(`/api/admin/contacts${query}`, authToken);
      const data = await response.json();
      setContacts(Array.isArray(data) ? data : data.items ?? []);
      setSelectedIds([]);
    } catch {
      toast.error('Ошибка загрузки контактов');
    } finally {
      setLoading(false);
    }
  }, [authToken, statusFilter, inquiryTypeFilter, pipelineFilter, dateFrom, dateTo]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return contacts.filter(item => {
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        (item.company ?? '').toLowerCase().includes(q) ||
        (item.source ?? '').toLowerCase().includes(q) ||
        (item.tags ?? []).join(',').toLowerCase().includes(q);
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    });
  }, [contacts, search, priorityFilter]);

  const allVisibleSelected = filtered.length > 0 && filtered.every(item => selectedIds.includes(item.id));

  const toggleOne = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds(prev => prev.filter(id => !filtered.some(item => item.id === id)));
      return;
    }
    const add = filtered.map(item => item.id);
    setSelectedIds(prev => Array.from(new Set([...prev, ...add])));
  };

  const runBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Удалить контакты (${selectedIds.length})?`)) return;
    await adminApiCall('/api/admin/contacts/bulk-delete', authToken, {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds }),
    });
    toast.success('Контакты удалены');
    await load();
  };

  const runBulkStatus = async () => {
    if (!selectedIds.length) return;
    await adminApiCall('/api/admin/contacts/bulk-status', authToken, {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds, status: bulkStatus }),
    });
    toast.success('Статус обновлён');
    await load();
  };

  const runBulkAssign = async () => {
    if (!selectedIds.length) return;
    await adminApiCall('/api/admin/contacts/bulk-assign', authToken, {
      method: 'POST',
      body: JSON.stringify({ ids: selectedIds, assigned_to: bulkAssign || null }),
    });
    toast.success('Исполнитель назначен');
    await load();
  };

  const handleExportContacts = async () => {
    try {
      const response = await adminApiCall('/api/admin/export/contacts', authToken);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'contacts.csv';
      document.body.appendChild(link);
      link.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch {
      toast.error('Ошибка экспорта');
    }
  };

  const handleDeleteOne = async (id: string) => {
    if (!confirm('Удалить этот контакт?')) return;
    await adminApiCall(`/api/admin/contacts/${id}`, authToken, { method: 'DELETE' });
    toast.success('Контакт удалён');
    setContacts(prev => prev.filter(item => item.inquiry_id !== id));
    setSelectedIds(prev => prev.filter(item => String(item) !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-gray-900">Контакты</h1>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigate('/admin/contacts/kanban')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            CRM Канбан
          </button>
          <button
            onClick={() => navigate('/admin/email-templates')}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Шаблоны писем
          </button>
          <button
            onClick={handleExportContacts}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Экспорт CSV
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow">
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-6">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Поиск по имени, email, компании, тегу"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={event => setStatusFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все статусы</option>
            <option value="new">Новый</option>
            <option value="contacted">На связи</option>
            <option value="qualified">Квалифицирован</option>
            <option value="converted">Конвертирован</option>
            <option value="closed">Закрыт</option>
          </select>
          <select
            value={pipelineFilter}
            onChange={event => setPipelineFilter(event.target.value as typeof pipelineFilter)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все стадии</option>
            <option value="new">Новый</option>
            <option value="contacted">На связи</option>
            <option value="qualified">Квалифицирован</option>
            <option value="converted">Конвертирован</option>
            <option value="closed">Закрыт</option>
          </select>
          <select
            value={priorityFilter}
            onChange={event => setPriorityFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все приоритеты</option>
            <option value="urgent">Срочный</option>
            <option value="high">Высокий</option>
            <option value="medium">Средний</option>
            <option value="low">Низкий</option>
          </select>
          <select
            value={inquiryTypeFilter}
            onChange={event => setInquiryTypeFilter(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Все типы</option>
            <option value="general">Общее</option>
            <option value="consultation">Консультация</option>
            <option value="support">Поддержка</option>
            <option value="partnership">Партнёрство</option>
          </select>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={event => setDateFrom(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-400">по</span>
          <input
            type="date"
            value={dateTo}
            onChange={event => setDateTo(event.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow">
        {loading ? (
          <TableSkeleton columns={10} rows={8} className="border-0 rounded-none" />
        ) : filtered.length === 0 ? (
          <div className="p-6">
            <EmptyState title="Контакты не найдены" description="Измените фильтры или поисковый запрос." icon={Search} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Контакт</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Компания</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Приоритет</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Статус</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Стадия</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Оценка</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Теги</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Дата</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(item => (
                  <tr key={item.inquiry_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.includes(item.id)} onChange={() => toggleOne(item.id)} />
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.company || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_COLORS[item.priority]}`}>
                        {PRIORITY_LABELS[item.priority] ?? item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                        {STATUS_LABELS[item.status] ?? item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">{STAGE_LABELS[item.pipeline_stage] ?? item.pipeline_stage}</td>
                    <td className="px-4 py-3">
                      <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{item.score}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map(tag => (
                          <span key={`${item.id}-${tag}`} className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/admin/contacts/${item.inquiry_id}`)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Подробнее"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOne(item.inquiry_id)}
                          className="text-gray-400 hover:text-red-600"
                          title="Удалить"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])}>
        <select
          value={bulkStatus}
          onChange={event => setBulkStatus(event.target.value as ContactRow['status'])}
          className="rounded border border-blue-300 bg-white px-2 py-1 text-sm"
        >
          <option value="new">Новый</option>
          <option value="contacted">На связи</option>
          <option value="qualified">Квалифицирован</option>
          <option value="converted">Конвертирован</option>
          <option value="closed">Закрыт</option>
        </select>
        <button onClick={runBulkStatus} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
          Изменить статус
        </button>
        <input
          value={bulkAssign}
          onChange={event => setBulkAssign(event.target.value)}
          placeholder="Исполнитель"
          className="rounded border border-blue-300 bg-white px-2 py-1 text-sm"
        />
        <button onClick={runBulkAssign} className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700">
          Назначить
        </button>
        <button onClick={runBulkDelete} className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700">
          Удалить
        </button>
      </BulkActionBar>
    </div>
  );
}
