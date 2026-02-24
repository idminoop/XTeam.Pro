import { useEffect, useState, useRef } from 'react';
import { X, Upload, Check, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { apiCall } from '@/utils/api';

interface MediaFile {
  id: number;
  url: string;
  filename: string;
  alt_text: string | null;
  title: string | null;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
}

interface MediaPickerModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string, alt: string) => void;
}

export default function MediaPickerModal({ open, onClose, onSelect }: MediaPickerModalProps) {
  const { authToken } = useAdminStore();
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !authToken) return;
    setSelected(null);
    loadFiles();
  }, [open, authToken]);

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await apiCall('/api/admin/media?mime_prefix=image/&limit=50', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      setFiles(data.items ?? []);
    } catch {
      toast.error('Не удалось загрузить медиафайлы');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Допустимы только изображения');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/admin/media', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const newFile: MediaFile = await res.json();
      setFiles(prev => [newFile, ...prev]);
      setSelected(newFile);
      toast.success('Файл загружен');
    } catch {
      toast.error('Ошибка загрузки файла');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (!selected) return;
    onSelect(selected.url, selected.alt_text ?? selected.filename);
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Медиабиблиотека</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Загрузить
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Нет загруженных изображений</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 text-blue-600 text-sm hover:underline"
              >
                Загрузить первое изображение
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-3">
              {files.map(f => (
                <button
                  key={f.id}
                  onClick={() => setSelected(selected?.id === f.id ? null : f)}
                  className={`relative group rounded-lg overflow-hidden border-2 transition-all ${
                    selected?.id === f.id
                      ? 'border-blue-600 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <img
                    src={f.url}
                    alt={f.alt_text ?? f.filename}
                    className="w-full h-24 object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23f1f5f9"/><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="%2394a3b8" font-size="12">IMG</text></svg>'; }}
                  />
                  {selected?.id === f.id && (
                    <div className="absolute inset-0 bg-blue-600/20 flex items-center justify-center">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="px-1.5 py-1 text-left">
                    <p className="text-xs text-gray-600 truncate" title={f.filename}>{f.filename}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {selected ? `Выбрано: ${selected.filename}` : 'Выберите изображение'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selected}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Вставить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
