import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle, Search, Edit2, Trash2, Copy, Eye, CheckSquare, Square,
  CheckCircle, Clock, Archive, RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { adminApiCall, adminApiJson } from '@/utils/adminApi';
import TableSkeleton from '@/components/admin/TableSkeleton';
import EmptyState from '@/components/admin/EmptyState';
import BulkActionBar from '@/components/admin/BulkActionBar';

interface BlogPostItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string;
  tags: string | null;
  author_name: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  view_count: number;
  reading_time: number | null;
  word_count: number | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  featured_image: string | null;
}

interface BlogListResponse {
  total: number;
  skip: number;
  limit: number;
  items: BlogPostItem[];
}

const STATUS_CONFIG = {
  published: { label: 'Опубликовано', icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
  draft:     { label: 'Черновик',     icon: Clock,        cls: 'bg-yellow-100 text-yellow-700' },
  archived:  { label: 'В архиве',     icon: Archive,      cls: 'bg-gray-100 text-gray-600' },
} as const;

const CATEGORIES = ['Все', 'AI', 'Automation', 'Case Studies', 'Industry Insights'];

export default function AdminBlog() {
  const authToken = useAdminStore(state => state.authToken);
  const navigate = useNavigate();

  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [duplicating, setDuplicating] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const limit = 15;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: String(page * limit), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const data = await adminApiJson<BlogListResponse>(`/api/admin/blog?${params}`, authToken);
      setPosts(data.items);
      setTotal(data.total);
      setSelectedIds(prev => prev.filter(id => data.items.some(item => item.id === id)));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authToken, page, search, statusFilter, categoryFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, statusFilter, categoryFilter]);

  const allSelected = posts.length > 0 && posts.every(post => selectedIds.includes(post.id));

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(posts.map(post => post.id));
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Удалить «${title}»?`)) return;
    setDeleting(id);
    try {
      await adminApiCall(`/api/admin/blog/${id}`, authToken, {
        method: 'DELETE',
      });
      await fetchPosts();
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    setDuplicating(id);
    try {
      const data = await adminApiJson<{ id?: number }>(`/api/admin/blog/${id}/duplicate`, authToken, {
        method: 'POST',
      });
      if (data.id) {
        navigate(`/admin/blog/${data.id}/edit`);
      }
    } finally {
      setDuplicating(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await adminApiCall(`/api/admin/blog/${id}/status`, authToken, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchPosts();
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Удалить выбранные статьи (${selectedIds.length})?`)) return;

    setBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          adminApiCall(`/api/admin/blog/${id}`, authToken, {
            method: 'DELETE',
          }),
        ),
      );
      setSelectedIds([]);
      toast.success('Статьи удалены');
      await fetchPosts();
    } catch {
      toast.error('Ошибка при удалении статей');
    } finally {
      setBulkDeleting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Блог</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} статей</p>
        </div>
        <Link
          to="/admin/blog/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          Новая статья
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Поиск статей..."
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

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c === 'Все' ? '' : c}>{c}</option>
          ))}
        </select>

        <button
          onClick={fetchPosts}
          title="Обновить"
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <TableSkeleton columns={8} rows={7} className="border-0 rounded-none" />
        ) : posts.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="Статьи не найдены"
              description="Измените фильтры или создайте новую статью."
              icon={Search}
              ctaLabel="Создать статью"
              ctaTo="/admin/blog/new"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700">
                      {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                    </button>
                  </th>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Категория</th>
                  <th className="px-4 py-3">Автор</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3 text-right">Просмотры</th>
                  <th className="px-4 py-3">Опубликована</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map(post => {
                  const sc = STATUS_CONFIG[post.status];
                  return (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(post.id)}
                          onChange={() => toggleSelect(post.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 max-w-xs truncate">{post.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          /{post.slug}
                          {post.is_featured && (
                            <span className="ml-2 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Топ</span>
                          )}
                          {post.reading_time && (
                            <span className="ml-2 text-gray-400">{post.reading_time} мин. чт.</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{post.category}</td>
                      <td className="px-4 py-3 text-gray-600">{post.author_name}</td>
                      <td className="px-4 py-3">
                        <select
                          value={post.status}
                          onChange={e => handleStatusChange(post.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${sc.cls} focus:outline-none focus:ring-2 focus:ring-blue-400`}
                        >
                          <option value="draft">Черновик</option>
                          <option value="published">Опубликовано</option>
                          <option value="archived">В архиве</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{post.view_count.toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString()
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="На сайте"
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <Link
                            to={`/admin/blog/${post.id}/edit`}
                            title="Редактировать"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(post.id)}
                            disabled={duplicating === post.id}
                            title="Дублировать"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            disabled={deleting === post.id}
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
          <Trash2 className="h-4 w-4" />
          {bulkDeleting ? 'Удаление...' : 'Удалить выбранные'}
        </button>
      </BulkActionBar>

      {/* Pagination */}
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
