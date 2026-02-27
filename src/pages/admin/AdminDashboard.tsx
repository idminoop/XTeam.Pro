import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart, Legend,
} from 'recharts';
import {
  Users, FileText, TrendingUp, MessageSquare, BookOpen, Star,
  ArrowUpRight, ArrowDownRight, Activity, Clock, CheckCircle,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { adminApiCall } from '@/utils/adminApi';

interface DashboardStats {
  total_audits: number;
  audits_this_month: number;
  total_contacts: number;
  contacts_this_month: number;
  total_blog_posts: number;
  published_posts: number;
  average_audit_score: number;
  conversion_rate: number;
  recent_activities: { type: string; description: string; timestamp: string }[];
}

interface AnalyticsData {
  monthlySubmissions: { month: string; submissions: number; conversions: number }[];
  industryBreakdown: { industry: string; count: number; percentage: number }[];
  companySizeBreakdown: { size: string; count: number }[];
  maturityScoreDistribution: { range: string; count: number }[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  audit: FileText,
  contact: MessageSquare,
  blog: BookOpen,
  user: Users,
};

const ACTIVITY_COLORS: Record<string, string> = {
  audit: 'bg-blue-100 text-blue-600',
  contact: 'bg-yellow-100 text-yellow-600',
  blog: 'bg-purple-100 text-purple-600',
  user: 'bg-green-100 text-green-600',
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ElementType;
  iconBg: string;
  trend?: number; // positive = up, negative = down
}

const StatCard = ({ label, value, sub, icon: Icon, iconBg, trend }: StatCardProps) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between mb-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider leading-tight">{label}</p>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className="w-4.5 h-4.5" style={{ width: 18, height: 18 }} />
      </div>
    </div>
    <p className="text-3xl font-bold text-gray-900 mb-1.5">{value}</p>
    <div className="flex items-center gap-1.5">
      {trend !== undefined && (
        trend >= 0
          ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
          : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
      )}
      <p className="text-xs text-gray-500">{sub}</p>
    </div>
  </div>
);

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

const renderCustomPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, industry, name }: any) => {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${Math.round(percent * 100)}%`}
    </text>
  );
};

export default function AdminDashboard() {
  const authToken = useAdminStore(state => state.authToken);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authToken) return;
    const load = async () => {
      try {
        const [dashRes, analyticsRes] = await Promise.all([
          adminApiCall('/api/admin/dashboard', authToken),
          adminApiCall('/api/admin/analytics', authToken),
        ]);
        setStats(await dashRes.json());
        setAnalytics(await analyticsRes.json());
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [authToken]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!stats) return (
    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
      <Activity className="w-10 h-10 mb-3" />
      <p className="text-sm">Нет данных для отображения</p>
    </div>
  );

  const industryData = (analytics?.industryBreakdown ?? []).map(item => ({
    ...item,
    name: item.industry,
  }));

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard
          label="Всего аудитов" value={stats.total_audits}
          sub={`+${stats.audits_this_month} за месяц`} trend={stats.audits_this_month}
          icon={FileText} iconBg="bg-blue-100 text-blue-600"
        />
        <StatCard
          label="За месяц" value={stats.audits_this_month}
          sub="новых заявок" trend={stats.audits_this_month}
          icon={TrendingUp} iconBg="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          label="Обращений" value={stats.total_contacts}
          sub={`+${stats.contacts_this_month} новых`} trend={stats.contacts_this_month}
          icon={MessageSquare} iconBg="bg-amber-100 text-amber-600"
        />
        <StatCard
          label="Ср. балл" value={stats.average_audit_score}
          sub="maturity score"
          icon={Star} iconBg="bg-purple-100 text-purple-600"
        />
        <StatCard
          label="Конверсия" value={`${stats.conversion_rate}%`}
          sub="audit → contact"
          icon={Users} iconBg="bg-pink-100 text-pink-600"
        />
        <StatCard
          label="Статей блога" value={stats.published_posts}
          sub={`из ${stats.total_blog_posts} всего`}
          icon={BookOpen} iconBg="bg-indigo-100 text-indigo-600"
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Area chart — wider */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-800">Динамика за 12 месяцев</h3>
            <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">Аудиты · Конверсии</span>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={analytics?.monthlySubmissions ?? []} margin={{ left: -10, right: 4 }}>
              <defs>
                <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorConv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="submissions" name="Аудиты" stroke="#3B82F6" strokeWidth={2} fill="url(#colorSub)" />
              <Area type="monotone" dataKey="conversions" name="Конверсии" stroke="#10B981" strokeWidth={2} fill="url(#colorConv)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Pie chart — narrower */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">По отраслям</h3>
          {industryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={industryData}
                    cx="50%" cy="50%"
                    outerRadius={80}
                    dataKey="count"
                    labelLine={false}
                    label={renderCustomPieLabel}
                  >
                    {industryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number, _: string, props: any) => [v, props.payload.industry || props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {industryData.slice(0, 4).map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-600 truncate flex-1">{item.industry}</span>
                    <span className="font-semibold text-gray-800">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-300 text-sm">Нет данных</div>
          )}
        </div>
      </div>

      {/* ── Activity + Quick actions ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-800">Последние события</h3>
            <Clock className="w-4 h-4 text-gray-400" />
          </div>
          {(stats.recent_activities ?? []).length > 0 ? (
            <ul className="space-y-3">
              {stats.recent_activities.slice(0, 8).map((act, i) => {
                const Icon = ACTIVITY_ICONS[act.type] ?? Activity;
                const colorClass = ACTIVITY_COLORS[act.type] ?? 'bg-gray-100 text-gray-600';
                return (
                  <li key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                      <Icon style={{ width: 14, height: 14 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 leading-snug">{act.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(act.timestamp).toLocaleString('ru-RU', {
                          month: 'short', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="flex flex-col items-center justify-center h-32 text-gray-300">
              <CheckCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">Нет событий</p>
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">Быстрые действия</h3>
          <div className="space-y-3">
            <Link
              to="/admin/contacts?status=new"
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-100 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900">Новые обращения</p>
                  <p className="text-xs text-amber-600">{stats.contacts_this_month} за месяц</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-amber-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {stats.contacts_this_month}
                </span>
                <ArrowUpRight className="w-4 h-4 text-amber-400 group-hover:text-amber-600 transition-colors" />
              </div>
            </Link>

            <Link
              to="/admin/audits"
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-100 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-900">Все аудиты</p>
                  <p className="text-xs text-blue-600">{stats.total_audits} всего</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {stats.total_audits}
                </span>
                <ArrowUpRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>

            <Link
              to="/admin/blog/new"
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-100 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-purple-900">Создать статью</p>
                  <p className="text-xs text-purple-600">{stats.published_posts} опубликовано</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-purple-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {stats.published_posts}
                </span>
                <ArrowUpRight className="w-4 h-4 text-purple-400 group-hover:text-purple-600 transition-colors" />
              </div>
            </Link>

            <Link
              to="/admin/analytics"
              className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 transition-colors group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-900">Аналитика</p>
                  <p className="text-xs text-emerald-600">Конверсия {stats.conversion_rate}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-emerald-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {Math.round(stats.conversion_rate)}%
                </span>
                <ArrowUpRight className="w-4 h-4 text-emerald-400 group-hover:text-emerald-600 transition-colors" />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Company size bar chart ── */}
      {analytics?.companySizeBreakdown && analytics.companySizeBreakdown.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-800 mb-5">Распределение по размеру компаний</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={analytics.companySizeBreakdown} margin={{ left: -10, right: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="size" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Компаний" fill="#3B82F6" radius={[6, 6, 0, 0]}>
                {analytics.companySizeBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </motion.div>
  );
}
