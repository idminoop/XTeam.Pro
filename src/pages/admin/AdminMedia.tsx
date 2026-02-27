import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Upload,
  Search,
  Trash2,
  Copy,
  Image as ImageIcon,
  FileText,
  Film,
  RefreshCw,
  X,
  LayoutGrid,
  List,
  Square,
  CheckSquare,
} from 'lucide-react';

import { useAdminStore } from '@/store/adminStore';
import { adminApiCall, adminApiJson } from '@/utils/adminApi';
import TableSkeleton from '@/components/admin/TableSkeleton';
import EmptyState from '@/components/admin/EmptyState';
import BulkActionBar from '@/components/admin/BulkActionBar';

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
  if (mime.startsWith('image/')) return <ImageIcon className="h-8 w-8 text-blue-400" />;
  if (mime.startsWith('video/')) return <Film className="h-8 w-8 text-purple-400" />;
  return <FileText className="h-8 w-8 text-gray-400" />;
}

export default function AdminMedia() {
  const authToken = useAdminStore(state => state.authToken);
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
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
      const data = await adminApiJson<MediaListResponse>(`/api/admin/media?${params}`, authToken);
      setItems(data.items);
      setTotal(data.total);
      setSelectedIds(prev => prev.filter(id => data.items.some(item => item.id === id)));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [authToken, page, search, mimeFilter]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  useEffect(() => {
    setPage(0);
  }, [search, mimeFilter]);

  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadError(null);
    const form = new FormData();
    form.append('file', file);
    form.append('folder', 'uploads');
    try {
      await adminApiCall('/api/admin/media', authToken, {
        method: 'POST',
        body: form,
      });
      await fetchMedia();
    } catch (error: any) {
      setUploadError(error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFilePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      await uploadFile(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const files = Array.from(event.dataTransfer.files);
    for (const file of files) {
      // eslint-disable-next-line no-await-in-loop
      await uploadFile(file);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this file?')) return;
    setDeleting(id);
    try {
      await adminApiCall(`/api/admin/media/${id}`, authToken, { method: 'DELETE' });
      if (selected?.id === id) setSelected(null);
      setSelectedIds(prev => prev.filter(item => item !== id));
      await fetchMedia();
    } finally {
      setDeleting(null);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (!confirm(`Delete ${selectedIds.length} selected file(s)?`)) return;
    setBulkDeleting(true);
    try {
      await Promise.all(
        selectedIds.map(id =>
          adminApiCall(`/api/admin/media/${id}`, authToken, {
            method: 'DELETE',
          }),
        ),
      );
      if (selected && selectedIds.includes(selected.id)) {
        setSelected(null);
      }
      setSelectedIds([]);
      await fetchMedia();
    } finally {
      setBulkDeleting(false);
    }
  };

  const copyUrl = (item: MediaItem) => {
    navigator.clipboard.writeText(window.location.origin + item.url);
    setCopied(item.id);
    setTimeout(() => setCopied(null), 2000);
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]));
  };

  const allSelected = items.length > 0 && items.every(item => selectedIds.includes(item.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(items.map(item => item.id));
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="mt-0.5 text-sm text-gray-500">{total} files total</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
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
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {uploadError}
          <button onClick={() => setUploadError(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      <div
        onDragOver={event => { event.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <Upload className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="text-sm text-gray-500">
          Drop files here or <span className="font-medium text-blue-600">click to upload</span>
        </p>
        <p className="mt-1 text-xs text-gray-400">Images, videos, PDFs | Max 20 MB per file</p>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-gray-400" />
          <input
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search files..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={mimeFilter}
          onChange={event => setMimeFilter(event.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All types</option>
          <option value="image/">Images</option>
          <option value="video/">Videos</option>
          <option value="application/pdf">PDFs</option>
        </select>
        <button onClick={fetchMedia} title="Refresh" className="rounded-lg border border-gray-300 p-2 hover:bg-gray-50">
          <RefreshCw className="h-4 w-4 text-gray-500" />
        </button>
        <div className="flex overflow-hidden rounded-lg border border-gray-300">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            className={`border-l border-gray-300 p-2 transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        <div className="min-w-0 flex-1">
          {loading ? (
            <TableSkeleton columns={6} rows={8} />
          ) : items.length === 0 ? (
            <EmptyState title="No files found" description="Upload files or change filters." icon={ImageIcon} />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {items.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelected(item.id === selected?.id ? null : item)}
                  className={`group relative cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${
                    selected?.id === item.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {item.mime_type.startsWith('image/') ? (
                    <img
                      src={item.url}
                      alt={item.alt_text ?? item.filename}
                      className="h-28 w-full bg-gray-100 object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-28 w-full items-center justify-center bg-gray-50">
                      <FileIcon mime={item.mime_type} />
                    </div>
                  )}

                  <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={event => { event.stopPropagation(); toggleSelect(item.id); }}
                      title="Select"
                      className={`rounded p-1 shadow ${selectedIds.includes(item.id) ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:text-blue-600'}`}
                    >
                      {selectedIds.includes(item.id) ? <CheckSquare className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={event => { event.stopPropagation(); copyUrl(item); }}
                      title="Copy URL"
                      className="rounded bg-white p-1 text-gray-600 shadow hover:text-blue-600"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={event => { event.stopPropagation(); handleDelete(item.id); }}
                      disabled={deleting === item.id}
                      title="Delete"
                      className="rounded bg-white p-1 text-gray-600 shadow hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {copied === item.id && (
                    <div className="absolute inset-0 flex items-center justify-center bg-green-500/80 text-xs font-medium text-white">
                      Copied!
                    </div>
                  )}

                  <div className="border-t border-gray-100 bg-white p-1.5">
                    <p className="truncate text-xs text-gray-700">{item.filename}</p>
                    <p className="text-[10px] text-gray-400">{formatBytes(item.file_size)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="w-10 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <button onClick={toggleSelectAll} className="text-gray-500 hover:text-gray-700">
                        {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">File</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Size</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Date</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map(item => (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(item.id === selected?.id ? null : item)}
                      className={`cursor-pointer transition-colors hover:bg-gray-50 ${selected?.id === item.id ? 'bg-blue-50' : ''}`}
                    >
                      <td className="px-4 py-3" onClick={event => event.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.mime_type.startsWith('image/') ? (
                            <img src={item.url} alt="" className="h-10 w-10 rounded border border-gray-200 object-cover" />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded border border-gray-200 bg-gray-100">
                              <FileIcon mime={item.mime_type} />
                            </div>
                          )}
                          <span className="max-w-xs truncate font-medium text-gray-800">{item.filename}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{item.mime_type}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">{formatBytes(item.file_size)}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-400">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString('en-US') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={event => { event.stopPropagation(); copyUrl(item); }}
                            title="Copy URL"
                            className="text-gray-400 transition-colors hover:text-blue-600"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                          <button
                            onClick={event => { event.stopPropagation(); handleDelete(item.id); }}
                            disabled={deleting === item.id}
                            title="Delete"
                            className="text-gray-400 transition-colors hover:text-red-500 disabled:opacity-40"
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

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
              <span>
                {page * limit + 1}–{Math.min((page + 1) * limit, total)} of {total}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(prev => Math.max(0, prev - 1))}
                  disabled={page === 0}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                  disabled={page >= totalPages - 1}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {selected && (
          <div className="w-64 shrink-0">
            <div className="sticky top-20 space-y-3 rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">Details</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selected.mime_type.startsWith('image/') ? (
                <img
                  src={selected.url}
                  alt={selected.alt_text ?? selected.filename}
                  className="w-full rounded-lg border border-gray-200 object-cover"
                />
              ) : (
                <div className="flex h-24 items-center justify-center rounded-lg bg-gray-50">
                  <FileIcon mime={selected.mime_type} />
                </div>
              )}

              <div className="space-y-1.5 text-xs text-gray-600">
                <div><span className="font-medium text-gray-700">Name:</span> {selected.filename}</div>
                <div><span className="font-medium text-gray-700">Type:</span> {selected.mime_type}</div>
                <div><span className="font-medium text-gray-700">Size:</span> {formatBytes(selected.file_size)}</div>
                {selected.width && selected.height && (
                  <div><span className="font-medium text-gray-700">Dimensions:</span> {selected.width}x{selected.height}</div>
                )}
                {selected.created_at && (
                  <div><span className="font-medium text-gray-700">Uploaded:</span> {new Date(selected.created_at).toLocaleDateString('en-US')}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-gray-700">URL</label>
                <div className="flex gap-1.5">
                  <input
                    readOnly
                    value={window.location.origin + selected.url}
                    className="flex-1 truncate rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs"
                  />
                  <button onClick={() => copyUrl(selected)} className="rounded border border-gray-300 p-1.5 hover:bg-gray-50">
                    <Copy className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleDelete(selected.id)}
                disabled={deleting === selected.id}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete file
              </button>
            </div>
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
          {bulkDeleting ? 'Deleting...' : 'Bulk Delete'}
        </button>
      </BulkActionBar>
    </div>
  );
}

