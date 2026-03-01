#!/usr/bin/env python3
"""Russify AdminSettings, AdminAnalytics, AdminEmailTemplates (remaining), AdminUsers (remaining)."""
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def patch(rel, replacements):
    fp = os.path.join(BASE, rel.replace('/', os.sep))
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    hits = 0
    for old, new in replacements:
        if old in content:
            content = content.replace(old, new)
            hits += 1
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  OK {rel} ({hits}/{len(replacements)} hits)')


# ═══════════════════════════════════════════════════════════════════════════════
# AdminSettings.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminSettings.tsx...')
patch('src/pages/admin/AdminSettings.tsx', [
    # modeLabel
    ("if (mode === 'db') return 'DB only';", "if (mode === 'db') return 'Только БД';"),
    ("if (mode === 'media') return 'Media only';", "if (mode === 'media') return 'Только медиа';"),
    ("return 'DB + Media';", "return 'БД + Медиа';"),
    # Toast messages
    ("toast.success('AI configuration saved')", "toast.success('Настройки ИИ сохранены')"),
    ("toast.error('Failed to save AI configuration')", "toast.error('Ошибка сохранения настроек ИИ')"),
    ("toast.success('System settings saved')", "toast.success('Системные настройки сохранены')"),
    ("toast.error('Failed to save system settings')", "toast.error('Ошибка сохранения настроек')"),
    ("toast.success('SMTP connection successful')", "toast.success('SMTP-соединение установлено')"),
    ("`SMTP error: ${data.message}`", "`Ошибка SMTP: ${data.message}`"),
    ("toast.error('SMTP test failed')", "toast.error('Тест SMTP не прошёл')"),
    ("toast.success(`Backup created: ${data.name}`)", "toast.success(`Резервная копия создана: ${data.name}`)"),
    ("'Failed to create backup'", "'Ошибка создания резервной копии'"),
    ("'Failed to download backup'", "'Ошибка загрузки резервной копии'"),
    ("`Delete backup ${name}?`", "`Удалить резервную копию ${name}?`"),
    ("toast.success('Backup deleted')", "toast.success('Резервная копия удалена')"),
    ("'Failed to delete backup'", "'Ошибка удаления резервной копии'"),
    # Card titles
    ('title="AI Configuration"', 'title="Настройки ИИ"'),
    ('title="General Settings"', 'title="Общие настройки"'),
    ('title="SMTP / Email"', 'title="SMTP / Email"'),
    ('title="Backups"', 'title="Резервные копии"'),
    # Labels
    ("label='OpenAI Model'", "label='Модель OpenAI'"),
    (">OpenAI Model</label>", ">Модель OpenAI</label>"),
    (">Analysis Depth</label>", ">Глубина анализа</label>"),
    (">Basic</option>", ">Базовый</option>"),
    (">Standard</option>", ">Стандартный</option>"),
    (">Comprehensive</option>", ">Расширенный</option>"),
    # Toggles
    ('label="ROI analysis"', 'label="Анализ ROI"'),
    ('label="Risk assessment"', 'label="Оценка рисков"'),
    ('label="Implementation roadmap"', 'label="Дорожная карта"'),
    ('label="PDF generation"', 'label="Генерация PDF"'),
    ('label="Auto-send reports"', 'label="Автоотправка отчётов"'),
    ('label="Maintenance mode"', 'label="Режим обслуживания"'),
    # Email notifications
    ("'Email Notifications'", "'Уведомления по email'"),
    ("Email Notifications", "Уведомления по email"),
    ("['new_submissions', 'New submissions']", "['new_submissions', 'Новые обращения']"),
    ("['weekly_reports', 'Weekly reports']", "['weekly_reports', 'Еженедельные отчёты']"),
    ("['completion_alerts', 'Completion alerts']", "['completion_alerts', 'Уведомления о завершении']"),
    # Buttons
    ("> Reset\n          </button>", "> Сбросить\n          </button>"),
    ("saving ? 'Saving...' : 'Save'", "saving ? 'Сохранение...' : 'Сохранить'"),
    ("saving ? 'Saving...' : 'Save Settings'", "saving ? 'Сохранение...' : 'Сохранить настройки'"),
    ("testingSmtp ? 'Testing...' : 'Test SMTP'", "testingSmtp ? 'Проверка...' : 'Тест SMTP'"),
    # General settings field labels
    ('label="Site name"', 'label="Название сайта"'),
    ('label="Site URL"', 'label="URL сайта"'),
    ('label="Support email"', 'label="Email поддержки"'),
    ('label="Admin email"', 'label="Email администратора"'),
    # SMTP fields
    ('label="SMTP server"', 'label="SMTP-сервер"'),
    ('label="SMTP port"', 'label="SMTP-порт"'),
    ('label="Username"', 'label="Логин"'),
    ('label="Password / App Password"', 'label="Пароль / App-пароль"'),
    ('placeholder="Leave empty to keep current"', 'placeholder="Оставьте пустым, чтобы не менять"'),
    ('label="From email"', 'label="Email отправителя"'),
    ('label="From name"', 'label="Имя отправителя"'),
    # SMTP notice
    ('SMTP settings can be edited only by Super Admin.', 'Настройки SMTP доступны только Супер-администратору.'),
    # Backup table headers
    ('>Name</th>', '>Название</th>'),
    ('>Mode</th>', '>Тип</th>'),
    ('>Size</th>', '>Размер</th>'),
    ('>Date</th>', '>Дата</th>'),
    ('>Author</th>', '>Автор</th>'),
    ('>Actions</th>', '>Действия</th>'),
    ('No backups yet', 'Резервных копий нет'),
    # Backup buttons
    ("creatingBackup === 'db_media' ? 'Creating...' : 'DB + Media'",
     "creatingBackup === 'db_media' ? 'Создание...' : 'БД + Медиа'"),
    ("creatingBackup === 'db' ? 'Creating...' : 'DB only'",
     "creatingBackup === 'db' ? 'Создание...' : 'Только БД'"),
    ("creatingBackup === 'media' ? 'Creating...' : 'Media only'",
     "creatingBackup === 'media' ? 'Создание...' : 'Только медиа'"),
    ("downloadingBackup === item.name ? '...' : 'Download'",
     "downloadingBackup === item.name ? '...' : 'Скачать'"),
    ("deletingBackup === item.name ? '...' : 'Delete'",
     "deletingBackup === item.name ? '...' : 'Удалить'"),
    # Cron hint
    ('Cron example for automatic backups every day at 02:00 UTC:',
     'Пример cron для автоматического бекапа каждый день в 02:00 UTC:'),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminAnalytics.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminAnalytics.tsx...')
patch('src/pages/admin/AdminAnalytics.tsx', [
    # DeltaBadge
    ("'no delta'", "'нет данных'"),
    # KPI titles
    ("title: 'Submissions'", "title: 'Обращения'"),
    ("title: 'Completed Audits'", "title: 'Завершённые аудиты'"),
    ("title: 'Maturity Score'", "title: 'Оценка зрелости'"),
    ("title: 'Estimated ROI'", "title: 'Оценочный ROI'"),
    ("title: 'Audit Conversion'", "title: 'Конверсия аудитов'"),
    ("title: 'Contact Conversion'", "title: 'Конверсия контактов'"),
    # Period filter
    ("Custom range", "Произвольный период"),
    (">Clear\n            </button>", ">Сбросить\n            </button>"),
    ("Compare with previous period", "Сравнить с прошлым периодом"),
    ("exportingPdf ? 'Exporting...' : 'Export PDF'", "exportingPdf ? 'Экспорт...' : 'Экспорт PDF'"),
    # Chart headings
    (">Submissions Trend</h3>", ">Динамика обращений</h3>"),
    (">Funnel</h3>", ">Воронка</h3>"),
    (">Goals</h3>", ">Цели</h3>"),
    (">Monthly Cohort Conversion</h3>", ">Когортная конверсия</h3>"),
    # Goals section
    (">Add Goal\n", ">Добавить цель\n"),
    ("No goals yet.", "Целей пока нет."),
    ("goal.is_active ? 'active' : 'inactive'", "goal.is_active ? 'активна' : 'неактивна'"),
    # Cohort table headers
    (">Month</th>", ">Месяц</th>"),
    (">Contacts</th>", ">Контакты</th>"),
    (">Converted</th>", ">Конвертировано</th>"),
    (">Rate</th>", ">Конверсия</th>"),
    (">Audits</th>", ">Аудиты</th>"),
    (">Completed Audits</th>", ">Завершённых аудитов</th>"),
    # Empty/error states
    ("No analytics data available.", "Аналитические данные недоступны."),
    # Goal modal
    ("editingGoal ? 'Edit Goal' : 'Create Goal'", "editingGoal ? 'Редактировать цель' : 'Создать цель'"),
    (">Metric</label>", ">Метрика</label>"),
    (">Choose metric</option>", ">Выбрать метрику</option>"),
    (">Target Value</label>", ">Целевое значение</label>"),
    (">Period</label>", ">Период</label>"),
    ("Goal is active", "Цель активна"),
    (">Cancel\n", ">Отмена\n"),
    ("savingGoal ? 'Saving...' : editingGoal ? 'Save' : 'Create'",
     "savingGoal ? 'Сохранение...' : editingGoal ? 'Сохранить' : 'Создать'"),
    # Validations / toasts
    ("toast.error('Choose a metric')", "toast.error('Выберите метрику')"),
    ("toast.error('Target value must be greater than 0')", "toast.error('Целевое значение должно быть больше 0')"),
    ("toast.error('Failed to load analytics')", "toast.error('Ошибка загрузки аналитики')"),
    ("toast.success(editingGoal ? 'Goal updated' : 'Goal created')",
     "toast.success(editingGoal ? 'Цель обновлена' : 'Цель создана')"),
    ("toast.error('Failed to save goal')", "toast.error('Ошибка сохранения цели')"),
    ("if (!confirm('Delete this goal?'))", "if (!confirm('Удалить эту цель?'))"),
    ("toast.success('Goal deleted')", "toast.success('Цель удалена')"),
    ("toast.error('Failed to delete goal')", "toast.error('Ошибка удаления цели')"),
    ("toast.success('PDF exported')", "toast.success('PDF экспортирован')"),
    ("toast.error('Failed to export PDF')", "toast.error('Ошибка экспорта PDF')"),
    # icon titles
    ('title="Edit"', 'title="Редактировать"'),
    ('title="Delete"', 'title="Удалить"'),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminEmailTemplates.tsx — remaining strings
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminEmailTemplates.tsx (remaining)...')
patch('src/pages/admin/AdminEmailTemplates.tsx', [
    # EmptyState
    ('title="No templates yet"', 'title="Шаблонов нет"'),
    ('description="Create your first email template to speed up replies."',
     'description="Создайте первый шаблон письма для быстрых ответов."'),
    # Form field labels
    ('>Name</label>', '>Название</label>'),
    ('>Subject</label>', '>Тема</label>'),
    ('>Body (HTML supported)</label>', '>Тело письма (HTML)</label>'),
    ('Template is active', 'Шаблон активен'),
    # Saving button state
    ("saving ? 'Saving...' : 'Сохранить шаблон'", "saving ? 'Сохранение...' : 'Сохранить шаблон'"),
    # Placeholder hints
    ("Use placeholders:", "Используйте переменные:"),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminUsers.tsx — remaining UI strings
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminUsers.tsx (remaining UI)...')
patch('src/pages/admin/AdminUsers.tsx', [
    # Page header buttons
    ('Add Role', 'Добавить роль'),
    # Tabs
    (">\n            Users\n          </button>", ">\n            Пользователи\n          </button>"),
    (">\n            Roles\n          </button>", ">\n            Роли\n          </button>"),
    # EmptyState
    ('title="No users found"', 'title="Пользователей нет"'),
    ('description="Create your first admin user."', 'description="Создайте первого администратора."'),
    ('title="No role templates found"', 'title="Шаблонов ролей нет"'),
    ('description="Create a role template to reuse permission sets."',
     'description="Создайте шаблон роли для повторного использования прав."'),
    # Table headers (users)
    ('>User</th>', '>Пользователь</th>'),
    ('>Role</th>', '>Роль</th>'),
    ('>Permissions</th>', '>Права</th>'),
    ('>Status</th>', '>Статус</th>'),
    ('>Last Login</th>', '>Последний вход</th>'),
    ('>Actions</th>', '>Действия</th>'),
    # Status badges
    ("user.is_active ? 'Active' : 'Inactive'", "user.is_active ? 'Активен' : 'Неактивен'"),
    ('Locked', 'Заблокирован'),
    # Permissions count
    ('permissions', 'прав'),
    # Button titles
    ('title="Unlock account"', 'title="Разблокировать"'),
    ('title="Reset password"', 'title="Сбросить пароль"'),
    ('title="Edit user"', 'title="Редактировать"'),
    ('title="Delete user"', 'title="Удалить"'),
    ('title="Edit role"', 'title="Редактировать роль"'),
    ('title="Delete role"', 'title="Удалить роль"'),
    ('title="Refresh"', 'title="Обновить"'),
    # Role template table
    ('>Name</th>', '>Название</th>'),
    ('{template.is_system ? \'System\' : \'Custom\'}', "{template.is_system ? 'Системный' : 'Пользовательский'}"),
    # Bulk actions
    ("bulkDeletingUsers ? 'Deleting...' : 'Bulk Delete Users'",
     "bulkDeletingUsers ? 'Удаление...' : 'Удалить выбранных'"),
    ("bulkDeletingRoles ? 'Deleting...' : 'Bulk Delete Roles'",
     "bulkDeletingRoles ? 'Удаление...' : 'Удалить выбранные'"),
    # Create user form
    ("'Failed to create user'", "'Ошибка создания пользователя'"),
    ("saving ? 'Creating...' : 'Create User'", "saving ? 'Создание...' : 'Создать пользователя'"),
    # Edit user form
    ("'Failed to update user'", "'Ошибка обновления пользователя'"),
    ("saving ? 'Saving...' : 'Save Changes'", "saving ? 'Сохранение...' : 'Сохранить'"),
    # Reset password form
    ("'Password must be at least 8 characters.'", "'Пароль должен содержать не менее 8 символов.'"),
    ("'Failed to update password'", "'Ошибка смены пароля'"),
    ("saving ? 'Updating...' : 'Reset Password'", "saving ? 'Обновление...' : 'Сбросить пароль'"),
    # Role template form
    ("'Failed to save role template'", "'Ошибка сохранения шаблона роли'"),
    ("mode === 'create' ? 'Create Role Template' : `Edit Role Template - ${template?.name ?? ''}`",
     "mode === 'create' ? 'Создать шаблон роли' : `Редактировать шаблон: ${template?.name ?? ''}`"),
    ("saving ? 'Saving...' : mode === 'create' ? 'Create Role' : 'Save Role'",
     "saving ? 'Сохранение...' : mode === 'create' ? 'Создать роль' : 'Сохранить роль'"),
])

print('Done.')
