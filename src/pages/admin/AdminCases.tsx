import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckSquare, PlusCircle, RefreshCw, Search, Square, Trash2, Edit2, Star } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { adminApiCall, adminApiJson } from '@/utils/adminApi';
import TableSkeleton from '@/components/admin/TableSkeleton';
import EmptyState from '@/components/admin/EmptyState';
import BulkActionBar from '@/components/admin/BulkActionBar';

interface CaseItem {
  id: number;
  slug: string;
  title_ru: string;
  title_en: string;
  client_company: string | null;
  industry_ru: string;
  industry_en: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  sort_order: number;
  published_at: string | null;
}

interface CaseListResponse {
  total: number;
  skip: number;
  limit: number;
  items: CaseItem[];
}

const STATUS_CONFIG = {
  published: { label: 'Опубликовано', cls: 'bg-green-100 text-green-700' },
  draft: { label: 'Черновик', cls: 'bg-yellow-100 text-yellow-700' },
  archived: { label: 'В архиве', cls: 'bg-gray-100 text-gray-600' },
} as const;

export default function AdminCases() {
  const authToken = useAdminStore(state => state.authToken);
  const navigate = useNavigate();

  const [items, setItems] = useState<CaseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const limit = 15;

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: String(page * limit), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);

      const data = await adminApiJson<CaseListResponse>(`/api/admin/cases?${params}`, authToken);
      setItems(data.items);
      setTotal(data.total);
      setSelectedIds(prev => prev.filter(id => data.items.some(item => item.id === id)));
    } finally {
      setLoading(false);
    }
  }, [authToken, page, search, statusFilter]);

  useEffect(() => { fetchCases(); }, [fetchCases]);
  useEffect(() => { setPage(0); }, [search, statusFilter]);

  const toggleSelected = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const allSelected = useMemo(
    () => items.length > 0 && items.every(item => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Удалить кейс «${title}»?`)) return;
    setDeleting(id);
    try {
      await adminApiCall(`/api/admin/cases/${id}`, authToken, { method: 'DELETE' });
      await fetchCases();
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Удалить выбранные кейсы (${selectedIds.length})?`)) return;

    setBulkDeleting(true);
    try {
      await adminApiCall('/api/admin/cases/bulk-delete', authToken, {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds }),
      });
      setSelectedIds([]);
      await fetchCases();
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    await adminApiCall(`/api/admin/cases/${id}/status`, authToken, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    await fetchCases();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Кейс-стади</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} кейсов</p>
        </div>
        <Link
          to="/admin/cases/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Новый кейс
        </Link>
      </div>

      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск по названию, компании, отрасли..."
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Все статусы</option>
          <option value="draft">Черновик</option>
          <option value="published">Опубликовано</option>
          <option value="archived">В архиве</option>
        </select>

        <button
          onClick={fetchCases}
          title="Обновить"
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <TableSkeleton columns={8} rows={7} className="border-0 rounded-none" />
        ) : items.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Кейсы не найдены"
              description="Создайте первый кейс, чтобы заполнить этот раздел."
              icon={Search}
              ctaLabel="Создать кейс"
              ctaTo="/admin/cases/new"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700">
                      {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Компания</th>
                  <th className="px-4 py-3">Отрасль</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3 text-right">Порядок</th>
                  <th className="px-4 py-3">Опубликован</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map(item => {
                  const sc = STATUS_CONFIG[item.status];
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelected(item.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 max-w-xs truncate inline-flex items-center gap-2">
                          {item.title_en}
                          {item.is_featured && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.title_ru}</div>
                        <div className="text-xs text-gray-400 mt-0.5">/{item.slug}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{item.client_company || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{item.industry_en}</td>
                      <td className="px-4 py-3">
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${sc.cls} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                        >
                          <option value="draft">Черновик</option>
                          <option value="published">Опубликовано</option>
                          <option value="archived">В архиве</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{item.sort_order}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {item.published_at ? new Date(item.published_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/cases/${item.id}/edit`)}
                            title="Редактировать"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id, item.title_en)}
                            disabled={deleting === item.id}
                            title="Удалить"
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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

      <BulkActionBar selectedCount={selectedIds.length} onClear={() => setSelectedIds([])}>
        <button
          onClick={handleBulkDelete}
          disabled={bulkDeleting}
          className="inline-flex items-center gap-2 rounded bg-red-600 px-3 py-1.5 text-sm text-white hover:bg-red-700 disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          {bulkDeleting ? 'Удаление...' : 'Удалить выбранные'}
        </button>
      </BulkActionBar>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {page * limit + 1}–{Math.min((page + 1) * limit, total)} из {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Назад
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Вперёд
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
