import { Outlet, useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import NotificationBell from './NotificationBell';

const BREADCRUMB_MAP: Record<string, string> = {
  '/admin/dashboard':  'Dashboard',
  '/admin/audits':     'Аудиты',
  '/admin/contacts':   'Обращения',
  '/admin/blog':       'Блог',
  '/admin/blog/new':   'Новая статья',
  '/admin/blog/edit':  'Редактировать',
  '/admin/media':      'Медиабиблиотека',
  '/admin/analytics':  'Аналитика',
  '/admin/users':      'Пользователи',
  '/admin/settings':   'Настройки',
};

function Breadcrumbs() {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean); // ['admin', 'audits', '42']

  const crumbs: { label: string; to: string }[] = [];
  let path = '';
  for (const part of parts) {
    path += `/${part}`;
    const label = BREADCRUMB_MAP[path];
    if (label) {
      crumbs.push({ label, to: path });
    } else if (/^\d+$/.test(part)) {
      crumbs.push({ label: `#${part}`, to: path });
    } else if (part !== 'admin') {
      crumbs.push({ label: part, to: path });
    }
  }

  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500">
      <Link to="/admin/dashboard" className="hover:text-gray-700 transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.to} className="flex items-center space-x-1">
          <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
          {i < crumbs.length - 1 ? (
            <Link to={crumb.to} className="hover:text-gray-700 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-gray-800 font-medium">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <AdminSidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-sm">
          <Breadcrumbs />
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block">XTeam.Pro Admin Panel</span>
            <NotificationBell />
          </div>
        </header>
        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
