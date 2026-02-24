import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Search, Eye, Trash2, Download, CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { apiCall } from '@/utils/api';

interface AuditRow {
  audit_id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  submitted_at: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  maturity_score: number | null;
  estimated_roi: number | null;
  industry: string;
  company_size: string;
}

const STATUS_CONFIG = {
  completed:  { label: 'Завершён',  color: 'bg-green-100 text-green-800',  icon: CheckCircle },
  processing: { label: 'Обработка', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pending:    { label: 'Ожидание',  color: 'bg-gray-100 text-gray-700',    icon: AlertCircle },
  failed:     { label: 'Ошибка',    color: 'bg-red-100 text-red-800',      icon: XCircle },
};

export default function AdminAudits() {
  const { authToken } = useAdminStore();
  const navigate = useNavigate();
  const [audits, setAudits] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status_filter', statusFilter);
      if (search) params.set('search', search);
      const res = await apiCall(`/api/admin/audits?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setAudits(Array.isArray(data) ? data : data.items ?? []);
    } catch {
      toast.error('Не удалось загрузить аудиты');
    } finally {
      setLoading(false);
    }
  }, [authToken, statusFilter, search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить аудит? Это действие необратимо.')) return;
    try {
      await apiCall(`/api/admin/submissions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Аудит удалён');
      setAudits(prev => prev.filter(a => a.audit_id !== id));
    } catch {
      toast.error('Не удалось удалить аудит');
    }
  };

  const handleExport = async () => {
    try {
      const res = await apiCall('/api/admin/export?format=csv', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'audits.csv';
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch {
      toast.error('Экспорт не удался');
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl shadow p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Компания, email, отрасль…"
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
          <option value="pending">Ожидание</option>
          <option value="processing">Обработка</option>
          <option value="completed">Завершён</option>
          <option value="failed">Ошибка</option>
        </select>
        <button
          onClick={handleExport}
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
        ) : audits.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400 text-sm">
            <Search className="w-10 h-10 mb-3 opacity-30" />
            Аудиты не найдены
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Компания', 'Контакт', 'Отрасль', 'Статус', 'Балл', 'ROI', 'Дата', ''].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {audits.map(a => {
                  const cfg = STATUS_CONFIG[a.status] ?? STATUS_CONFIG.pending;
                  const Ico = cfg.icon;
                  return (
                    <tr key={a.audit_id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="font-medium text-gray-900">{a.company_name}</div>
                        <div className="text-gray-400 text-xs">{a.company_size}</div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-gray-700">{a.contact_name}</div>
                        <div className="text-gray-400 text-xs">{a.email}</div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 whitespace-nowrap">{a.industry}</td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>
                          <Ico className="w-3 h-3" /> {cfg.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-700">
                        {a.maturity_score != null ? `${a.maturity_score}/100` : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-700 whitespace-nowrap">
                        {a.estimated_roi != null ? fmtCurrency(a.estimated_roi) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-gray-400 whitespace-nowrap text-xs">{fmt(a.submitted_at)}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/admin/audits/${a.audit_id}`)}
                            className="text-blue-500 hover:text-blue-700 transition-colors"
                            title="Детали"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => window.open(`/audit/results/${a.audit_id}`, '_blank')}
                            className="text-gray-400 hover:text-gray-700 transition-colors"
                            title="Открыть результаты"
                          >
                            <Link to={`/audit/results/${a.audit_id}`} target="_blank" className="contents">
                              <Eye className="w-4 h-4" />
                            </Link>
                          </button>
                          <button
                            onClick={() => handleDelete(a.audit_id)}
                            className="text-red-400 hover:text-red-600 transition-colors"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </motion.div>
  );
}
