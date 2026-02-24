import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download, TrendingUp, Target, Zap, AlertCircle, CheckCircle2,
  ArrowRight, Clock, RefreshCw, Brain, BarChart2, Lightbulb,
  DollarSign, Calendar, Award, ChevronRight,
} from 'lucide-react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, Cell,
} from 'recharts';
import { toast } from 'sonner';
import { buildContactPath } from '../utils/contactQuery';

interface AuditResult {
  audit_id: string;
  company_name: string;
  maturity_score: number;
  automation_potential: number;
  roi_projection: number;
  implementation_timeline: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recommendations: string[];
  process_scores: Record<string, number>;
  priority_areas: string[];
  estimated_savings?: number;
  implementation_cost?: number;
  payback_period?: number;
  pdf_report_url?: string;
  created_at: string;
  status: string;
}

interface AuditStatus {
  audit_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string');

const isProcessScores = (value: unknown): value is Record<string, number> => {
  if (!value || typeof value !== 'object') return false;
  return Object.values(value as Record<string, unknown>).every(
    (score) => typeof score === 'number' && Number.isFinite(score),
  );
};

const isAuditResultPayload = (value: unknown): value is AuditResult => {
  if (!value || typeof value !== 'object') return false;
  const payload = value as Partial<AuditResult>;
  return (
    typeof payload.audit_id === 'string' &&
    typeof payload.company_name === 'string' &&
    typeof payload.maturity_score === 'number' &&
    typeof payload.automation_potential === 'number' &&
    typeof payload.roi_projection === 'number' &&
    typeof payload.implementation_timeline === 'string' &&
    isStringArray(payload.strengths) &&
    isStringArray(payload.weaknesses) &&
    isStringArray(payload.opportunities) &&
    isStringArray(payload.recommendations) &&
    isProcessScores(payload.process_scores) &&
    isStringArray(payload.priority_areas) &&
    typeof payload.created_at === 'string' &&
    typeof payload.status === 'string'
  );
};

const PROCESSING_STEPS = [
  { icon: Brain, label: 'Анализ бизнес-процессов', key: 'step1' },
  { icon: BarChart2, label: 'Оценка потенциала автоматизации', key: 'step2' },
  { icon: DollarSign, label: 'Расчёт ROI и экономии', key: 'step3' },
  { icon: Lightbulb, label: 'Формирование рекомендаций', key: 'step4' },
];

const ROI_COLORS = ['#ef4444', '#10b981', '#3b82f6'];

export default function AuditResults() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(0);

  const checkAuditStatus = useCallback(async (): Promise<AuditStatus | null> => {
    if (!id) return null;
    try {
      const response = await fetch(`${API_BASE_URL}/api/audit/status/${id}`);
      if (response.ok) {
        const status = await response.json();
        return status as AuditStatus;
      }
      return null;
    } catch (err) {
      console.error('Error checking audit status:', err);
      return null;
    }
  }, [id]);

  const fetchResults = useCallback(async (): Promise<'completed' | 'processing'> => {
    if (!id) throw new Error('Missing audit identifier');
    const response = await fetch(`${API_BASE_URL}/api/audit/results/${id}`);
    if (response.status === 202) {
      setProcessing(true);
      setLoading(false);
      return 'processing';
    }
    if (response.status === 200) {
      const data = await response.json();
      if (!isAuditResultPayload(data)) throw new Error('Invalid audit result payload');
      setResult(data);
      setProcessing(false);
      setLoading(false);
      toast.success('Результаты аудита готовы!');
      return 'completed';
    }
    throw new Error(`Failed to fetch audit results (${response.status})`);
  }, [id]);

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval> | undefined;
    let progressInterval: ReturnType<typeof setInterval> | undefined;
    let stepInterval: ReturnType<typeof setInterval> | undefined;

    const startPolling = async () => {
      if (!id) return;
      try {
        const initialState = await fetchResults();
        if (initialState === 'completed') return;
        const status = await checkAuditStatus();
        if (status?.status === 'processing' || initialState === 'processing') {
          setProcessing(true);
          setLoading(false);
          let currentProgress = 0;
          progressInterval = setInterval(() => {
            currentProgress += Math.random() * 12;
            if (currentProgress > 90) currentProgress = 90;
            setProgress(currentProgress);
          }, 2000);
          stepInterval = setInterval(() => {
            setActiveStep(prev => (prev + 1) % PROCESSING_STEPS.length);
          }, 3000);
          pollInterval = setInterval(async () => {
            try {
              const pollState = await fetchResults();
              if (pollState === 'completed') {
                clearInterval(pollInterval);
                clearInterval(progressInterval);
                clearInterval(stepInterval);
                setProgress(100);
              }
            } catch {
              clearInterval(pollInterval);
              clearInterval(progressInterval);
              clearInterval(stepInterval);
              setError('Unable to load audit results. Please try again later.');
              setLoading(false);
            }
          }, 5000);
        } else if (status?.status === 'completed') {
          await fetchResults();
        } else {
          setError('Audit not found or failed to process');
          setLoading(false);
        }
      } catch (err) {
        setError('Unable to load audit results. Please try again later.');
        console.error('Error fetching audit results:', err);
        setLoading(false);
      }
    };

    startPolling();
    return () => {
      if (pollInterval) clearInterval(pollInterval);
      if (progressInterval) clearInterval(progressInterval);
      if (stepInterval) clearInterval(stepInterval);
    };
  }, [id, checkAuditStatus, fetchResults]);

  const handleDownloadReport = () => {
    if (result?.pdf_report_url) {
      window.open(result.pdf_report_url, '_blank');
    } else {
      window.open(`${API_BASE_URL}/api/audit/download/${id}`, '_blank');
    }
  };

  const handleBookConsultation = () => {
    navigate(buildContactPath({ source: 'audit_consultation' }));
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">{t('auditResults.loading')}</p>
        </motion.div>
      </div>
    );
  }

  // ── Processing ───────────────────────────────────────────────────────────
  if (processing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-lg w-full"
        >
          {/* Animated AI icon */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-blue-100 animate-ping opacity-50" />
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
              <Brain className="w-9 h-9 text-white" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auditResults.processing.title')}</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">{t('auditResults.processing.subtitle')}</p>

          {/* Steps */}
          <div className="space-y-3 mb-8 text-left">
            {PROCESSING_STEPS.map((step, idx) => {
              const Icon = step.icon;
              const done = idx < activeStep;
              const active = idx === activeStep;
              return (
                <div
                  key={step.key}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                    active ? 'bg-blue-50 border border-blue-200' :
                    done ? 'opacity-50' : 'opacity-30'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    done ? 'bg-green-100' : active ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-green-600" />
                      : <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-400'}`} />
                    }
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-blue-800' : 'text-gray-600'}`}>
                    {step.label}
                  </span>
                  {active && <RefreshCw className="w-3.5 h-3.5 ml-auto text-blue-500 animate-spin" />}
                </div>
              );
            })}
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 mb-3 overflow-hidden">
            <motion.div
              className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
          <p className="text-sm text-gray-400">{Math.round(progress)}% · {t('auditResults.processing.timeEstimate')}</p>
        </motion.div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-2xl p-10 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('auditResults.error.title')}</h2>
          <p className="text-gray-500 mb-8">{error || t('auditResults.error.subtitle')}</p>
          <button
            onClick={() => navigate('/audit')}
            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium cursor-pointer"
          >
            {t('auditResults.error.button')}
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  const radarData = Object.entries(result.process_scores).map(([category, score]) => ({
    category: category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    score,
    fullMark: 100,
  }));

  const roiData = [
    {
      name: t('auditResults.metrics.currentState'),
      cost: result.implementation_cost || 0,
      savings: 0,
      net: -(result.implementation_cost || 0),
    },
    {
      name: `После ${result.payback_period || 12} мес.`,
      cost: result.implementation_cost || 0,
      savings: result.estimated_savings || 0,
      net: (result.estimated_savings || 0) - (result.implementation_cost || 0),
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: 'text-emerald-600', bg: 'bg-emerald-50', ring: '#10b981', label: t('auditResults.ratings.excellent') };
    if (score >= 60) return { text: 'text-blue-600', bg: 'bg-blue-50', ring: '#3b82f6', label: t('auditResults.ratings.good') };
    if (score >= 40) return { text: 'text-amber-600', bg: 'bg-amber-50', ring: '#f59e0b', label: t('auditResults.ratings.fair') };
    return { text: 'text-red-600', bg: 'bg-red-50', ring: '#ef4444', label: t('auditResults.ratings.needsImprovement') };
  };

  const scoreStyle = getScoreColor(result.maturity_score);
  const circumference = 2 * Math.PI * 50;
  const strokeDashoffset = circumference - (result.maturity_score / 100) * circumference;

  const cardVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
  };

  // ── Result UI ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-10 max-w-6xl">

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-4">
            <CheckCircle2 className="w-4 h-4" />
            Аудит завершён · {new Date(result.created_at).toLocaleDateString('ru-RU')}
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {result.company_name}
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            {t('auditResults.subtitle')}
          </p>
        </motion.div>

        {/* ── Score + Key Metrics ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Maturity Score */}
          <motion.div
            custom={0} variants={cardVariants} initial="hidden" animate="visible"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center"
          >
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-6">
              {t('auditResults.maturityScore.title')}
            </h2>
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="50" stroke="#f1f5f9" strokeWidth="10" fill="none" />
                <circle
                  cx="60" cy="60" r="50"
                  stroke={scoreStyle.ring} strokeWidth="10" fill="none"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">{result.maturity_score}</span>
                <span className="text-xs text-gray-400">/ 100</span>
              </div>
            </div>
            <div className={`mt-5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold ${scoreStyle.bg} ${scoreStyle.text}`}>
              <Award className="w-4 h-4" />
              {scoreStyle.label}
            </div>
          </motion.div>

          {/* Key Metrics */}
          <motion.div
            custom={1} variants={cardVariants} initial="hidden" animate="visible"
            className="lg:col-span-2 grid grid-cols-2 gap-4"
          >
            {[
              {
                icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50',
                value: result.estimated_savings ? `$${result.estimated_savings.toLocaleString()}` : '—',
                label: t('auditResults.metrics.annualSavings'),
              },
              {
                icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50',
                value: result.implementation_cost ? `$${result.implementation_cost.toLocaleString()}` : '—',
                label: t('auditResults.metrics.implementationCost'),
              },
              {
                icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50',
                value: result.payback_period ? `${result.payback_period} мес.` : '—',
                label: t('auditResults.metrics.paybackPeriod'),
              },
              {
                icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50',
                value: `${result.automation_potential}%`,
                label: t('auditResults.metrics.automationPotential'),
              },
            ].map(({ icon: Icon, color, bg, value, label }) => (
              <div key={label} className={`${bg} rounded-2xl p-5 border border-white`}>
                <div className={`w-9 h-9 rounded-xl bg-white flex items-center justify-center mb-3 shadow-sm`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <div className={`text-2xl font-bold ${color} mb-1`}>{value}</div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── ROI Chart ── */}
        <motion.div
          custom={2} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            {t('auditResults.roiForecast.title')}
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roiData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
                <Bar dataKey="cost" name={t('auditResults.metrics.investment')} radius={[6,6,0,0]}>
                  {roiData.map((_, i) => <Cell key={i} fill={ROI_COLORS[0]} />)}
                </Bar>
                <Bar dataKey="savings" name={t('auditResults.metrics.savings')} radius={[6,6,0,0]}>
                  {roiData.map((_, i) => <Cell key={i} fill={ROI_COLORS[1]} />)}
                </Bar>
                <Bar dataKey="net" name={t('auditResults.metrics.netBenefit')} radius={[6,6,0,0]}>
                  {roiData.map((_, i) => <Cell key={i} fill={ROI_COLORS[2]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── Radar Chart ── */}
        <motion.div
          custom={3} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            {t('auditResults.maturityAssessment.title')}
          </h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
                <Radar
                  name={t('auditResults.metrics.currentScore')}
                  dataKey="score"
                  stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.25} strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ── SWOT ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {[
            {
              custom: 4,
              title: t('auditResults.sections.strengths'),
              icon: CheckCircle2, iconColor: 'text-emerald-500',
              items: result.strengths,
              itemBg: 'bg-emerald-50', itemIcon: CheckCircle2, itemIconColor: 'text-emerald-600',
            },
            {
              custom: 5,
              title: t('auditResults.sections.weaknesses'),
              icon: AlertCircle, iconColor: 'text-red-500',
              items: result.weaknesses,
              itemBg: 'bg-red-50', itemIcon: AlertCircle, itemIconColor: 'text-red-500',
            },
            {
              custom: 6,
              title: t('auditResults.sections.opportunities'),
              icon: Zap, iconColor: 'text-amber-500',
              items: result.opportunities,
              itemBg: 'bg-amber-50', itemIcon: Zap, itemIconColor: 'text-amber-500',
            },
          ].map(({ custom, title, icon: TitleIcon, iconColor, items, itemBg, itemIcon: ItemIcon, itemIconColor }) => (
            <motion.div
              key={title}
              custom={custom} variants={cardVariants} initial="hidden" animate="visible"
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6"
            >
              <h2 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <TitleIcon className={`w-5 h-5 ${iconColor}`} />
                {title}
              </h2>
              <div className="space-y-3">
                {items.map((item, idx) => (
                  <div key={idx} className={`flex items-start gap-3 p-3 ${itemBg} rounded-xl`}>
                    <ItemIcon className={`w-4 h-4 ${itemIconColor} mt-0.5 shrink-0`} />
                    <span className="text-sm text-gray-700 leading-snug">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Recommendations ── */}
        <motion.div
          custom={7} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8"
        >
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-500" />
            {t('auditResults.sections.recommendations')}
          </h2>
          <div className="space-y-3">
            {result.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shrink-0">
                  {idx + 1}
                </div>
                <span className="text-sm text-gray-700 leading-relaxed">{rec}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Priority Areas ── */}
        {result.priority_areas && result.priority_areas.length > 0 && (
          <motion.div
            custom={8} variants={cardVariants} initial="hidden" animate="visible"
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" />
              {t('auditResults.sections.priorities')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {result.priority_areas.map((priority, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-colors cursor-default">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                    idx === 0 ? 'bg-purple-600 text-white' :
                    idx === 1 ? 'bg-blue-600 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-sm text-gray-700 font-medium leading-snug">{priority}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── CTA ── */}
        <motion.div
          custom={9} variants={cardVariants} initial="hidden" animate="visible"
          className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl shadow-xl p-10 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-3">{t('auditResults.cta.title')}</h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
            {t('auditResults.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleDownloadReport}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white/15 hover:bg-white/25 border border-white/30 text-white rounded-xl transition-colors font-medium cursor-pointer backdrop-blur-sm"
            >
              <Download className="w-5 h-5" />
              {t('auditResults.cta.downloadReport')}
            </button>
            <button
              onClick={handleBookConsultation}
              className="flex items-center justify-center gap-2 px-8 py-3.5 bg-white text-blue-700 rounded-xl hover:bg-blue-50 transition-colors font-semibold cursor-pointer shadow-lg"
            >
              {t('auditResults.cta.bookConsultation')}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
