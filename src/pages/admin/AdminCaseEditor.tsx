import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Plus, Save, Trash2, Globe, FileText } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { adminApiJson } from '@/utils/adminApi';

interface CaseMetric {
  metric_ru: string;
  metric_en: string;
  value: string;
  improvement_ru: string;
  improvement_en: string;
}

interface CasePayload {
  id?: number;
  title_ru: string;
  title_en: string;
  slug: string;
  client_company: string;
  industry_ru: string;
  industry_en: string;
  challenge_ru: string;
  challenge_en: string;
  solution_ru: string;
  solution_en: string;
  results: CaseMetric[];
  roi: string;
  time_saved: string;
  testimonial_ru: string;
  testimonial_en: string;
  featured_image: string;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  sort_order: number;
}

const EMPTY_METRIC: CaseMetric = {
  metric_ru: '',
  metric_en: '',
  value: '',
  improvement_ru: '',
  improvement_en: '',
};

const EMPTY_CASE: CasePayload = {
  title_ru: '',
  title_en: '',
  slug: '',
  client_company: '',
  industry_ru: '',
  industry_en: '',
  challenge_ru: '',
  challenge_en: '',
  solution_ru: '',
  solution_en: '',
  results: [{ ...EMPTY_METRIC }],
  roi: '',
  time_saved: '',
  testimonial_ru: '',
  testimonial_en: '',
  featured_image: '',
  status: 'draft',
  is_featured: false,
  sort_order: 0,
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
function Input(props: InputProps) {
  return (
    <input
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className ?? ''}`}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}
function Textarea(props: TextareaProps) {
  return (
    <textarea
      {...props}
      className={`w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${props.className ?? ''}`}
    />
  );
}

export default function AdminCaseEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authToken = useAdminStore(state => state.authToken);

  const isNew = !id || id === 'new';

  const [payload, setPayload] = useState<CasePayload>(EMPTY_CASE);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slugLocked, setSlugLocked] = useState(!isNew);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      setLoading(true);
      try {
        const data = await adminApiJson<Partial<CasePayload>>(`/api/admin/cases/${id}`, authToken);
        setPayload({
          ...EMPTY_CASE,
          ...data,
          results: Array.isArray(data.results) && data.results.length > 0 ? data.results : [{ ...EMPTY_METRIC }],
          client_company: data.client_company ?? '',
          roi: data.roi ?? '',
          time_saved: data.time_saved ?? '',
          testimonial_ru: data.testimonial_ru ?? '',
          testimonial_en: data.testimonial_en ?? '',
          featured_image: data.featured_image ?? '',
          sort_order: typeof data.sort_order === 'number' ? data.sort_order : 0,
        });
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [authToken, id, isNew]);

  const set = (key: keyof CasePayload, value: any) => {
    setPayload(prev => {
      const next = { ...prev, [key]: value };
      if (key === 'title_en' && !slugLocked) {
        next.slug = slugify(value);
      }
      return next;
    });
  };

  const setMetric = (index: number, key: keyof CaseMetric, value: string) => {
    setPayload(prev => {
      const next = [...prev.results];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, results: next };
    });
  };

  const addMetric = () => setPayload(prev => ({ ...prev, results: [...prev.results, { ...EMPTY_METRIC }] }));
  const removeMetric = (index: number) => {
    setPayload(prev => {
      const next = prev.results.filter((_, idx) => idx !== index);
      return { ...prev, results: next.length > 0 ? next : [{ ...EMPTY_METRIC }] };
    });
  };

  const validate = () => {
    const requiredFields: Array<keyof CasePayload> = [
      'title_ru', 'title_en', 'industry_ru', 'industry_en', 'challenge_ru', 'challenge_en', 'solution_ru', 'solution_en',
    ];

    for (const field of requiredFields) {
      const value = String(payload[field] ?? '').trim();
      if (!value) {
        return `${field} is required`;
      }
    }

    const invalidMetricIndex = payload.results.findIndex(metric =>
      !metric.metric_ru.trim() ||
      !metric.metric_en.trim() ||
      !metric.value.trim() ||
      !metric.improvement_ru.trim() ||
      !metric.improvement_en.trim(),
    );

    if (invalidMetricIndex >= 0) {
      return `Metric #${invalidMetricIndex + 1} must have ru/en labels and improvements`;
    }

    return null;
  };

  const handleSave = async (overrideStatus?: 'draft' | 'published') => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const url = isNew ? '/api/admin/cases' : `/api/admin/cases/${id}`;
      const method = isNew ? 'POST' : 'PUT';
      const response = await adminApiJson<{ id?: number }>(url, authToken, {
        method,
        body: JSON.stringify({
          ...payload,
          status: overrideStatus ?? payload.status,
        }),
      });

      if (isNew && response.id) {
        navigate(`/admin/cases/${response.id}/edit`, { replace: true });
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400 text-sm">Загрузка...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin/cases" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Назад к кейсам
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-bold text-gray-900">{isNew ? 'Новый кейс' : 'Редактировать кейс'}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave('draft')}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm text-gray-700 border border-gray-300 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            Сохранить черновик
          </button>
          <button
            onClick={() => handleSave('published')}
            disabled={saving}
            className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded-lg transition-colors disabled:opacity-50"
          >
            <Globe className="w-4 h-4" />
            {saving ? 'Сохранение...' : 'Опубликовать'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Заголовок (РУ)">
                <Input value={payload.title_ru} onChange={e => set('title_ru', e.target.value)} placeholder="Название кейса на русском" />
              </Field>
              <Field label="Заголовок (EN)">
                <Input value={payload.title_en} onChange={e => set('title_en', e.target.value)} placeholder="Case title in English" />
              </Field>
            </div>

            <Field label="Слаг (URL)">
              <div className="flex gap-2">
                <Input
                  value={payload.slug}
                  onChange={e => set('slug', e.target.value)}
                  placeholder="case-study-slug"
                  readOnly={slugLocked}
                  className={slugLocked ? 'bg-gray-50 cursor-not-allowed' : ''}
                />
                <button
                  type="button"
                  onClick={() => setSlugLocked(value => !value)}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg hover:bg-gray-50 shrink-0"
                >
                  {slugLocked ? 'Изменить' : 'Зафиксировать'}
                </button>
              </div>
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Отрасль (РУ)">
                <Input value={payload.industry_ru} onChange={e => set('industry_ru', e.target.value)} placeholder="Отрасль на русском" />
              </Field>
              <Field label="Отрасль (EN)">
                <Input value={payload.industry_en} onChange={e => set('industry_en', e.target.value)} placeholder="Industry in English" />
              </Field>
            </div>

            <Field label="Компания клиента">
              <Input value={payload.client_company} onChange={e => set('client_company', e.target.value)} placeholder="Название компании" />
            </Field>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Задача / проблема (РУ)">
                <Textarea value={payload.challenge_ru} onChange={e => set('challenge_ru', e.target.value)} rows={5} />
              </Field>
              <Field label="Задача / проблема (EN)">
                <Textarea value={payload.challenge_en} onChange={e => set('challenge_en', e.target.value)} rows={5} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Решение (РУ)">
                <Textarea value={payload.solution_ru} onChange={e => set('solution_ru', e.target.value)} rows={6} />
              </Field>
              <Field label="Решение (EN)">
                <Textarea value={payload.solution_en} onChange={e => set('solution_en', e.target.value)} rows={6} />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Отзыв клиента (РУ)">
                <Textarea value={payload.testimonial_ru} onChange={e => set('testimonial_ru', e.target.value)} rows={4} />
              </Field>
              <Field label="Отзыв клиента (EN)">
                <Textarea value={payload.testimonial_en} onChange={e => set('testimonial_en', e.target.value)} rows={4} />
              </Field>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Метрики (обязательны RU и EN)</h3>
              <button type="button" onClick={addMetric} className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Plus className="w-4 h-4" /> Add metric
              </button>
            </div>

            <div className="space-y-4">
              {payload.results.map((metric, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-gray-500">Metric #{index + 1}</p>
                    <button type="button" onClick={() => removeMetric(index)} className="text-gray-400 hover:text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input value={metric.metric_ru} onChange={e => setMetric(index, 'metric_ru', e.target.value)} placeholder="Название метрики (РУ)" />
                    <Input value={metric.metric_en} onChange={e => setMetric(index, 'metric_en', e.target.value)} placeholder="Название метрики (EN)" />
                    <Input value={metric.value} onChange={e => setMetric(index, 'value', e.target.value)} placeholder="Значение" />
                    <Input value={metric.improvement_ru} onChange={e => setMetric(index, 'improvement_ru', e.target.value)} placeholder="Улучшение (РУ)" />
                    <Input value={metric.improvement_en} onChange={e => setMetric(index, 'improvement_en', e.target.value)} placeholder="Улучшение (EN)" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Публикация</h3>
            <Field label="Статус">
              <select
                value={payload.status}
                onChange={e => set('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="draft">Черновик</option>
                <option value="published">Опубликовано</option>
                <option value="archived">В архиве</option>
              </select>
            </Field>

            <Field label="Порядок сортировки">
              <Input type="number" value={payload.sort_order} onChange={e => set('sort_order', Number(e.target.value || 0))} />
            </Field>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={payload.is_featured} onChange={e => set('is_featured', e.target.checked)} className="rounded" />
              Рекомендуемый кейс
            </label>

            <button
              onClick={() => handleSave()}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Бизнес-результаты</h3>
            <Field label="ROI (окупаемость)">
              <Input value={payload.roi} onChange={e => set('roi', e.target.value)} placeholder="напр. 320%" />
            </Field>
            <Field label="Сэкономленное время">
              <Input value={payload.time_saved} onChange={e => set('time_saved', e.target.value)} placeholder="напр. 12 недель" />
            </Field>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-800">Обложка</h3>
            <Field label="URL изображения">
              <Input value={payload.featured_image} onChange={e => set('featured_image', e.target.value)} placeholder="https://..." />
            </Field>
            {payload.featured_image && (
              <img
                src={payload.featured_image}
                alt={payload.title_en || 'Case image preview'}
                className="w-full h-36 object-cover rounded-lg border border-gray-200"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
