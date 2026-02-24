import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle, Search, Edit2, Trash2, Copy, Eye,
  CheckCircle, Clock, Archive, RefreshCw,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

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
  published: { label: 'Published', icon: CheckCircle, cls: 'bg-green-100 text-green-700' },
  draft:     { label: 'Draft',     icon: Clock,        cls: 'bg-yellow-100 text-yellow-700' },
  archived:  { label: 'Archived',  icon: Archive,      cls: 'bg-gray-100 text-gray-600' },
} as const;

const CATEGORIES = ['All', 'AI', 'Automation', 'Case Studies', 'Industry Insights'];

export default function AdminBlog() {
  const { authToken } = useAdminStore();
  const navigate = useNavigate();

  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [duplicating, setDuplicating] = useState<number | null>(null);

  const limit = 15;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: String(page * limit), limit: String(limit) });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (categoryFilter) params.set('category', categoryFilter);

      const res = await fetch(`/api/admin/blog?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to fetch posts');
      const data: BlogListResponse = await res.json();
      setPosts(data.items);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authToken, page, search, statusFilter, categoryFilter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Reset page when filters change
  useEffect(() => { setPage(0); }, [search, statusFilter, categoryFilter]);

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/blog/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      await fetchPosts();
    } finally {
      setDeleting(null);
    }
  };

  const handleDuplicate = async (id: number) => {
    setDuplicating(id);
    try {
      const res = await fetch(`/api/admin/blog/${id}/duplicate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        navigate(`/admin/blog/${data.id}/edit`);
      }
    } finally {
      setDuplicating(null);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    await fetch(`/api/admin/blog/${id}/status`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    await fetchPosts();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} posts total</p>
        </div>
        <Link
          to="/admin/blog/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search posts..."
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c === 'All' ? '' : c}>{c}</option>
          ))}
        </select>

        <button
          onClick={fetchPosts}
          title="Refresh"
          className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-gray-400 text-sm">Loading…</div>
        ) : posts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 gap-2 text-gray-400">
            <p className="text-sm">No posts found</p>
            <Link to="/admin/blog/new" className="text-blue-600 text-sm hover:underline">
              Create the first post
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Author</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Views</th>
                  <th className="px-4 py-3">Published</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {posts.map(post => {
                  const sc = STATUS_CONFIG[post.status];
                  return (
                    <tr key={post.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 max-w-xs truncate">{post.title}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          /{post.slug}
                          {post.is_featured && (
                            <span className="ml-2 bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-medium">Featured</span>
                          )}
                          {post.reading_time && (
                            <span className="ml-2 text-gray-400">{post.reading_time} min read</span>
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
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="archived">Archived</option>
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
                            title="View on site"
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </a>
                          <Link
                            to={`/admin/blog/${post.id}/edit`}
                            title="Edit"
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDuplicate(post.id)}
                            disabled={duplicating === post.id}
                            title="Duplicate"
                            className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            disabled={deleting === post.id}
                            title="Delete"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Showing {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
