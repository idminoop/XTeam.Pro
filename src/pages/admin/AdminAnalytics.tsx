import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  Download,
  Plus,
  Pencil,
  Trash2,
  Target,
  TrendingDown,
  TrendingUp,
  Filter,
} from 'lucide-react';
import { toast } from 'sonner';

import { useAdminStore } from '@/store/adminStore';
import { adminApiCall } from '@/utils/adminApi';

type Period = '7d' | '30d' | '90d' | '365d';

interface AnalyticsResponse {
  period: string;
  startDate: string;
  endDate: string;
  totalSubmissions: number;
  completedAudits: number;
  averageMaturityScore: number;
  totalEstimatedROI: number;
  conversionRate: number;
  totalContacts: number;
  convertedContacts: number;
  contactConversionRate: number;
  monthlySubmissions: Array<{ month: string; submissions: number; conversions: number }>;
}

interface ComparisonDelta {
  value: number;
  percent: number | null;
}

interface ComparisonResponse {
  delta: Record<string, ComparisonDelta>;
}

interface FunnelResponse {
  stages: Array<{ name: string; value: number }>;
}

interface CohortRow {
  month: string;
  contacts: number;
  converted: number;
  audits: number;
  completed_audits: number;
  conversion_rate: number;
}

interface CohortResponse {
  rows: CohortRow[];
}

interface GoalMetricOption {
  value: string;
  label: string;
}

interface GoalProgressItem {
  id: number;
  metric: string;
  metric_label: string;
  target_value: number;
  current_value: number | null;
  period: Period;
  is_active: boolean;
  progress_percent: number;
  is_reached: boolean;
}

interface GoalsListResponse {
  items: GoalProgressItem[];
  available_metrics: GoalMetricOption[];
}

interface GoalsProgressResponse {
  items: GoalProgressItem[];
}

const PERIODS: Array<{ value: Period; label: string }> = [
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '365d', label: '365d' },
];

const GOAL_PERIODS: Period[] = ['7d', '30d', '90d', '365d'];

function numberFormat(value: number, fractionDigits = 0) {
  return Number(value ?? 0).toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });
}

function DeltaBadge({ delta }: { delta?: ComparisonDelta }) {
  if (!delta) return <span className="text-xs text-gray-400">нет данных</span>;
  const isUp = delta.value >= 0;
  const pct = delta.percent;
  const pctText = pct === null ? 'n/a' : `${Math.abs(pct).toFixed(1)}%`;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
      {isUp ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {isUp ? '+' : '-'}
      {pctText}
    </span>
  );
}

interface GoalFormState {
  metric: string;
  target_value: string;
  period: Period;
  is_active: boolean;
}

const EMPTY_GOAL_FORM: GoalFormState = {
  metric: '',
  target_value: '',
  period: '30d',
  is_active: true,
};

export default function AdminAnalytics() {
  const authToken = useAdminStore(state => state.authToken);

  const [period, setPeriod] = useState<Period>('30d');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [compareWithPrevious, setCompareWithPrevious] = useState(true);

  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null);
  const [funnel, setFunnel] = useState<FunnelResponse | null>(null);
  const [cohort, setCohort] = useState<CohortResponse | null>(null);
  const [goals, setGoals] = useState<GoalProgressItem[]>([]);
  const [metricOptions, setMetricOptions] = useState<GoalMetricOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [savingGoal, setSavingGoal] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalProgressItem | null>(null);
  const [goalForm, setGoalForm] = useState<GoalFormState>(EMPTY_GOAL_FORM);

  const queryString = useMemo(() => {
    const params = new URLSearchParams({ period });
    if (startDate && endDate) {
      params.set('start_date', startDate);
      params.set('end_date', endDate);
    }
    return `?${params.toString()}`;
  }, [period, startDate, endDate]);

  const loadData = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const comparisonRequest = compareWithPrevious
        ? adminApiCall(`/api/admin/analytics/comparison${queryString}`, authToken)
        : Promise.resolve(null);

      const [analyticsRes, funnelRes, cohortRes, goalsRes, goalProgressRes, comparisonRes] = await Promise.all([
        adminApiCall(`/api/admin/analytics${queryString}`, authToken),
        adminApiCall(`/api/admin/analytics/funnel${queryString}`, authToken),
        adminApiCall(`/api/admin/analytics/cohort${queryString}`, authToken),
        adminApiCall('/api/admin/analytics/goals', authToken),
        adminApiCall('/api/admin/analytics/goals/progress', authToken),
        comparisonRequest,
      ]);

      const analyticsData = await analyticsRes.json() as AnalyticsResponse;
      const funnelData = await funnelRes.json() as FunnelResponse;
      const cohortData = await cohortRes.json() as CohortResponse;
      const goalsData = await goalsRes.json() as GoalsListResponse;
      const goalsProgressData = await goalProgressRes.json() as GoalsProgressResponse;

      setAnalytics(analyticsData);
      setFunnel(funnelData);
      setCohort(cohortData);
      setMetricOptions(goalsData.available_metrics ?? []);
      setGoals(goalsProgressData.items ?? []);

      if (comparisonRes) {
        setComparison(await comparisonRes.json() as ComparisonResponse);
      } else {
        setComparison(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('Ошибка загрузки аналитики');
    } finally {
      setLoading(false);
    }
  }, [authToken, compareWithPrevious, queryString]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateGoal = () => {
    const firstMetric = metricOptions[0]?.value ?? '';
    setEditingGoal(null);
    setGoalForm({ ...EMPTY_GOAL_FORM, metric: firstMetric });
    setGoalModalOpen(true);
  };

  const openEditGoal = (goal: GoalProgressItem) => {
    setEditingGoal(goal);
    setGoalForm({
      metric: goal.metric,
      target_value: String(goal.target_value),
      period: goal.period,
      is_active: goal.is_active,
    });
    setGoalModalOpen(true);
  };

  const submitGoal = async () => {
    if (!authToken) return;
    const numericTarget = Number(goalForm.target_value);
    if (!goalForm.metric) {
      toast.error('Выберите метрику');
      return;
    }
    if (!Number.isFinite(numericTarget) || numericTarget <= 0) {
      toast.error('Целевое значение должно быть больше 0');
      return;
    }

    setSavingGoal(true);
    try {
      const payload = {
        metric: goalForm.metric,
        target_value: numericTarget,
        period: goalForm.period,
        is_active: goalForm.is_active,
      };
      if (editingGoal) {
        await adminApiCall(`/api/admin/analytics/goals/${editingGoal.id}`, authToken, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await adminApiCall('/api/admin/analytics/goals', authToken, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setGoalModalOpen(false);
      await loadData();
      toast.success(editingGoal ? 'Цель обновлена' : 'Цель создана');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка сохранения цели');
    } finally {
      setSavingGoal(false);
    }
  };

  const deleteGoal = async (goalId: number) => {
    if (!authToken) return;
    if (!confirm('Удалить эту цель?')) return;
    try {
      await adminApiCall(`/api/admin/analytics/goals/${goalId}`, authToken, { method: 'DELETE' });
      await loadData();
      toast.success('Цель удалена');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка удаления цели');
    }
  };

  const exportPdf = async () => {
    if (!authToken) return;
    setExportingPdf(true);
    try {
      const body: Record<string, unknown> = {
        period,
        include_comparison: compareWithPrevious,
      };
      if (startDate && endDate) {
        body.start_date = startDate;
        body.end_date = endDate;
      }
      const response = await adminApiCall('/api/admin/analytics/export-pdf', authToken, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('PDF экспортирован');
    } catch (error) {
      console.error(error);
      toast.error('Ошибка экспорта PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  const deltaMap = comparison?.delta ?? {};

  const kpis = useMemo(() => {
    if (!analytics) return [];
    return [
      {
        title: 'Обращения',
        value: numberFormat(analytics.totalSubmissions),
        delta: deltaMap.total_submissions,
      },
      {
        title: 'Завершённые аудиты',
        value: numberFormat(analytics.completedAudits),
        delta: deltaMap.completed_audits,
      },
      {
        title: 'Оценка зрелости',
        value: numberFormat(analytics.averageMaturityScore, 1),
        delta: deltaMap.average_maturity_score,
      },
      {
        title: 'Оценочный ROI',
        value: `$${numberFormat(analytics.totalEstimatedROI)}`,
        delta: deltaMap.total_estimated_roi,
      },
      {
        title: 'Конверсия аудитов',
        value: `${numberFormat(analytics.conversionRate, 1)}%`,
        delta: deltaMap.conversion_rate,
      },
      {
        title: 'Конверсия контактов',
        value: `${numberFormat(analytics.contactConversionRate, 1)}%`,
        delta: deltaMap.contact_conversion_rate,
      },
    ];
  }, [analytics, deltaMap]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-sm text-gray-500">
        Аналитические данные недоступны.
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          {PERIODS.map(item => (
            <button
              key={item.value}
              onClick={() => {
                setPeriod(item.value);
                setStartDate('');
                setEndDate('');
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                period === item.value && !startDate && !endDate
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-2 inline-flex items-center gap-1 text-xs text-gray-500">
            <Filter className="h-3.5 w-3.5" />
            Произвольный период
          </span>
          <input
            type="date"
            value={startDate}
            onChange={event => setStartDate(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs"
          />
          <input
            type="date"
            value={endDate}
            onChange={event => setEndDate(event.target.value)}
            className="rounded-md border border-gray-300 px-2 py-1 text-xs"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-600 hover:bg-gray-50"
            >
              Сбросить
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs text-gray-600">
            <input
              type="checkbox"
              checked={compareWithPrevious}
              onChange={event => setCompareWithPrevious(event.target.checked)}
              className="rounded"
            />
            Сравнить с прошлым периодом
          </label>
          <button
            onClick={exportPdf}
            disabled={exportingPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            {exportingPdf ? 'Экспорт...' : 'Экспорт PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {kpis.map(kpi => (
          <div key={kpi.title} className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-gray-500">{kpi.title}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{kpi.value}</p>
            {compareWithPrevious && <div className="mt-2"><DeltaBadge delta={kpi.delta} /></div>}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 xl:col-span-2">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">Динамика обращений</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={analytics.monthlySubmissions}>
              <defs>
                <linearGradient id="submissionsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area type="monotone" dataKey="submissions" stroke="#2563EB" fill="url(#submissionsFill)" />
              <Area type="monotone" dataKey="conversions" stroke="#10B981" fillOpacity={0} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h3 className="mb-4 text-sm font-semibold text-gray-800">Воронка</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={funnel?.stages ?? []}>
              <CartesianGrid stroke="#F1F5F9" strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#0EA5E9" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Цели</h3>
          <button
            onClick={openCreateGoal}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Добавить цель
          </button>
        </div>
        {goals.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
            Целей пока нет.
          </div>
        ) : (
          <div className="space-y-3">
            {goals.map(goal => {
              const progress = Math.max(0, Math.min(100, goal.progress_percent ?? 0));
              return (
                <div key={goal.id} className="rounded-xl border border-gray-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{goal.metric_label}</p>
                      <p className="text-xs text-gray-500">
                        {goal.current_value ?? 0} / {goal.target_value} ({goal.period})
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditGoal(goal)}
                        className="rounded p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-700"
                        title="Редактировать"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteGoal(goal.id)}
                        className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-700"
                        title="Удалить"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full ${goal.is_reached ? 'bg-emerald-500' : 'bg-blue-500'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{numberFormat(goal.progress_percent, 1)}%</span>
                    <span>{goal.is_active ? 'активна' : 'неактивна'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-gray-800">Когортная конверсия</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="py-2 pr-3">Месяц</th>
                <th className="py-2 pr-3">Контакты</th>
                <th className="py-2 pr-3">Конвертировано</th>
                <th className="py-2 pr-3">Конверсия</th>
                <th className="py-2 pr-3">Аудиты</th>
                <th className="py-2 pr-3">Завершённых аудитов</th>
              </tr>
            </thead>
            <tbody>
              {(cohort?.rows ?? []).map(row => (
                <tr key={row.month} className="border-b border-gray-100">
                  <td className="py-2 pr-3 text-gray-700">{row.month}</td>
                  <td className="py-2 pr-3">{numberFormat(row.contacts)}</td>
                  <td className="py-2 pr-3">{numberFormat(row.converted)}</td>
                  <td className="py-2 pr-3">{numberFormat(row.conversion_rate, 1)}%</td>
                  <td className="py-2 pr-3">{numberFormat(row.audits)}</td>
                  <td className="py-2 pr-3">{numberFormat(row.completed_audits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {goalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900">
                {editingGoal ? 'Редактировать цель' : 'Создать цель'}
              </h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Метрика</label>
                <select
                  value={goalForm.metric}
                  onChange={event => setGoalForm(prev => ({ ...prev, metric: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="">Выбрать метрику</option>
                  {metricOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Целевое значение</label>
                <input
                  type="number"
                  min={0}
                  step="0.1"
                  value={goalForm.target_value}
                  onChange={event => setGoalForm(prev => ({ ...prev, target_value: event.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Период</label>
                <select
                  value={goalForm.period}
                  onChange={event => setGoalForm(prev => ({ ...prev, period: event.target.value as Period }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {GOAL_PERIODS.map(item => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={goalForm.is_active}
                  onChange={event => setGoalForm(prev => ({ ...prev, is_active: event.target.checked }))}
                  className="rounded"
                />
                Цель активна
              </label>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setGoalModalOpen(false)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={submitGoal}
                disabled={savingGoal}
                className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {savingGoal ? 'Сохранение...' : editingGoal ? 'Сохранить' : 'Создать'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

