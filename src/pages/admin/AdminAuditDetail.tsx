import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  Calendar,
  RefreshCw,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  ExternalLink,
  ChevronRight,
  FileText,
  Download,
  Trash2,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { apiCall } from '@/utils/api';

interface AuditResult {
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
  estimated_savings: number | null;
  implementation_cost: number | null;
  payback_period: number | null;
  created_at: string;
}

interface AuditDetail {
  id: number;
  company_name: string;
  industry: string;
  company_size: string;
  current_challenges: string[];
  business_processes: string[];
  automation_goals: string[];
  budget_range: string;
  timeline: string;
  contact_email: string;
  contact_name: string | null;
  phone: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string | null;
  result: AuditResult | null;
  pdf_reports: {
    id: number;
    filename: string;
    file_size: number;
    report_type: string;
    generated_at: string | null;
    download_url: string;
    download_count: number;
  }[];
}

const STATUS_CONFIG = {
  completed:  { label: 'Завершён',  color: 'bg-green-100 text-green-700 border-green-200',  icon: CheckCircle },
  processing: { label: 'Обработка', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
  pending:    { label: 'Ожидание',  color: 'bg-gray-100 text-gray-600 border-gray-200',    icon: AlertCircle },
  failed:     { label: 'Ошибка',    color: 'bg-red-100 text-red-700 border-red-200',      icon: XCircle },
};

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const r = 36;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
          <circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${dash} ${circ}`}
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800">
          {score}
        </span>
      </div>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

function TagList({ items, color }: { items: string[]; color: string }) {
  if (!items?.length) return <p className="text-gray-400 text-sm italic">Нет данных</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span key={i} className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>
          {item}
        </span>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">{title}</h3>
      {children}
    </div>
  );
}

export default function AdminAuditDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { authToken } = useAdminStore();
  const [audit, setAudit] = useState<AuditDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reprocessing, setReprocessing] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id || !authToken) return;
    (async () => {
      try {
        const res = await apiCall(`/api/admin/audits/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        if (res.status === 404) { navigate('/admin/audits'); return; }
        const data = await res.json();
        setAudit(data);
      } catch {
        toast.error('Не удалось загрузить аудит');
        navigate('/admin/audits');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, authToken, navigate]);

  const handleReprocess = async () => {
    if (!audit || !confirm('Перезапустить анализ ИИ? Текущий результат будет удалён.')) return;
    setReprocessing(true);
    try {
      await apiCall(`/api/admin/audits/${audit.id}/reprocess`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Анализ запущен заново. Обновите страницу через минуту.');
      setAudit(prev => prev ? { ...prev, status: 'pending', result: null } : prev);
    } catch {
      toast.error('Не удалось запустить повторный анализ');
    } finally {
      setReprocessing(false);
    }
  };

  const handleSendEmail = async () => {
    if (!audit) return;
    setSendingEmail(true);
    try {
      await apiCall(`/api/admin/audits/${audit.id}/send-email`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success(`Письмо отправлено на ${audit.contact_email}`);
    } catch (err: any) {
      const msg = err?.message || 'Не удалось отправить письмо';
      toast.error(msg);
    } finally {
      setSendingEmail(false);
    }
  };

  const handleDelete = async () => {
    if (!audit || !confirm(`Удалить аудит «${audit.company_name}»? Это действие необратимо.`)) return;
    setDeleting(true);
    try {
      await apiCall(`/api/admin/submissions/${audit.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      toast.success('Аудит удалён');
      navigate('/admin/audits');
    } catch {
      toast.error('Не удалось удалить аудит');
    } finally {
      setDeleting(false);
    }
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const fmtCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!audit) return null;

  const statusCfg = STATUS_CONFIG[audit.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 max-w-7xl">

      {/* Header */}
      <div className="bg-white rounded-2xl shadow p-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/admin/audits')}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">{audit.company_name}</h1>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusCfg.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">
                {audit.industry} · {audit.company_size} · Аудит #{audit.id}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">Подан {fmt(audit.created_at)}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
            <Link
              to={`/audit/results/${audit.id}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Открыть результаты
            </Link>
            <button
              onClick={handleReprocess}
              disabled={reprocessing || audit.status === 'processing'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-yellow-300 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-yellow-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reprocessing ? 'animate-spin' : ''}`} />
              {reprocessing ? 'Запуск…' : 'Перезапустить'}
            </button>
            <button
              onClick={handleSendEmail}
              disabled={sendingEmail || audit.status !== 'completed'}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className={`w-3.5 h-3.5 ${sendingEmail ? 'animate-pulse' : ''}`} />
              {sendingEmail ? 'Отправка…' : 'Отправить письмо'}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm border border-red-300 bg-red-50 hover:bg-red-100 rounded-lg text-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              {deleting ? 'Удаление…' : 'Удалить'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left column: audit inputs */}
        <div className="lg:col-span-2 space-y-5">

          {/* Contact info */}
          <Section title="Контактная информация">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Контактное лицо</p>
                  <p className="text-sm font-medium text-gray-800">{audit.contact_name || '—'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <Mail className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <a href={`mailto:${audit.contact_email}`} className="text-sm font-medium text-blue-600 hover:underline">
                    {audit.contact_email}
                  </a>
                </div>
              </div>
              {audit.phone && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Телефон</p>
                    <a href={`tel:${audit.phone}`} className="text-sm font-medium text-gray-800">{audit.phone}</a>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Бюджет / Сроки</p>
                  <p className="text-sm font-medium text-gray-800">{audit.budget_range} · {audit.timeline}</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Challenges */}
          <Section title="Текущие проблемы">
            <TagList items={audit.current_challenges} color="bg-red-50 text-red-700" />
          </Section>

          {/* Processes */}
          <Section title="Бизнес-процессы">
            <TagList items={audit.business_processes} color="bg-purple-50 text-purple-700" />
          </Section>

          {/* Goals */}
          <Section title="Цели автоматизации">
            <TagList items={audit.automation_goals} color="bg-green-50 text-green-700" />
          </Section>

          {/* AI Result */}
          {audit.result && (
            <>
              <Section title="Сильные стороны и слабые места">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <p className="text-xs font-semibold text-green-600 mb-2">Сильные стороны</p>
                    <ul className="space-y-1.5">
                      {(audit.result.strengths || []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <ChevronRight className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" /> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-red-600 mb-2">Слабые стороны</p>
                    <ul className="space-y-1.5">
                      {(audit.result.weaknesses || []).map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <ChevronRight className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" /> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </Section>

              <Section title="Рекомендации">
                <ul className="space-y-2">
                  {(audit.result.recommendations || []).map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </Section>

              {/* Process scores */}
              {audit.result.process_scores && Object.keys(audit.result.process_scores).length > 0 && (
                <Section title="Оценка процессов">
                  <div className="space-y-3">
                    {Object.entries(audit.result.process_scores).map(([proc, score]) => (
                      <div key={proc}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-600 capitalize">{proc.replace(/_/g, ' ')}</span>
                          <span className="font-medium text-gray-800">{score}/100</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </>
          )}

          {/* Pending / processing state */}
          {!audit.result && audit.status !== 'failed' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
              <Clock className="w-10 h-10 text-yellow-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-yellow-700">Анализ ещё не завершён</p>
              <p className="text-xs text-yellow-500 mt-1">Обновите страницу, когда анализ будет завершён</p>
            </div>
          )}

          {!audit.result && audit.status === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
              <XCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-red-700">Анализ завершился с ошибкой</p>
              <p className="text-xs text-red-500 mt-1">Используйте кнопку «Перезапустить» для повторной попытки</p>
            </div>
          )}
        </div>

        {/* Right column: scores + financial */}
        <div className="space-y-5">
          {/* Scores */}
          {audit.result && (
            <Section title="Ключевые показатели">
              <div className="flex justify-around py-2">
                <ScoreRing score={audit.result.maturity_score} label="Зрелость" color="#3b82f6" />
                <ScoreRing score={audit.result.automation_potential} label="Потенциал" color="#10b981" />
              </div>
            </Section>
          )}

          {/* Financial */}
          {audit.result && (
            <Section title="Финансовый анализ">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                  <DollarSign className="w-5 h-5 text-green-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Экономия в год</p>
                    <p className="text-sm font-bold text-green-700">
                      {audit.result.estimated_savings != null
                        ? fmtCurrency(audit.result.estimated_savings)
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">ROI прогноз</p>
                    <p className="text-sm font-bold text-blue-700">{audit.result.roi_projection}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-purple-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Стоимость внедрения</p>
                    <p className="text-sm font-bold text-purple-700">
                      {audit.result.implementation_cost != null
                        ? fmtCurrency(audit.result.implementation_cost)
                        : '—'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-xl">
                  <Target className="w-5 h-5 text-orange-600 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500">Окупаемость</p>
                    <p className="text-sm font-bold text-orange-700">
                      {audit.result.payback_period != null
                        ? `${audit.result.payback_period} мес.`
                        : '—'}
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* Timeline */}
          {audit.result && (
            <Section title="Сроки внедрения">
              <p className="text-sm text-gray-700 font-medium">{audit.result.implementation_timeline}</p>
            </Section>
          )}

          {/* Priority areas */}
          {audit.result && (audit.result.priority_areas || []).length > 0 && (
            <Section title="Приоритетные направления">
              <TagList items={audit.result.priority_areas} color="bg-blue-50 text-blue-700" />
            </Section>
          )}

          {/* Opportunities */}
          {audit.result && (audit.result.opportunities || []).length > 0 && (
            <Section title="Возможности">
              <ul className="space-y-1.5">
                {audit.result.opportunities.map((opp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <ChevronRight className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" /> {opp}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* PDF Reports */}
          {(audit.pdf_reports || []).length > 0 && (
            <Section title="PDF-отчёты">
              <ul className="space-y-2">
                {audit.pdf_reports.map(r => (
                  <li key={r.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <FileText className="w-5 h-5 text-red-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.filename}</p>
                      <p className="text-xs text-gray-400">
                        {(r.file_size / 1024).toFixed(0)} KB
                        {r.generated_at && ` · ${fmt(r.generated_at)}`}
                        {` · скачан ${r.download_count}×`}
                      </p>
                    </div>
                    <a
                      href={r.download_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Скачать"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Metadata */}
          <Section title="Метаданные">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">ID аудита</dt>
                <dd className="font-mono text-gray-700">#{audit.id}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Создан</dt>
                <dd className="text-gray-700 text-right">{fmt(audit.created_at)}</dd>
              </div>
              {audit.updated_at && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Обновлён</dt>
                  <dd className="text-gray-700 text-right">{fmt(audit.updated_at)}</dd>
                </div>
              )}
              {audit.result && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Результат от</dt>
                  <dd className="text-gray-700 text-right">{fmt(audit.result.created_at)}</dd>
                </div>
              )}
            </dl>
          </Section>
        </div>
      </div>
    </motion.div>
  );
}
