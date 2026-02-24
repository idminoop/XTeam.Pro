import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Eye, Download, Trash2 } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { apiCall } from '@/utils/api';

interface ContactRow {
  inquiry_id: string;
  name: string;
  email: string;
  company: string;
  inquiry_type: string;
  subject: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  created_at: string;
  response_sent: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  new:       'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-purple-100 text-purple-800',
  converted: 'bg-green-100 text-green-800',
  closed:    'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  low:    'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high:   'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'Новое', contacted: 'Связались', qualified: 'Квалиф.', converted: 'Конвертирован', closed: 'Закрыт',
};

const PRIORITY_LABELS: Record<string, string> = {
  low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный',
};

export default function AdminContacts() {
  const { authToken } = useAdminStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? 'all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [inquiryTypeFilter, setInquiryTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const load = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status_filter', statusFilter);
      if (inquiryTypeFilter !== 'all') params.set('inquiry_type_filter', inquiryTypeFilter);
      if (dateFrom) params.set('date_from', dateFrom);
      if (dateTo) params.set('date_to', dateTo);
      const res = await apiCall(`/api/admin/contacts?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setContacts(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      toast.error('Не удалось загрузить обращения');
    } finally {
      setLoading(false);
    }
  }, [authToken, statusFilter, inquiryTypeFilter, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  const handleExportContacts = async () => {
    try {
      const res = await apiCall('/api/admin/export/contacts', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'contacts.csv';
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch {
      toast.error('Экспорт не удался');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить это обращение? Действие необратимо.')) return;
    try {
      await apiCall(`/api/admin/contacts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Обращение удалено');
      setContacts(prev => prev.filter(c => c.inquiry_id !== id));
    } catch {
      toast.error('Не удалось удалить обращение');
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q);
    const matchPriority = priorityFilter === 'all' || c.priority === priorityFilter;
    return matchSearch && matchPriority;
  });

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Имя, email, компания…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Все статусы</option>
          <option value="new">Новые</option>
          <option value="contacted">Связались</option>
          <option value="qualified">Квалифицированные</option>
          <option value="converted">Конвертированные</option>
          <option value="closed">Закрытые</option>
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Все приоритеты</option>
          <option value="urgent">Срочный</option>
          <option value="high">Высокий</option>
          <option value="medium">Средний</option>
          <option value="low">Низкий</option>
        </select>
        <select
          value={inquiryTypeFilter}
          onChange={e => setInquiryTypeFilter(e.target.value)}
          className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">Все типы</option>
          <option value="general">Общий</option>
          <option value="consultation">Консультация</option>
          <option value="support">Поддержка</option>
          <option value="partnership">Партнёрство</option>
        </select>
        <div className="flex gap-2 items-center">
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="От даты"
          />
          <span className="text-gray-400 text-sm">—</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className="px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="До даты"
          />
        </div>
        <button
          onClick={handleExportContacts}
          className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" /> Экспорт CSV
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            Обращения не найдены
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Контакт', 'Компания', 'Тип', 'Приоритет', 'Статус', 'Дата', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map(c => (
                  <tr key={c.inquiry_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-gray-900">{c.name}</div>
                      <div className="text-gray-400 text-xs">{c.email}</div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{c.company || '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {c.inquiry_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[c.priority] ?? ''}`}>
                        {PRIORITY_LABELS[c.priority] ?? c.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] ?? ''}`}>
                        {STATUS_LABELS[c.status] ?? c.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">{fmt(c.created_at)}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate(`/admin/contacts/${c.inquiry_id}`)}
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Детали"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.inquiry_id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Удалить"
                        >
                          <Trash2 className="w-4 h-4" />
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
    </motion.div>
  );
}
