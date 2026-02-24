import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, MessageSquare, BookOpen,
  Image, BarChart2, Users, Settings, ChevronLeft, ChevronRight, LogOut,
} from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard',      permission: null },
  { to: '/admin/audits',    icon: FileText,         label: 'Аудиты',         permission: 'can_manage_audits' as const },
  { to: '/admin/contacts',  icon: MessageSquare,    label: 'Обращения',      permission: null },
  { to: '/admin/blog',      icon: BookOpen,         label: 'Блог',           permission: 'can_manage_content' as const },
  { to: '/admin/media',     icon: Image,            label: 'Медиа',          permission: 'can_manage_content' as const },
  { to: '/admin/analytics', icon: BarChart2,        label: 'Аналитика',      permission: 'can_view_analytics' as const },
  { to: '/admin/users',     icon: Users,            label: 'Пользователи',   permission: 'can_manage_users' as const },
  { to: '/admin/settings',  icon: Settings,         label: 'Настройки',      permission: null },
];

export default function AdminSidebar() {
  const { sidebarCollapsed, toggleSidebar, adminUser, logout, hasPermission } = useAdminStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login', { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter(({ permission }) =>
    !permission || hasPermission(permission),
  );

  return (
    <aside
      className={cn(
        'flex flex-col bg-gray-900 text-white transition-all duration-200 shrink-0 h-full',
        sidebarCollapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo row */}
      <div
        className={cn(
          'flex items-center py-5 border-b border-gray-700',
          sidebarCollapsed ? 'justify-center px-2' : 'px-4 justify-between',
        )}
      >
        {!sidebarCollapsed && (
          <span className="text-lg font-bold tracking-tight">
            XTeam<span className="text-blue-400">.Pro</span>
          </span>
        )}
        <button
          onClick={toggleSidebar}
          className="text-gray-400 hover:text-white p-1 rounded transition-colors"
          aria-label={sidebarCollapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white',
                sidebarCollapsed && 'justify-center',
              )
            }
            title={sidebarCollapsed ? label : undefined}
          >
            <Icon className={cn('w-5 h-5 shrink-0', !sidebarCollapsed && 'mr-3')} />
            {!sidebarCollapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* User info + logout */}
      <div className={cn('border-t border-gray-700 py-3 px-2', sidebarCollapsed && 'flex flex-col items-center')}>
        {!sidebarCollapsed && adminUser && (
          <div className="px-3 pb-2">
            <p className="text-sm font-medium text-white truncate">{adminUser.full_name}</p>
            <p className="text-xs text-gray-400 capitalize">{adminUser.role.replace('_', ' ')}</p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className={cn(
            'flex items-center rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white transition-colors w-full',
            sidebarCollapsed && 'justify-center',
          )}
          title={sidebarCollapsed ? 'Выйти' : undefined}
        >
          <LogOut className={cn('w-5 h-5 shrink-0', !sidebarCollapsed && 'mr-3')} />
          {!sidebarCollapsed && 'Выйти'}
        </button>
      </div>
    </aside>
  );
}
