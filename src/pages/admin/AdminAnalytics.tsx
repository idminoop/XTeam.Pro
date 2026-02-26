import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Download, BarChart2, Target,
  DollarSign, Users, CheckCircle, ExternalLink,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { apiCall } from '@/utils/api';
import { toast } from 'sonner';

type Period = '7d' | '30d' | '90d' | '365d';

interface Analytics {
  period: string;
  totalSubmissions: number;
  completedAudits: number;
  averageMaturityScore: number;
  totalEstimatedROI: number;
  conversionRate: number;
  monthlySubmissions: { month: string; submissions: number; conversions?: number }[];
  companySizeBreakdown?: { size: string; count: number }[];
  maturityScoreDistribution?: { range: string; count: number }[];
  industryBreakdown?: { industry: string; count: number; percentage: number }[];
}

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  view_count: number;
  category: string | null;
}

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 дней',  value: '7d' },
  { label: '30 дней', value: '30d' },
  { label: '90 дней', value: '90d' },
  { label: 'Год',     value: '365d' },
];

const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1.5">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-gray-500">{entry.name}:</span>
          <span className="font-medium text-gray-800">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  trend?: number;
  trendLabel?: string;
}

const KpiCard = ({ label, value, icon: Icon, iconBg, trend, trendLabel }: KpiCardProps) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon style={{ width: 18, height: 18 }} />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
    {trendLabel && (
      <div className="flex items-center gap-1.5">
        {trend !== undefined && (
          trend >= 0
            ? <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            : <TrendingDown className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className="text-xs text-gray-400">{trendLabel}</span>
      </div>
    )}
  </div>
);

const MAX_BAR = 100; // for relative bar chart in posts table

export default function AdminAnalytics() {
  const { authToken } = useAdminStore();
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<Analytics | null>(null);
  const [topPosts, setTopPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const [analyticsRes, blogRes] = await Promise.all([
        apiCall(`/api/admin/analytics?period=${period}`, { headers: { Authorization: `Bearer ${authToken}` } }),
        apiCall('/api/admin/analytics/blog', { headers: { Authorization: `Bearer ${authToken}` } }),
      ]);
      setData(await analyticsRes.json());
      const blogData = await blogRes.json();
      setTopPosts(blogData.top_posts ?? []);
    } catch (err) {
      console.error(err);
      toast.error('Не удалось загрузить аналитику');
    } finally {
      setLoading(false);
    }
  }, [authToken, period]);

  useEffect(() => { load(); }, [load]);

  const handleExportCSV = () => {
    if (!data) return;
    const rows = [
      ['Метрика', 'Значение'],
      ['Всего аудитов', data.totalSubmissions],
      ['Завершено', data.completedAudits],
      ['Средний балл зрелости', data.averageMaturityScore?.toFixed(1) ?? '—'],
      ['Конверсия %', data.conversionRate ?? 0],
      ['Суммарный ROI $', data.totalEstimatedROI ?? 0],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Отчёт экспортирован');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-300">
      <BarChart2 className="w-10 h-10 mb-3" />
      <p className="text-sm text-gray-400">Нет данных</p>
    </div>
  );

  const maxViews = topPosts.length > 0 ? Math.max(...topPosts.map(p => p.view_count), 1) : 1;
  const industryData = (data.industryBreakdown ?? []).map(i => ({ ...i, name: i.industry }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* ── Header bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Period selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Период:</span>
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  period === p.value
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer shadow-sm"
        >
          <Download className="w-3.5 h-3.5" />
          Экспорт CSV
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Всего аудитов" value={data.totalSubmissions}
          icon={BarChart2} iconBg="bg-blue-100 text-blue-600"
          trendLabel="за выбранный период"
        />
        <KpiCard
          label="Завершено" value={data.completedAudits}
          icon={CheckCircle} iconBg="bg-emerald-100 text-emerald-600"
          trendLabel={`${data.totalSubmissions > 0 ? Math.round((data.completedAudits / data.totalSubmissions) * 100) : 0}% от всех`}
        />
        <KpiCard
          label="Ср. балл зрелости" value={data.averageMaturityScore?.toFixed(1) ?? '—'}
          icon={Target} iconBg="bg-purple-100 text-purple-600"
          trendLabel="из 100 баллов"
        />
        <KpiCard
          label="Конверсия" value={`${data.conversionRate ?? 0}%`}
          icon={Users} iconBg="bg-amber-100 text-amber-600"
          trendLabel="audit → contact"
        />
        <KpiCard
          label="Суммарный ROI" value={data.totalEstimatedROI ? `$${(data.totalEstimatedROI / 1000).toFixed(0)}k` : '—'}
          icon={DollarSign} iconBg="bg-pink-100 text-pink-600"
          trendLabel="расчётная экономия"
        />
      </div>

      {/* ── Trend chart ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-5">Динамика аудитов по периодам</h3>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data.monthlySubmissions} margin={{ left: -10, right: 4 }}>
            <defs>
              <linearGradient id="gsub" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gconv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              iconType="circle" iconSize={8}
              formatter={(v) => <span className="text-xs text-gray-600">{v}</span>}
            />
            <Area type="monotone" dataKey="submissions" name="Аудиты" stroke="#3B82F6" strokeWidth={2} fill="url(#gsub)" />
            {data.monthlySubmissions.some(d => d.conversions !== undefined) && (
              <Area type="monotone" dataKey="conversions" name="Конверсии" stroke="#10B981" strokeWidth={2} fill="url(#gconv)" />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Size + Maturity charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">По размеру компаний</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.companySizeBreakdown ?? []} margin={{ left: -10, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="size" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Количество" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                {(data.companySizeBreakdown ?? []).map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">Распределение баллов зрелости</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.maturityScoreDistribution ?? []} margin={{ left: -10, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Количество" fill="#10B981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Industry Pie (if available) ── */}
      {industryData.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">Распределение по отраслям</h3>
          <div className="flex flex-col lg:flex-row gap-6 items-center">
            <div className="w-full lg:w-64 shrink-0">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={industryData}
                    cx="50%" cy="50%"
                    outerRadius={85}
                    dataKey="count"
                    labelLine={false}
                    label={(props: any) => (props.percent ?? 0) > 0.05 ? `${Math.round((props.percent ?? 0) * 100)}%` : ''}
                  >
                    {industryData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v, _, props) => [v, props.payload.industry || props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              {industryData.map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-sm text-gray-700 flex-1 truncate">{item.industry}</span>
                  <span className="text-sm font-bold text-gray-800">{item.percentage}%</span>
                  <span className="text-xs text-gray-400">({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Top blog posts ── */}
      {topPosts.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-800">Топ статей блога по просмотрам</h3>
            <a
              href="/admin/blog"
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
            >
              Все статьи <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="space-y-3">
            {topPosts.map((post, idx) => (
              <div key={post.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                {/* Rank */}
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                  idx === 0 ? 'bg-amber-400 text-white' :
                  idx === 1 ? 'bg-gray-300 text-gray-700' :
                  idx === 2 ? 'bg-orange-300 text-white' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {idx + 1}
                </div>

                {/* Title + bar */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate mb-1.5">{post.title}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-700"
                        style={{ width: `${(post.view_count / maxViews) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                {post.category && (
                  <span className="text-xs px-2.5 py-1 bg-gray-100 text-gray-500 rounded-lg shrink-0 hidden sm:block">
                    {post.category}
                  </span>
                )}

                {/* Views */}
                <span className="text-sm font-bold text-blue-600 shrink-0 tabular-nums">
                  {post.view_count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </motion.div>
  );
}
