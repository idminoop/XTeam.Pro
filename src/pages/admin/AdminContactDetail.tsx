import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminStore } from '@/store/adminStore';
import { adminApiCall, adminApiJson } from '@/utils/adminApi';

interface ContactDetail {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  position: string | null;
  inquiry_type: string;
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  pipeline_stage: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';
  score: number;
  tags: string[];
  assigned_to: string | null;
  source: string | null;
  preferred_contact_method: string | null;
  budget_range: string | null;
  timeline: string | null;
  is_newsletter_subscribed: boolean;
  is_gdpr_compliant: boolean;
  is_spam: boolean;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  created_at: string | null;
  updated_at: string | null;
  contacted_at: string | null;
}

interface ContactNote {
  id: number;
  note: string;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ContactTask {
  id: number;
  title: string;
  description: string | null;
  due_date: string | null;
  status: 'todo' | 'in_progress' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to: string | null;
  completed_at: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ContactActivity {
  id: number;
  activity_type: string;
  message: string;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string | null;
}

interface EmailTemplateItem {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  is_active: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  qualified: 'bg-purple-100 text-purple-700',
  converted: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-600',
};

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-medium ${active ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {label}
    </button>
  );
}

export default function AdminContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authToken = useAdminStore(state => state.authToken);

  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [status, setStatus] = useState<ContactDetail['status']>('new');
  const [pipelineStage, setPipelineStage] = useState<ContactDetail['pipeline_stage']>('new');
  const [priority, setPriority] = useState<ContactDetail['priority']>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [score, setScore] = useState(0);
  const [tagsInput, setTagsInput] = useState('');

  const [tab, setTab] = useState<'activity' | 'notes' | 'tasks'>('activity');
  const [notes, setNotes] = useState<ContactNote[]>([]);
  const [tasks, setTasks] = useState<ContactTask[]>([]);
  const [activities, setActivities] = useState<ContactActivity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', due_date: '', priority: 'medium' as ContactTask['priority'] });
  const [creatingNote, setCreatingNote] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  const [templates, setTemplates] = useState<EmailTemplateItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | ''>('');
  const [sendingTemplate, setSendingTemplate] = useState(false);

  const loadContact = useCallback(async () => {
    if (!id) return;
    const data = await adminApiJson<ContactDetail>(`/api/admin/contacts/${id}`, authToken);
    setContact(data);
    setStatus(data.status);
    setPipelineStage(data.pipeline_stage);
    setPriority(data.priority);
    setAssignedTo(data.assigned_to ?? '');
    setScore(data.score ?? 0);
    setTagsInput((data.tags ?? []).join(', '));
  }, [id, authToken]);

  const loadNotes = useCallback(async () => {
    if (!id) return;
    const data = await adminApiJson<ContactNote[]>(`/api/admin/contacts/${id}/notes`, authToken);
    setNotes(data);
  }, [id, authToken]);

  const loadTasks = useCallback(async () => {
    if (!id) return;
    const data = await adminApiJson<ContactTask[]>(`/api/admin/contacts/${id}/tasks`, authToken);
    setTasks(data);
  }, [id, authToken]);

  const loadActivities = useCallback(async () => {
    if (!id) return;
    const data = await adminApiJson<ContactActivity[]>(`/api/admin/contacts/${id}/activities`, authToken);
    setActivities(data);
  }, [id, authToken]);

  const loadTemplates = useCallback(async () => {
    const data = await adminApiJson<EmailTemplateItem[]>('/api/admin/email-templates', authToken);
    setTemplates(data.filter(item => item.is_active));
  }, [authToken]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        await Promise.all([loadContact(), loadNotes(), loadTasks(), loadActivities(), loadTemplates()]);
      } catch {
        navigate('/admin/contacts');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, loadContact, loadNotes, loadTasks, loadActivities, loadTemplates, navigate]);

  const parsedTags = useMemo(() => tagsInput.split(',').map(item => item.trim()).filter(Boolean), [tagsInput]);

  const saveContact = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await adminApiCall(`/api/admin/contacts/${id}`, authToken, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          pipeline_stage: pipelineStage,
          priority,
          assigned_to: assignedTo || null,
          score,
          tags: parsedTags,
        }),
      });
      await Promise.all([loadContact(), loadActivities()]);
      toast.success('Контакт обновлён');
    } finally {
      setSaving(false);
    }
  };

  const createNote = async () => {
    if (!id || !newNote.trim()) return;
    setCreatingNote(true);
    try {
      await adminApiCall(`/api/admin/contacts/${id}/notes`, authToken, {
        method: 'POST',
        body: JSON.stringify({ note: newNote.trim() }),
      });
      setNewNote('');
      await Promise.all([loadNotes(), loadActivities()]);
    } finally {
      setCreatingNote(false);
    }
  };

  const deleteNote = async (noteId: number) => {
    if (!id) return;
    await adminApiCall(`/api/admin/contacts/${id}/notes/${noteId}`, authToken, { method: 'DELETE' });
    await Promise.all([loadNotes(), loadActivities()]);
  };

  const createTask = async () => {
    if (!id || !newTask.title.trim()) return;
    setCreatingTask(true);
    try {
      await adminApiCall(`/api/admin/contacts/${id}/tasks`, authToken, {
        method: 'POST',
        body: JSON.stringify({
          title: newTask.title.trim(),
          description: newTask.description.trim() || null,
          due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
          priority: newTask.priority,
        }),
      });
      setNewTask({ title: '', description: '', due_date: '', priority: 'medium' });
      await Promise.all([loadTasks(), loadActivities()]);
    } finally {
      setCreatingTask(false);
    }
  };

  const updateTaskStatus = async (task: ContactTask, newStatus: ContactTask['status']) => {
    if (!id) return;
    await adminApiCall(`/api/admin/contacts/${id}/tasks/${task.id}`, authToken, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    await Promise.all([loadTasks(), loadActivities()]);
  };

  const deleteTask = async (taskId: number) => {
    if (!id) return;
    await adminApiCall(`/api/admin/contacts/${id}/tasks/${taskId}`, authToken, { method: 'DELETE' });
    await Promise.all([loadTasks(), loadActivities()]);
  };

  const sendTemplate = async () => {
    if (!id || !selectedTemplateId) return;
    setSendingTemplate(true);
    try {
      await adminApiCall(`/api/admin/contacts/${id}/send-template`, authToken, {
        method: 'POST',
        body: JSON.stringify({ template_id: selectedTemplateId }),
      });
      toast.success('Письмо отправлено');
      await loadActivities();
    } finally {
      setSendingTemplate(false);
    }
  };

  const deleteContact = async () => {
    if (!id || !contact) return;
    if (!confirm(`Удалить обращение от ${contact.name}?`)) return;
    setDeleting(true);
    try {
      await adminApiCall(`/api/admin/contacts/${id}`, authToken, { method: 'DELETE' });
      toast.success('Контакт удалён');
      navigate('/admin/contacts');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center text-sm text-gray-400">Загрузка...</div>;
  }
  if (!contact) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link to="/admin/contacts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft className="h-4 w-4" />
          Назад к контактам
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-bold text-gray-900">
          #{contact.id} - {contact.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-4 xl:col-span-2">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="mb-3 text-base font-semibold text-gray-800">Информация о контакте</h2>
            <div className="space-y-2 text-sm text-gray-700">
              <p>
                <span className="font-medium">Имя:</span> {contact.name}
              </p>
              <p>
                <span className="font-medium">Email:</span>{' '}
                <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                  {contact.email}
                </a>
              </p>
              {contact.phone && (
                <p>
                  <span className="font-medium">Телефон:</span>{' '}
                  <a href={`tel:${contact.phone}`} className="text-blue-600 hover:underline">
                    {contact.phone}
                  </a>
                </p>
              )}
              <p>
                <span className="font-medium">Компания:</span> {contact.company || '—'}
              </p>
              <p>
                <span className="font-medium">Тема:</span> {contact.subject}
              </p>
              <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-800">{contact.message}</div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="mb-3 flex gap-2">
              <TabButton label="Хронология" active={tab === 'activity'} onClick={() => setTab('activity')} />
              <TabButton label="Заметки" active={tab === 'notes'} onClick={() => setTab('notes')} />
              <TabButton label="Задачи" active={tab === 'tasks'} onClick={() => setTab('tasks')} />
            </div>

            {tab === 'activity' && (
              <div className="space-y-3">
                {activities.length === 0 ? (
                  <p className="text-sm text-gray-400">Активность пока отсутствует.</p>
                ) : (
                  activities.map(item => (
                    <div key={item.id} className="rounded-lg border border-gray-200 p-3 text-sm">
                      <p className="font-medium text-gray-800">{item.message}</p>
                      <p className="text-xs text-gray-500">
                        {item.activity_type} от {item.created_by || 'система'} ·{' '}
                        {item.created_at ? new Date(item.created_at).toLocaleString() : '—'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}

            {tab === 'notes' && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    value={newNote}
                    onChange={event => setNewNote(event.target.value)}
                    placeholder="Добавить заметку..."
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={createNote}
                    disabled={creatingNote || !newNote.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Добавить
                  </button>
                </div>
                {notes.map(note => (
                  <div key={note.id} className="rounded-lg border border-gray-200 p-3">
                    <p className="text-sm text-gray-800">{note.note}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        {note.created_by || 'неизвестно'} · {note.created_at ? new Date(note.created_at).toLocaleString() : '—'}
                      </p>
                      <button onClick={() => deleteNote(note.id)} className="text-xs text-red-600 hover:underline">
                        Удалить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {tab === 'tasks' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <input
                    value={newTask.title}
                    onChange={event => setNewTask(prev => ({ ...prev, title: event.target.value }))}
                    placeholder="Название задачи"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="date"
                    value={newTask.due_date}
                    onChange={event => setNewTask(prev => ({ ...prev, due_date: event.target.value }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <textarea
                    value={newTask.description}
                    onChange={event => setNewTask(prev => ({ ...prev, description: event.target.value }))}
                    rows={2}
                    placeholder="Описание"
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 md:col-span-2"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={newTask.priority}
                    onChange={event => setNewTask(prev => ({ ...prev, priority: event.target.value as ContactTask['priority'] }))}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="low">Низкий</option>
                    <option value="medium">Средний</option>
                    <option value="high">Высокий</option>
                    <option value="urgent">Срочный</option>
                  </select>
                  <button
                    onClick={createTask}
                    disabled={creatingTask || !newTask.title.trim()}
                    className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    Добавить задачу
                  </button>
                </div>
                {tasks.map(task => (
                  <div key={task.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                      <select
                        value={task.status}
                        onChange={event => updateTaskStatus(task, event.target.value as ContactTask['status'])}
                        className="rounded border border-gray-300 px-2 py-1 text-xs"
                      >
                        <option value="todo">К выполнению</option>
                        <option value="in_progress">В работе</option>
                        <option value="done">Готово</option>
                      </select>
                    </div>
                    {task.description && <p className="mt-1 text-xs text-gray-600">{task.description}</p>}
                    <p className="mt-1 text-xs text-gray-500">
                      Срок: {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'} · Приоритет: {{ low: 'Низкий', medium: 'Средний', high: 'Высокий', urgent: 'Срочный' }[task.priority] ?? task.priority}
                    </p>
                    <button onClick={() => deleteTask(task.id)} className="mt-1 text-xs text-red-600 hover:underline">
                      Удалить
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Статус и конвейер</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Статус</label>
                <select value={status} onChange={event => setStatus(event.target.value as ContactDetail['status'])} className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${STATUS_COLORS[status]}`}>
                  <option value="new">Новый</option>
                  <option value="contacted">На связи</option>
                  <option value="qualified">Квалифицирован</option>
                  <option value="converted">Конвертирован</option>
                  <option value="closed">Закрыт</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Стадия конвейера</label>
                <select
                  value={pipelineStage}
                  onChange={event => setPipelineStage(event.target.value as ContactDetail['pipeline_stage'])}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="new">Новый</option>
                  <option value="contacted">На связи</option>
                  <option value="qualified">Квалифицирован</option>
                  <option value="converted">Конвертирован</option>
                  <option value="closed">Закрыт</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Приоритет</label>
                <select value={priority} onChange={event => setPriority(event.target.value as ContactDetail['priority'])} className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ${PRIORITY_COLORS[priority]}`}>
                  <option value="low">Низкий</option>
                  <option value="medium">Средний</option>
                  <option value="high">Высокий</option>
                  <option value="urgent">Срочный</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Исполнитель</label>
                <input
                  value={assignedTo}
                  onChange={event => setAssignedTo(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Оценка</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={event => setScore(Number(event.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Теги (через запятую)</label>
                <input
                  value={tagsInput}
                  onChange={event => setTagsInput(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                onClick={saveContact}
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Быстрый email</h3>
            <div className="space-y-2">
              <select
                value={selectedTemplateId}
                onChange={event => setSelectedTemplateId(event.target.value ? Number(event.target.value) : '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Выбрать шаблон</option>
                {templates.map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              <button
                onClick={sendTemplate}
                disabled={!selectedTemplateId || sendingTemplate}
                className="w-full rounded-lg border border-blue-300 px-3 py-2 text-sm text-blue-700 hover:bg-blue-50 disabled:opacity-50"
              >
                {sendingTemplate ? 'Отправка...' : 'Отправить шаблон'}
              </button>
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" />
                Написать письмо
              </a>
              {contact.phone && (
                <a
                  href={`tel:${contact.phone}`}
                  className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Phone className="h-4 w-4" />
                  Позвонить
                </a>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-red-200 bg-white p-5">
            <button
              onClick={deleteContact}
              disabled={deleting}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? 'Удаление...' : 'Удалить контакт'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

