import { useCallback, useEffect, useRef, useState } from 'react';
import type { ElementType } from 'react';
import { Bell, MessageSquare, AlertTriangle, Clock } from 'lucide-react';

import { useAdminStore } from '@/store/adminStore';
import { adminApiCall } from '@/utils/adminApi';

interface NotificationItem {
  id: string;
  title: string;
  subtitle?: string | null;
  timestamp?: string | null;
  href?: string | null;
}

interface NotificationGroup {
  key: string;
  label: string;
  count: number;
  items: NotificationItem[];
}

interface NotificationPayload {
  total: number;
  generated_at: string;
  groups: NotificationGroup[];
}

const GROUP_ICONS: Record<string, ElementType> = {
  new_contacts: MessageSquare,
  failed_audits: AlertTriangle,
  overdue_tasks: Clock,
};

export default function NotificationBell() {
  const authToken = useAdminStore(state => state.authToken);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<NotificationPayload | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const loadNotifications = useCallback(async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await adminApiCall('/api/admin/notifications', authToken);
      const data = await res.json() as NotificationPayload;
      setPayload(data);
    } catch {
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadNotifications();
    const timer = setInterval(loadNotifications, 60_000);
    return () => clearInterval(timer);
  }, [loadNotifications]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const total = payload?.total ?? 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="relative rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {total > 0 && (
          <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[360px] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 px-4 py-3">
            <p className="text-sm font-semibold text-gray-800">Notifications</p>
            <p className="text-xs text-gray-500">Auto-refresh every 60 seconds</p>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">Loading…</div>
            )}

            {!loading && (!payload || payload.groups.length === 0 || total === 0) && (
              <div className="px-4 py-6 text-center text-sm text-gray-400">No new notifications</div>
            )}

            {!loading && payload?.groups.map(group => {
              const Icon = GROUP_ICONS[group.key] ?? Bell;
              if (group.count <= 0) return null;
              return (
                <div key={group.key} className="border-t border-gray-100 px-4 py-3 first:border-t-0">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-gray-500" />
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      {group.label} ({group.count})
                    </p>
                  </div>
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <a
                        key={`${group.key}-${item.id}`}
                        href={item.href || '#'}
                        onClick={() => setOpen(false)}
                        className={`block rounded-lg border border-gray-100 px-3 py-2 transition-colors hover:bg-gray-50 ${!item.href ? 'pointer-events-none opacity-80' : ''}`}
                      >
                        <p className="text-sm text-gray-800">{item.title}</p>
                        {item.subtitle && <p className="text-xs text-gray-500">{item.subtitle}</p>}
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
