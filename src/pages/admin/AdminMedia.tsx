import { useEffect, useState, useCallback, useRef } from 'react';
import { Upload, Search, Trash2, Copy, Image as ImageIcon, FileText, Film, RefreshCw, X, LayoutGrid, List } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';

interface MediaItem {
  id: number;
  url: string;
  filename: string;
  title: string | null;
  alt_text: string | null;
  folder: string;
  mime_type: string;
  extension: string;
  file_size: number;
  width: number | null;
  height: number | null;
  created_at: string | null;
}

interface MediaListResponse {
  total: number;
  items: MediaItem[];
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ mime }: { mime: string }) {
  if (mime.startsWith('image/')) return <ImageIcon className="w-8 h-8 text-blue-400" />;
  if (mime.startsWith('video/')) return <Film className="w-8 h-8 text-purple-400" />;
  return <FileText className="w-8 h-8 text-gray-400" />;
}

export default function AdminMedia() {
  const { authToken } = useAdminStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<MediaItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mimeFilter, setMimeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const limit = 30;

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ skip: String(page * limit), limit: String(limit) });
      if (search) params.set('search', search);
      if (mimeFilter) params.set('mime_prefix', mimeFilter);
      const res = await fetch(`/api/admin/media?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed');
      const data: MediaListResponse = await res.json();
      setItems(data.items);
      setTotal(data.total);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authToken, page, search, mimeFilter]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);
  useEffect(() => { setPage(0); }, [search, mimeFilter]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'uploads');
    try {
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail ?? 'Upload failed');
      }
      await fetchMedia();
    } catch (e: any) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) await uploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) await uploadFile(file);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this file?')) return;
    setDeleting(id);
    try {
      await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (selected?.id === id) setSelected(null);
      await fetchMedia();
    } finally {
      setDeleting(null);
    }
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(window.location.origin + item.url);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} files total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*,application/pdf"
            className="hidden"
            onChange={handleFilePick}
          />
        </div>
      </div>

      {uploadError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center justify-between">
          {uploadError}
          <button onClick={() => setUploadError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">
          Drop files here or <span className="text-blue-600 font-medium">click to upload</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">Images, videos, PDFs · Max 20 MB per file</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search files…"
            className="bg-transparent text-sm outline-none w-full"
          />
        </div>
        <select
          value={mimeFilter}
          onChange={e => setMimeFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none"
        >
          <option value="">All types</option>
          <option value="image/">Images</option>
          <option value="video/">Videos</option>
          <option value="application/pdf">PDFs</option>
        </select>
        <button onClick={fetchMedia} title="Refresh" className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <RefreshCw className="w-4 h-4 text-gray-500" />
        </button>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            className={`p-2 transition-colors border-l border-gray-300 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Grid + Detail panel */}
      <div className="flex gap-6">
        {/* Grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <ImageIcon className="w-12 h-12" />
              <p className="text-sm">No files found</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {items.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelected(item.id === selected?.id ? null : item)}
                  className={`relative group rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                    selected?.id === item.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {item.mime_type.startsWith('image/') ? (
                    <img
                      src={item.url}
                      alt={item.alt_text ?? item.filename}
                      className="w-full h-28 object-cover bg-gray-100"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-28 bg-gray-50 flex items-center justify-center">
                      <FileIcon mime={item.mime_type} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={e => { e.stopPropagation(); copyUrl(item); }}
                      title="Copy URL"
                      className="p-1 bg-white rounded shadow text-gray-600 hover:text-blue-600"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                      disabled={deleting === item.id}
                      title="Delete"
                      className="p-1 bg-white rounded shadow text-gray-600 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {copied === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 text-white text-xs font-medium">
                      Copied!
                    </div>
                  )}
                  <div className="p-1.5 bg-white border-t border-gray-100">
                    <p className="text-xs text-gray-700 truncate">{item.filename}</p>
                    <p className="text-[10px] text-gray-400">{formatBytes(item.file_size)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List view */
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Файл</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Тип</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Размер</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Дата</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(item.id === selected?.id ? null : item)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${selected?.id === item.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.mime_type.startsWith('image/') ? (
                            <img src={item.url} alt="" className="w-10 h-10 object-cover rounded border border-gray-200" />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded border border-gray-200 flex items-center justify-center">
                              <FileIcon mime={item.mime_type} />
                            </div>
                          )}
                          <span className="font-medium text-gray-800 max-w-xs truncate">{item.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{item.mime_type}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{formatBytes(item.file_size)}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('ru-RU') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={e => { e.stopPropagation(); copyUrl(item); }}
                            title="Copy URL"
                            className="text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDelete(item.id); }}
                            disabled={deleting === item.id}
                            title="Delete"
                            className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
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

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 text-sm text-gray-500">
              <span>{page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-64 shrink-0">
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 sticky top-20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Details</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {selected.mime_type.startsWith('image/') ? (
                <img
                  src={selected.url}
                  alt={selected.alt_text ?? selected.filename}
                  className="w-full rounded-lg border border-gray-200 object-cover"
                />
              ) : (
                <div className="h-24 bg-gray-50 rounded-lg flex items-center justify-center">
                  <FileIcon mime={selected.mime_type} />
                </div>
              )}

              <div className="space-y-1.5 text-xs text-gray-600">
                <div><span className="font-medium text-gray-700">Name:</span> {selected.filename}</div>
                <div><span className="font-medium text-gray-700">Type:</span> {selected.mime_type}</div>
                <div><span className="font-medium text-gray-700">Size:</span> {formatBytes(selected.file_size)}</div>
                {selected.width && selected.height && (
                  <div><span className="font-medium text-gray-700">Dimensions:</span> {selected.width}×{selected.height}</div>
                )}
                {selected.created_at && (
                  <div><span className="font-medium text-gray-700">Uploaded:</span> {new Date(selected.created_at).toLocaleDateString()}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">URL</label>
                <div className="flex gap-1.5">
                  <input
                    readOnly
                    value={window.location.origin + selected.url}
                    className="flex-1 text-xs border border-gray-300 rounded px-2 py-1.5 bg-gray-50 truncate"
                  />
                  <button
                    onClick={() => copyUrl(selected)}
                    className="p-1.5 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleDelete(selected.id)}
                disabled={deleting === selected.id}
                className="w-full flex items-center justify-center gap-1.5 text-sm text-red-600 border border-red-200 rounded-lg px-3 py-2 hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete file
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
