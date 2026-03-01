#!/usr/bin/env python3
"""Russify remaining admin pages: ContactDetail, Users, Settings, Analytics, Kanban, EmailTemplates."""
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def patch(rel, replacements):
    fp = os.path.join(BASE, rel.replace('/', os.sep))
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    changed = sum(1 for o, _ in replacements if o in original)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f'  OK {rel} ({changed}/{len(replacements)} hits)')

# ═══════════════════════════════════════════════════════════════════════════════
# AdminContactDetail.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminContactDetail.tsx...')
patch('src/pages/admin/AdminContactDetail.tsx', [
    ('Loading...</div>', 'Загрузка...</div>'),
    ('Back to Contacts', 'Назад к контактам'),
    ('>Contact Information</h2>', '>Информация о контакте</h2>'),
    ('>Name:</span>', '>Имя:</span>'),
    ('>Email:</span>', '>Email:</span>'),
    ('>Phone:</span>', '>Телефон:</span>'),
    ('>Company:</span>', '>Компания:</span>'),
    ('>Subject:</span>', '>Тема:</span>'),
    ('label="Activity Timeline"', 'label="Хронология"'),
    ('label="Notes"', 'label="Заметки"'),
    ('label="Tasks"', 'label="Задачи"'),
    ('"Activity Timeline"', '"Хронология"'),
    ('"Notes"', '"Заметки"'),
    ('"Tasks"', '"Задачи"'),
    ('No activities yet.', 'Активность пока отсутствует.'),
    ('placeholder="Add note..."', 'placeholder="Добавить заметку..."'),
    ('>Add\n                  </button>', '>Добавить\n                  </button>'),
    ('>Delete\n                      </button>', '>Удалить\n                      </button>'),
    ('placeholder="Task title"', 'placeholder="Название задачи"'),
    ('placeholder="Description"', 'placeholder="Описание"'),
    ('"low">Low</option>', '"low">Низкий</option>'),
    ('"medium">Medium</option>', '"medium">Средний</option>'),
    ('"high">High</option>', '"high">Высокий</option>'),
    ('"urgent">Urgent</option>', '"urgent">Срочный</option>'),
    ('>Add Task\n                  </button>', '>Добавить задачу\n                  </button>'),
    ('"todo">Todo</option>', '"todo">К выполнению</option>'),
    ('"in_progress">In Progress</option>', '"in_progress">В работе</option>'),
    ('"done">Done</option>', '"done">Готово</option>'),
    ('Due: {task.due_date', 'Срок: {task.due_date'),
    ("'—'} · Priority: {task.priority}", "'—'} · Приоритет: {task.priority}"),
    ('>Delete\n                    </button>', '>Удалить\n                    </button>'),
    ('>Status & Pipeline</h3>', '>Статус и конвейер</h3>'),
    ('>Status</label>', '>Статус</label>'),
    ('"new">New</option>', '"new">Новый</option>'),
    ('"contacted">Contacted</option>', '"contacted">На связи</option>'),
    ('"qualified">Qualified</option>', '"qualified">Квалифицирован</option>'),
    ('"converted">Converted</option>', '"converted">Конвертирован</option>'),
    ('"closed">Closed</option>', '"closed">Закрыт</option>'),
    ('>Pipeline Stage</label>', '>Стадия конвейера</label>'),
    ('>Priority</label>', '>Приоритет</label>'),
    ('"low">Low</option>', '"low">Низкий</option>'),
    ('"medium">Medium</option>', '"medium">Средний</option>'),
    ('"high">High</option>', '"high">Высокий</option>'),
    ('"urgent">Urgent</option>', '"urgent">Срочный</option>'),
    ('>Assigned To</label>', '>Исполнитель</label>'),
    ('>Score</label>', '>Оценка</label>'),
    ('>Tags (comma separated)</label>', '>Теги (через запятую)</label>'),
    ("'Saving...' : 'Save Changes'", "'Сохранение...' : 'Сохранить'"),
    (">toast.success('Contact updated')", ">toast.success('Контакт обновлён')"),
    ("toast.success('Contact updated')", "toast.success('Контакт обновлён')"),
    ('>Quick Email</h3>', '>Быстрый email</h3>'),
    ('>Select template</option>', '>Выбрать шаблон</option>'),
    ("'Sending...' : 'Send Template'", "'Отправка...' : 'Отправить шаблон'"),
    ('>Compose Email\n              </a>', '>Написать email\n              </a>'),
    ('>Call\n              </a>', '>Позвонить\n              </a>'),
    ("toast.success('Email sent')", "toast.success('Письмо отправлено')"),
    ('Delete inquiry from ${contact.name}?', 'Удалить обращение от ${contact.name}?'),
    ("toast.success('Contact deleted')", "toast.success('Контакт удалён')"),
    ("'Deleting...' : 'Delete Contact'", "'Удаление...' : 'Удалить контакт'"),
    ('by {item.created_by || ', 'от {item.created_by || '),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminUsers.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminUsers.tsx...')
patch('src/pages/admin/AdminUsers.tsx', [
    # Role config labels
    ("{ label: 'Super Admin'", "{ label: 'Супер-администратор'"),
    ("{ label: 'Admin'", "{ label: 'Администратор'"),
    ("{ label: 'Analyst'", "{ label: 'Аналитик'"),
    ("{ label: 'Editor'", "{ label: 'Редактор'"),
    ("{ label: 'Author'", "{ label: 'Автор'"),
    ("{ label: 'Moderator'", "{ label: 'Модератор'"),
    # Role options
    ("{ value: 'analyst', label: 'Analyst' }", "{ value: 'analyst', label: 'Аналитик' }"),
    ("{ value: 'author', label: 'Author' }", "{ value: 'author', label: 'Автор' }"),
    ("{ value: 'editor', label: 'Editor' }", "{ value: 'editor', label: 'Редактор' }"),
    ("{ value: 'moderator', label: 'Moderator' }", "{ value: 'moderator', label: 'Модератор' }"),
    ("{ value: 'admin', label: 'Admin' }", "{ value: 'admin', label: 'Администратор' }"),
    ("{ value: 'super_admin', label: 'Super Admin' }", "{ value: 'super_admin', label: 'Супер-администратор' }"),
    # Permissions
    ("{ key: 'can_manage_users', label: 'Manage Users' }", "{ key: 'can_manage_users', label: 'Управление пользователями' }"),
    ("{ key: 'can_view_analytics', label: 'View Analytics' }", "{ key: 'can_view_analytics', label: 'Просмотр аналитики' }"),
    ("{ key: 'can_export_data', label: 'Export Data' }", "{ key: 'can_export_data', label: 'Экспорт данных' }"),
    ("{ key: 'can_manage_audits', label: 'Legacy: Manage Audits' }", "{ key: 'can_manage_audits', label: 'Управление аудитами (устар.)' }"),
    ("{ key: 'can_manage_content', label: 'Legacy: Manage Content' }", "{ key: 'can_manage_content', label: 'Управление контентом (устар.)' }"),
    ("{ key: 'can_read_audits', label: 'Read Audits' }", "{ key: 'can_read_audits', label: 'Чтение аудитов' }"),
    ("{ key: 'can_write_audits', label: 'Write Audits' }", "{ key: 'can_write_audits', label: 'Редактирование аудитов' }"),
    ("{ key: 'can_delete_audits', label: 'Delete Audits' }", "{ key: 'can_delete_audits', label: 'Удаление аудитов' }"),
    ("{ key: 'can_read_contacts', label: 'Read Contacts' }", "{ key: 'can_read_contacts', label: 'Чтение контактов' }"),
    ("{ key: 'can_write_contacts', label: 'Write Contacts' }", "{ key: 'can_write_contacts', label: 'Редактирование контактов' }"),
    ("{ key: 'can_delete_contacts', label: 'Delete Contacts' }", "{ key: 'can_delete_contacts', label: 'Удаление контактов' }"),
    ("{ key: 'can_publish_content', label: 'Publish Content' }", "{ key: 'can_publish_content', label: 'Публикация контента' }"),
    ("{ key: 'can_manage_cases', label: 'Manage Cases' }", "{ key: 'can_manage_cases', label: 'Управление кейсами' }"),
    ("{ key: 'skip_email_verification', label: 'Skip Email Verification' }", "{ key: 'skip_email_verification', label: 'Без подтверждения email' }"),
    # Confirms
    ('Delete user "${user.username}"? This cannot be undone.', 'Удалить пользователя «${user.username}»? Это действие необратимо.'),
    ('Delete role template "${template.name}"?', 'Удалить шаблон роли «${template.name}»?'),
    ('Delete ${selectedDeletableUserIds.length} selected user(s)?', 'Удалить выбранных пользователей (${selectedDeletableUserIds.length})?'),
    ('Delete ${selectedDeletableRoleIds.length} selected role template(s)?', 'Удалить выбранные шаблоны ролей (${selectedDeletableRoleIds.length})?'),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminContactsKanban.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminContactsKanban.tsx...')
patch('src/pages/admin/AdminContactsKanban.tsx', [
    ('>New<', '>Новые<'),
    ('>Contacted<', '>На связи<'),
    ('>Qualified<', '>Квалифицированные<'),
    ('>Converted<', '>Конвертированные<'),
    ('>Closed<', '>Закрытые<'),
    ('CRM Kanban', 'CRM Канбан'),
    ('Pipeline View', 'Конвейер'),
    ('Back to List', 'Список'),
    ('Loading...', 'Загрузка...'),
    ('No contacts', 'Нет контактов'),
    ('Score:', 'Оценка:'),
    ('>New</option>', '>Новый</option>'),
    ('>Contacted</option>', '>На связи</option>'),
    ('>Qualified</option>', '>Квалифицирован</option>'),
    ('>Converted</option>', '>Конвертирован</option>'),
    ('>Closed</option>', '>Закрыт</option>'),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminEmailTemplates.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminEmailTemplates.tsx...')
patch('src/pages/admin/AdminEmailTemplates.tsx', [
    ('>Email Templates</h1>', '>Шаблоны писем</h1>'),
    ('New Template', 'Новый шаблон'),
    ('templates total', 'шаблонов'),
    ('Search templates...', 'Поиск шаблонов...'),
    ('All Categories', 'Все категории'),
    ('"No templates found"', '"Шаблоны не найдены"'),
    ('"Create your first email template."', '"Создайте первый шаблон письма."'),
    ('"Create Template"', '"Создать шаблон"'),
    ('>Name</th>', '>Название</th>'),
    ('>Subject</th>', '>Тема</th>'),
    ('>Category</th>', '>Категория</th>'),
    ('>Status</th>', '>Статус</th>'),
    ('>Actions</th>', '>Действия</th>'),
    ('Active', 'Активный'),
    ('Inactive', 'Неактивный'),
    ('>Edit</button>', '>Редактировать</button>'),
    ('>Delete</button>', '>Удалить</button>'),
    ('Delete template', 'Удалить шаблон'),
    ('Template Name', 'Название шаблона'),
    ('Subject Line', 'Тема письма'),
    ('Category', 'Категория'),
    ('Email Body', 'Текст письма'),
    ('Available variables:', 'Доступные переменные:'),
    ('Save Template', 'Сохранить шаблон'),
    ('Cancel', 'Отмена'),
    ("toast.success('Template saved')", "toast.success('Шаблон сохранён')"),
    ("toast.success('Template deleted')", "toast.success('Шаблон удалён')"),
    ("toast.error('Failed to save template')", "toast.error('Ошибка сохранения шаблона')"),
])

print('Done.')
