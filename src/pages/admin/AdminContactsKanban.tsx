import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GripVertical, Inbox, RefreshCw } from 'lucide-react';
import { adminApiCall, adminApiJson } from '@/utils/adminApi';
import { useAdminStore } from '@/store/adminStore';
import TableSkeleton from '@/components/admin/TableSkeleton';
import EmptyState from '@/components/admin/EmptyState';

type PipelineStage = 'new' | 'contacted' | 'qualified' | 'converted' | 'closed';

interface ContactCard {
  id: number;
  inquiry_id: string;
  name: string;
  email: string;
  company: string | null;
  subject: string;
  score: number;
  tags: string[];
  priority: string;
  status: string;
  pipeline_stage: PipelineStage;
}

interface PipelineColumn {
  stage: PipelineStage;
  count: number;
  items: ContactCard[];
}

interface PipelineResponse {
  stages: PipelineStage[];
  columns: PipelineColumn[];
}

const STAGE_LABELS: Record<PipelineStage, string> = {
  new: 'Новый',
  contacted: 'На связи',
  qualified: 'Квалифицирован',
  converted: 'Конвертирован',
  closed: 'Закрыт',
};

export default function AdminContactsKanban() {
  const authToken = useAdminStore(state => state.authToken);
  const [columns, setColumns] = useState<PipelineColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [savingId, setSavingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApiJson<PipelineResponse>('/api/admin/contacts/pipeline', authToken);
      setColumns(data.columns ?? []);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    load();
  }, [load]);

  const stageMap = useMemo(() => {
    const map: Record<PipelineStage, ContactCard[]> = {
      new: [],
      contacted: [],
      qualified: [],
      converted: [],
      closed: [],
    };
    for (const column of columns) {
      map[column.stage] = column.items;
    }
    return map;
  }, [columns]);
  const totalCards = useMemo(
    () => columns.reduce((acc, column) => acc + column.items.length, 0),
    [columns],
  );

  const moveLocal = (contactId: number, toStage: PipelineStage) => {
    setColumns(prev => {
      let moving: ContactCard | null = null;
      const next = prev.map(column => {
        const remaining = column.items.filter(item => {
          if (item.id === contactId) {
            moving = { ...item, pipeline_stage: toStage, status: toStage };
            return false;
          }
          return true;
        });
        return { ...column, items: remaining, count: remaining.length };
      });

      if (!moving) return prev;

      return next.map(column => {
        if (column.stage !== toStage) return column;
        const updated = [moving!, ...column.items];
        return { ...column, items: updated, count: updated.length };
      });
    });
  };

  const onDrop = async (event: React.DragEvent<HTMLDivElement>, toStage: PipelineStage) => {
    event.preventDefault();
    const rawId = event.dataTransfer.getData('text/plain');
    const contactId = Number(rawId);
    setDraggingId(null);
    if (!contactId || Number.isNaN(contactId)) return;

    moveLocal(contactId, toStage);
    setSavingId(contactId);
    try {
      await adminApiCall(`/api/admin/contacts/${contactId}`, authToken, {
        method: 'PATCH',
        body: JSON.stringify({
          pipeline_stage: toStage,
          status: toStage,
        }),
      });
    } catch {
      await load();
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <TableSkeleton columns={5} rows={8} className="border-0 rounded-none" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Канбан</h1>
          <p className="text-sm text-gray-500">Перетаскивайте карточки между стадиями для обновления воронки.</p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
        >
          <RefreshCw className="h-4 w-4" />
          Обновить
        </button>
      </div>

      {totalCards === 0 ? (
        <EmptyState
          title="Канбан пуст"
          description="Контакты не найдены. Новые обращения появятся здесь автоматически."
          icon={Inbox}
          ctaLabel="Обновить"
          onCtaClick={load}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
          {(Object.keys(stageMap) as PipelineStage[]).map(stage => (
            <div
              key={stage}
              className="rounded-xl border border-gray-200 bg-white"
              onDragOver={event => event.preventDefault()}
              onDrop={event => onDrop(event, stage)}
            >
              <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
                <h2 className="text-sm font-semibold text-gray-800">{STAGE_LABELS[stage]}</h2>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{stageMap[stage].length}</span>
              </div>
              <div className="min-h-[320px] space-y-2 p-3">
                {stageMap[stage].map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={event => {
                      event.dataTransfer.setData('text/plain', String(card.id));
                      setDraggingId(card.id);
                    }}
                    className={`rounded-lg border border-gray-200 bg-gray-50 p-3 ${draggingId === card.id ? 'opacity-60' : ''}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-gray-900">{card.name}</p>
                      <GripVertical className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="line-clamp-1 text-xs text-gray-500">{card.company || card.email}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-gray-600">{card.subject}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        Оценка: {card.score}
                      </span>
                      <Link to={`/admin/contacts/${card.id}`} className="text-xs text-blue-600 hover:underline">
                        Открыть
                      </Link>
                    </div>
                    {card.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {card.tags.slice(0, 3).map(tag => (
                          <span key={`${card.id}-${tag}`} className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-600">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    {savingId === card.id && <p className="mt-2 text-[10px] text-gray-400">Сохранение...</p>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
