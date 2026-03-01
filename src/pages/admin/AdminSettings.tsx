import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Save, RotateCcw, Mail, Server, Globe, CheckCircle, XCircle, Loader2, Database, Download, Trash2, Archive } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { adminApiCall } from '@/utils/adminApi';

interface AuditConfig {
  ai_model: string;
  analysis_depth: string;
  include_roi_analysis: boolean;
  include_risk_assessment: boolean;
  include_implementation_roadmap: boolean;
  pdf_generation_enabled: boolean;
  auto_send_reports: boolean;
  notification_settings: {
    new_submissions?: boolean;
    weekly_reports?: boolean;
    completion_alerts?: boolean;
  };
}

interface SmtpConfig {
  smtp_server: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

interface GeneralConfig {
  site_name: string;
  site_url: string;
  support_email: string;
  admin_email: string;
  maintenance_mode: boolean;
}

interface BackupItem {
  name: string;
  mode: 'db_media' | 'db' | 'media';
  size_bytes: number;
  created_at: string;
  created_by: string;
}

const DEFAULT_AUDIT: AuditConfig = {
  ai_model: 'gpt-4',
  analysis_depth: 'standard',
  include_roi_analysis: true,
  include_risk_assessment: true,
  include_implementation_roadmap: true,
  pdf_generation_enabled: true,
  auto_send_reports: false,
  notification_settings: { new_submissions: true, weekly_reports: false, completion_alerts: true },
};

const DEFAULT_SMTP: SmtpConfig = {
  smtp_server: 'smtp.gmail.com',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  from_email: '',
  from_name: 'XTeam.Pro',
};

const DEFAULT_GENERAL: GeneralConfig = {
  site_name: 'XTeam.Pro',
  site_url: 'https://xteam.pro',
  support_email: '',
  admin_email: '',
  maintenance_mode: false,
};

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className={`w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-gray-300'}`} />
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
}

function Field({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string | number; onChange: (v: string) => void;
  type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-5">
      <h3 className="text-base font-semibold text-gray-800 border-b pb-3 flex items-center gap-2">
        {icon} {title}
      </h3>
      {children}
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(2)} GB`;
}

function modeLabel(mode: BackupItem['mode']) {
  if (mode === 'db') return 'Только БД';
  if (mode === 'media') return 'Только медиа';
  return 'БД + Медиа';
}

export default function AdminSettings() {
  const authToken = useAdminStore(state => state.authToken);
  const adminUser = useAdminStore(state => state.adminUser);
  const isSuperAdmin = adminUser?.role === 'super_admin';

  const [auditCfg, setAuditCfg] = useState<AuditConfig>(DEFAULT_AUDIT);
  const [smtp, setSmtp] = useState<SmtpConfig>(DEFAULT_SMTP);
  const [general, setGeneral] = useState<GeneralConfig>(DEFAULT_GENERAL);
  const [backups, setBackups] = useState<BackupItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [creatingBackup, setCreatingBackup] = useState<BackupItem['mode'] | null>(null);
  const [downloadingBackup, setDownloadingBackup] = useState<string | null>(null);
  const [deletingBackup, setDeletingBackup] = useState<string | null>(null);

  const loadBackups = useCallback(async () => {
    if (!authToken || !isSuperAdmin) return;
    try {
      const res = await adminApiCall('/api/admin/backups', authToken);
      if (!res.ok) return;
      const data = await res.json();
      setBackups(Array.isArray(data.items) ? data.items : []);
    } catch {
      setBackups([]);
    }
  }, [authToken, isSuperAdmin]);

  const loadAll = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const [cfgRes, sysRes] = await Promise.all([
        adminApiCall('/api/admin/configuration', authToken),
        adminApiCall('/api/admin/settings', authToken),
      ]);
      if (cfgRes.ok) {
        const d = await cfgRes.json();
        setAuditCfg({ ...DEFAULT_AUDIT, ...d });
      }
      if (sysRes.ok) {
        const d = await sysRes.json();
        if (d.smtp) setSmtp({ ...DEFAULT_SMTP, ...d.smtp, smtp_password: '' });
        if (d.general) setGeneral({ ...DEFAULT_GENERAL, ...d.general });
      }
      if (isSuperAdmin) {
        await loadBackups();
      }
    } catch {
      // Keep defaults.
    } finally {
      setLoading(false);
    }
  }, [authToken, isSuperAdmin, loadBackups]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleSaveAudit = async () => {
    if (!authToken) return;
    setSaving(true);
    try {
      await adminApiCall('/api/admin/configuration', authToken, {
        method: 'PUT',
        body: JSON.stringify(auditCfg),
      });
      toast.success('Настройки ИИ сохранены');
    } catch {
      toast.error('Ошибка сохранения настроек ИИ');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSystem = async () => {
    if (!authToken) return;
    setSaving(true);
    try {
      await adminApiCall('/api/admin/settings', authToken, {
        method: 'PUT',
        body: JSON.stringify({ smtp, general }),
      });
      toast.success('Системные настройки сохранены');
    } catch {
      toast.error('Ошибка сохранения настроек');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!authToken) return;
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const res = await adminApiCall('/api/admin/settings/test-smtp', authToken, {
        method: 'POST',
      });
      const data = await res.json();
      setSmtpTestResult(data);
      if (data.ok) toast.success('SMTP-соединение установлено');
      else toast.error(`Ошибка SMTP: ${data.message}`);
    } catch {
      toast.error('Тест SMTP не прошёл');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleCreateBackup = async (mode: BackupItem['mode']) => {
    if (!authToken) return;
    setCreatingBackup(mode);
    try {
      const res = await adminApiCall('/api/admin/backups', authToken, {
        method: 'POST',
        body: JSON.stringify({ mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.detail || 'Ошибка создания резервной копии');
      }
      toast.success(`Резервная копия создана: ${data.name}`);
      await loadBackups();
    } catch (e: any) {
      toast.error(e.message || 'Ошибка создания резервной копии');
    } finally {
      setCreatingBackup(null);
    }
  };

  const handleDownloadBackup = async (name: string) => {
    if (!authToken) return;
    setDownloadingBackup(name);
    try {
      const res = await adminApiCall(`/api/admin/backups/${name}/download`, authToken);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || 'Ошибка загрузки резервной копии');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast.error(e.message || 'Ошибка загрузки резервной копии');
    } finally {
      setDownloadingBackup(null);
    }
  };

  const handleDeleteBackup = async (name: string) => {
    if (!authToken) return;
    if (!confirm(`Удалить резервную копию ${name}?`)) return;

    setDeletingBackup(name);
    try {
      const res = await adminApiCall(`/api/admin/backups/${name}`, authToken, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.detail || 'Ошибка удаления резервной копии');
      }
      toast.success('Резервная копия удалена');
      await loadBackups();
    } catch (e: any) {
      toast.error(e.message || 'Ошибка удаления резервной копии');
    } finally {
      setDeletingBackup(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl space-y-6">
      <Card title="Настройки ИИ" icon={<Server className="w-4 h-4 text-blue-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Модель OpenAI</label>
            <select
              value={auditCfg.ai_model}
              onChange={e => setAuditCfg(c => ({ ...c, ai_model: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-4-turbo">GPT-4 Turbo</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Глубина анализа</label>
            <select
              value={auditCfg.analysis_depth}
              onChange={e => setAuditCfg(c => ({ ...c, analysis_depth: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="basic">Базовый</option>
              <option value="standard">Стандартный</option>
              <option value="comprehensive">Расширенный</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Toggle label="Анализ ROI" checked={auditCfg.include_roi_analysis} onChange={v => setAuditCfg(c => ({ ...c, include_roi_analysis: v }))} />
          <Toggle label="Оценка рисков" checked={auditCfg.include_risk_assessment} onChange={v => setAuditCfg(c => ({ ...c, include_risk_assessment: v }))} />
          <Toggle label="Дорожная карта" checked={auditCfg.include_implementation_roadmap} onChange={v => setAuditCfg(c => ({ ...c, include_implementation_roadmap: v }))} />
          <Toggle label="Генерация PDF" checked={auditCfg.pdf_generation_enabled} onChange={v => setAuditCfg(c => ({ ...c, pdf_generation_enabled: v }))} />
          <Toggle label="Автоотправка отчётов" checked={auditCfg.auto_send_reports} onChange={v => setAuditCfg(c => ({ ...c, auto_send_reports: v }))} />
        </div>
        <div className="pt-1 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">Уведомления по email</p>
          <div className="space-y-3">
            {([
              ['new_submissions', 'Новые обращения'],
              ['weekly_reports', 'Еженедельные отчёты'],
              ['completion_alerts', 'Уведомления о завершении'],
            ] as [string, string][]).map(([key, label]) => (
              <Toggle
                key={key}
                label={label}
                checked={Boolean(auditCfg.notification_settings?.[key as keyof typeof auditCfg.notification_settings])}
                onChange={v => setAuditCfg(c => ({
                  ...c,
                  notification_settings: { ...c.notification_settings, [key]: v },
                }))}
              />
            ))}
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <button onClick={loadAll} className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">
            <RotateCcw className="w-4 h-4" /> Сбросить
          </button>
          <button onClick={handleSaveAudit} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" /> {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </Card>

      <Card title="Общие настройки" icon={<Globe className="w-4 h-4 text-purple-500" />}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Название сайта" value={general.site_name} onChange={v => setGeneral(g => ({ ...g, site_name: v }))} />
          <Field label="URL сайта" value={general.site_url} onChange={v => setGeneral(g => ({ ...g, site_url: v }))} type="url" />
          <Field label="Email поддержки" value={general.support_email} onChange={v => setGeneral(g => ({ ...g, support_email: v }))} type="email" />
          <Field label="Email администратора" value={general.admin_email} onChange={v => setGeneral(g => ({ ...g, admin_email: v }))} type="email" />
        </div>
        <Toggle label="Режим обслуживания" checked={general.maintenance_mode} onChange={v => setGeneral(g => ({ ...g, maintenance_mode: v }))} />
      </Card>

      <Card title="SMTP / Email" icon={<Mail className="w-4 h-4 text-green-500" />}>
        {!isSuperAdmin && (
          <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            Настройки SMTP доступны только Супер-администратору.
          </div>
        )}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${!isSuperAdmin ? 'opacity-50 pointer-events-none select-none' : ''}`}>
          <Field label="SMTP-сервер" value={smtp.smtp_server} onChange={v => setSmtp(s => ({ ...s, smtp_server: v }))} placeholder="smtp.gmail.com" />
          <Field label="SMTP-порт" value={smtp.smtp_port} onChange={v => setSmtp(s => ({ ...s, smtp_port: Number(v) }))} type="number" placeholder="587" />
          <Field label="Логин" value={smtp.smtp_username} onChange={v => setSmtp(s => ({ ...s, smtp_username: v }))} type="email" />
          <Field label="Пароль / App-пароль" value={smtp.smtp_password} onChange={v => setSmtp(s => ({ ...s, smtp_password: v }))} type="password" placeholder="Оставьте пустым, чтобы не менять" />
          <Field label="Email отправителя" value={smtp.from_email} onChange={v => setSmtp(s => ({ ...s, from_email: v }))} type="email" />
          <Field label="Имя отправителя" value={smtp.from_name} onChange={v => setSmtp(s => ({ ...s, from_name: v }))} />
        </div>

        {smtpTestResult && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${smtpTestResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {smtpTestResult.ok ? <CheckCircle className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            {smtpTestResult.message}
          </div>
        )}
      </Card>

      {isSuperAdmin && (
        <Card title="Резервные копии" icon={<Archive className="w-4 h-4 text-indigo-500" />}>
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-sm text-indigo-700">
            Пример cron для автоматического бекапа каждый день в 02:00 UTC:
            <div className="mt-1 font-mono text-xs break-all">
              {'curl -X POST https://your-domain/api/admin/backups -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d \'{"mode":"db_media"}\''}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleCreateBackup('db_media')}
              disabled={creatingBackup !== null}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              {creatingBackup === 'db_media' ? 'Создание...' : 'БД + Медиа'}
            </button>
            <button
              onClick={() => handleCreateBackup('db')}
              disabled={creatingBackup !== null}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Database className="w-4 h-4" />
              {creatingBackup === 'db' ? 'Создание...' : 'Только БД'}
            </button>
            <button
              onClick={() => handleCreateBackup('media')}
              disabled={creatingBackup !== null}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              <Archive className="w-4 h-4" />
              {creatingBackup === 'media' ? 'Создание...' : 'Только медиа'}
            </button>
          </div>

          <div className="overflow-x-auto border border-gray-200 rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Название</th>
                  <th className="px-4 py-3">Тип</th>
                  <th className="px-4 py-3">Размер</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Автор</th>
                  <th className="px-4 py-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {backups.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">Резервных копий нет</td>
                  </tr>
                ) : backups.map(item => (
                  <tr key={item.name}>
                    <td className="px-4 py-3 font-medium text-gray-800">{item.name}</td>
                    <td className="px-4 py-3 text-gray-600">{modeLabel(item.mode)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatFileSize(item.size_bytes)}</td>
                    <td className="px-4 py-3 text-gray-600">{new Date(item.created_at).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600">{item.created_by || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleDownloadBackup(item.name)}
                          disabled={downloadingBackup === item.name}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-300 rounded text-xs hover:bg-gray-50 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5" />
                          {downloadingBackup === item.name ? '...' : 'Скачать'}
                        </button>
                        <button
                          onClick={() => handleDeleteBackup(item.name)}
                          disabled={deletingBackup === item.name}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-red-200 text-red-600 rounded text-xs hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {deletingBackup === item.name ? '...' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {isSuperAdmin && (
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleTestSmtp}
            disabled={testingSmtp}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {testingSmtp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
            {testingSmtp ? 'Проверка...' : 'Тест SMTP'}
          </button>
          <button
            onClick={handleSaveSystem}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </div>
      )}
    </motion.div>
  );
}
