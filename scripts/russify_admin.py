#!/usr/bin/env python3
"""Russify all English-language text in the XTeam.Pro admin panel."""
import os, sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def patch(rel, replacements):
    fp = os.path.join(BASE, rel.replace('/', os.sep))
    with open(fp, 'r', encoding='utf-8') as f:
        content = f.read()
    original = content
    for old, new in replacements:
        content = content.replace(old, new)
    with open(fp, 'w', encoding='utf-8') as f:
        f.write(content)
    changed = sum(1 for o, _ in replacements if o in original)
    print(f'  OK {rel} ({changed}/{len(replacements)} hits)')

# ═══════════════════════════════════════════════════════════════════════════════
# AdminCases.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminCases.tsx...')
patch('src/pages/admin/AdminCases.tsx', [
    ("{ label: 'Published', cls:", "{ label: 'Опубликовано', cls:"),
    ("{ label: 'Draft', cls:", "{ label: 'Черновик', cls:"),
    ("{ label: 'Archived', cls:", "{ label: 'В архиве', cls:"),
    ('Case Studies</h1>', 'Кейс-стади</h1>'),
    ('{total} cases total', '{total} кейсов'),
    ('New Case\n        </Link>', 'Новый кейс\n        </Link>'),
    ('placeholder="Search title/company/industry..."', 'placeholder="Поиск по названию, компании, отрасли..."'),
    ('"All statuses"', '"Все статусы"'),
    ('title="Refresh"', 'title="Обновить"'),
    ('"No cases found"', '"Кейсы не найдены"'),
    ('"Create your first case study to populate this section."',
     '"Создайте первый кейс, чтобы заполнить этот раздел."'),
    ('"Create Case"', '"Создать кейс"'),
    ('>Title</th>', '>Название</th>'),
    ('>Company</th>', '>Компания</th>'),
    ('>Industry</th>', '>Отрасль</th>'),
    ('>Status</th>', '>Статус</th>'),
    ('>Order</th>', '>Порядок</th>'),
    ('>Published</th>', '>Опубликован</th>'),
    ('>Actions</th>', '>Действия</th>'),
    ('title="Edit"', 'title="Редактировать"'),
    ('title="Delete"', 'title="Удалить"'),
    ('Delete case "', 'Удалить кейс «'),
    ('"?`)', '»?`)'),
    ('Delete ${selectedIds.length} selected case(s)?',
     'Удалить выбранные кейсы (${selectedIds.length})?'),
    ("'Deleting...' : 'Bulk Delete'",
     "'Удаление...' : 'Удалить выбранные'"),
    ('Showing {page * limit + 1}', '{page * limit + 1}'),
    ('} of {total}\n          </span>', '} из {total}\n          </span>'),
    ('>Previous\n            </button>', '>Назад\n            </button>'),
    ('>Next\n            </button>', '>Вперёд\n            </button>'),
    # inline status select options in the table
    ('"draft">Draft</option>\n                          <option value="published">Published</option>\n                          <option value="archived">Archived</option>',
     '"draft">Черновик</option>\n                          <option value="published">Опубликовано</option>\n                          <option value="archived">В архиве</option>'),
    # filter select options
    ('"draft">Draft</option>\n          <option value="published">Published</option>\n          <option value="archived">Archived</option>',
     '"draft">Черновик</option>\n          <option value="published">Опубликовано</option>\n          <option value="archived">В архиве</option>'),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminCaseEditor.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminCaseEditor.tsx...')
patch('src/pages/admin/AdminCaseEditor.tsx', [
    ('Loading...</div>', 'Загрузка...</div>'),
    ('Back to Cases', 'Назад к кейсам'),
    ("? 'New Case'", "? 'Новый кейс'"),
    (": 'Edit Case'", ": 'Редактировать кейс'"),
    ('Save Draft', 'Сохранить черновик'),
    ("? 'Saving...' : 'Publish'", "? 'Сохранение...' : 'Опубликовать'"),
    ('label="Title (RU)"', 'label="Заголовок (РУ)"'),
    ('label="Title (EN)"', 'label="Заголовок (EN)"'),
    ('label="Slug"', 'label="Слаг (URL)"'),
    ("? 'Unlock'", "? 'Изменить'"),
    (": 'Lock'", ": 'Зафиксировать'"),
    ('label="Industry (RU)"', 'label="Отрасль (РУ)"'),
    ('label="Industry (EN)"', 'label="Отрасль (EN)"'),
    ('label="Client Company"', 'label="Компания клиента"'),
    ('placeholder="Client company"', 'placeholder="Название компании"'),
    ('label="Challenge (RU)"', 'label="Задача / проблема (РУ)"'),
    ('label="Challenge (EN)"', 'label="Задача / проблема (EN)"'),
    ('label="Solution (RU)"', 'label="Решение (РУ)"'),
    ('label="Solution (EN)"', 'label="Решение (EN)"'),
    ('label="Testimonial (RU)"', 'label="Отзыв клиента (РУ)"'),
    ('label="Testimonial (EN)"', 'label="Отзыв клиента (EN)"'),
    ('Metrics (RU/EN required)', 'Метрики (обязательны RU и EN)'),
    ('> Add metric</button>', '> Добавить метрику</button>'),
    ("Metric #${index + 1}", "Метрика №${index + 1}"),
    ('placeholder="Metric label (RU)"', 'placeholder="Название метрики (РУ)"'),
    ('placeholder="Metric label (EN)"', 'placeholder="Название метрики (EN)"'),
    ('placeholder="Value"', 'placeholder="Значение"'),
    ('placeholder="Improvement (RU)"', 'placeholder="Улучшение (РУ)"'),
    ('placeholder="Improvement (EN)"', 'placeholder="Улучшение (EN)"'),
    ('>Publishing</h3>', '>Публикация</h3>'),
    ('label="Status"', 'label="Статус"'),
    ('label="Sort Order"', 'label="Порядок сортировки"'),
    ('Featured case', 'Рекомендуемый кейс'),
    ("? 'Saving...' : 'Save'", "? 'Сохранение...' : 'Сохранить'"),
    ('>Business Results</h3>', '>Бизнес-результаты</h3>'),
    ('label="ROI"', 'label="ROI (окупаемость)"'),
    ('label="Time Saved"', 'label="Сэкономленное время"'),
    ('placeholder="e.g. 320%"', 'placeholder="напр. 320%"'),
    ('placeholder="e.g. 12 weeks"', 'placeholder="напр. 12 недель"'),
    ('>Featured Image</h3>', '>Обложка</h3>'),
    ('label="Image URL"', 'label="URL изображения"'),
    # status select options in sidebar
    ('"draft">Draft</option>\n                <option value="published">Published</option>\n                <option value="archived">Archived</option>',
     '"draft">Черновик</option>\n                <option value="published">Опубликовано</option>\n                <option value="archived">В архиве</option>'),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminBlog.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminBlog.tsx...')
patch('src/pages/admin/AdminBlog.tsx', [
    ("{ label: 'Published', icon: CheckCircle, cls:", "{ label: 'Опубликовано', icon: CheckCircle, cls:"),
    ("{ label: 'Draft',     icon: Clock,        cls:", "{ label: 'Черновик',     icon: Clock,        cls:"),
    ("{ label: 'Archived',  icon: Archive,      cls:", "{ label: 'В архиве',     icon: Archive,      cls:"),
    ("'All', 'AI', 'Automation', 'Case Studies', 'Industry Insights'",
     "'Все', 'AI', 'Automation', 'Case Studies', 'Industry Insights'"),
    ('>Blog</h1>', '>Блог</h1>'),
    ('{total} posts total', '{total} статей'),
    ('New Post\n        </Link>', 'Новая статья\n        </Link>'),
    ('placeholder="Search posts..."', 'placeholder="Поиск статей..."'),
    ('"All statuses"', '"Все статусы"'),
    # filter select options for status
    ('"draft">Draft</option>\n          <option value="published">Published</option>\n          <option value="archived">Archived</option>',
     '"draft">Черновик</option>\n          <option value="published">Опубликовано</option>\n          <option value="archived">В архиве</option>'),
    # category filter  - "All" -> "Все"
    ("c === 'All' ? '' : c}>{c}</option>", "c === 'Все' ? '' : c}>{c}</option>"),
    ('title="Refresh"', 'title="Обновить"'),
    ('"No posts found"', '"Статьи не найдены"'),
    ('"Use filters less strictly or create a new post."',
     '"Измените фильтры или создайте новую статью."'),
    ('"Create Post"', '"Создать статью"'),
    ('>Title</th>', '>Название</th>'),
    ('>Category</th>', '>Категория</th>'),
    ('>Author</th>', '>Автор</th>'),
    ('>Status</th>', '>Статус</th>'),
    ('>Views</th>', '>Просмотры</th>'),
    ('>Published</th>', '>Опубликована</th>'),
    ('>Actions</th>', '>Действия</th>'),
    ('>Featured<', '>Топ<'),
    ('min read', 'мин. чт.'),
    ('title="View on site"', 'title="На сайте"'),
    ('title="Edit"', 'title="Редактировать"'),
    ('title="Duplicate"', 'title="Дублировать"'),
    ('title="Delete"', 'title="Удалить"'),
    # inline status select options in table rows
    ('"draft">Draft</option>\n                          <option value="published">Published</option>\n                          <option value="archived">Archived</option>',
     '"draft">Черновик</option>\n                          <option value="published">Опубликовано</option>\n                          <option value="archived">В архиве</option>'),
    ('Delete "${title}"?', 'Удалить «${title}»?'),
    ('Delete ${selectedIds.length} selected post(s)?',
     'Удалить выбранные статьи (${selectedIds.length})?'),
    ("toast.success('Selected posts deleted')", "toast.success('Статьи удалены')"),
    ("toast.error('Failed to delete selected posts')", "toast.error('Ошибка при удалении статей')"),
    ("'Deleting...' : 'Bulk Delete'", "'Удаление...' : 'Удалить выбранные'"),
    ('Showing {page * limit + 1}', '{page * limit + 1}'),
    ('} of {total}\n          </span>', '} из {total}\n          </span>'),
    ('>Previous\n            </button>', '>Назад\n            </button>'),
    ('>Next\n            </button>', '>Вперёд\n            </button>'),
])

# ═══════════════════════════════════════════════════════════════════════════════
# AdminContacts.tsx
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching AdminContacts.tsx...')
patch('src/pages/admin/AdminContacts.tsx', [
    # STAGE_LABELS
    ("new: 'New'", "new: 'Новый'"),
    ("contacted: 'Contacted'", "contacted: 'На связи'"),
    ("qualified: 'Квалифицирован'", "qualified: 'Квалифицирован'"),  # may already be set
    ("qualified: 'Qualified'", "qualified: 'Квалифицирован'"),
    ("converted: 'Converted'", "converted: 'Конвертирован'"),
    ("closed: 'Closed'", "closed: 'Закрыт'"),
    # Header
    ('>Contacts</h1>', '>Контакты</h1>'),
    ('Open Kanban', 'CRM Канбан'),
    ('Email Templates', 'Шаблоны писем'),
    ('Export CSV', 'Экспорт CSV'),
    # Search
    ('placeholder="Search by name/email/company/tag"',
     'placeholder="Поиск по имени, email, компании, тегу"'),
    # Status filter
    ('"All Statuses"', '"Все статусы"'),
    ('"New"', '"Новый"'),
    ('"Contacted"', '"На связи"'),
    ('"Qualified"', '"Квалифицирован"'),
    ('"Converted"', '"Конвертирован"'),
    ('"Closed"', '"Закрыт"'),
    # Stage filter
    ('"All Stages"', '"Все стадии"'),
    # Priority filter
    ('"All Priorities"', '"Все приоритеты"'),
    ('"Urgent"', '"Срочный"'),
    ('"High"', '"Высокий"'),
    ('"Medium"', '"Средний"'),
    ('"Low"', '"Низкий"'),
    # Type filter
    ('"All Types"', '"Все типы"'),
    ('"General"', '"Общий"'),
    ('"Consultation"', '"Консультация"'),
    ('"Support"', '"Поддержка"'),
    ('"Partnership"', '"Партнёрство"'),
    # Date range
    ('"to"', '"по"'),
    # Table headers
    ('>Contact</th>', '>Контакт</th>'),
    ('>Company</th>', '>Компания</th>'),
    ('>Priority</th>', '>Приоритет</th>'),
    ('>Status</th>', '>Статус</th>'),
    ('>Stage</th>', '>Стадия</th>'),
    ('>Score</th>', '>Оценка</th>'),
    ('>Tags</th>', '>Теги</th>'),
    ('>Date</th>', '>Дата</th>'),
    ('>Actions</th>', '>Действия</th>'),
    # Empty state
    ('"No contacts found"', '"Контакты не найдены"'),
    ('"Try changing filters or search query."',
     '"Измените фильтры или поисковый запрос."'),
    # Toasts / confirms
    ("toast.error('Failed to load contacts')", "toast.error('Ошибка загрузки контактов')"),
    ("toast.error('Export failed')", "toast.error('Ошибка экспорта')"),
    ("toast.success('Contacts deleted')", "toast.success('Контакты удалены')"),
    ("toast.success('Status updated')", "toast.success('Статус обновлён')"),
    ("toast.success('Assignee updated')", "toast.success('Исполнитель назначен')"),
    ("toast.success('Contact deleted')", "toast.success('Контакт удалён')"),
    ("'Delete this contact?'", "'Удалить этот контакт?'"),
    ('Delete ${selectedIds.length} contacts?', 'Удалить контакты (${selectedIds.length})?'),
    # Bulk actions
    ('Set Status', 'Изменить статус'),
    ('placeholder="Assignee"', 'placeholder="Исполнитель"'),
    ('>Assign\n        </button>', '>Назначить\n        </button>'),
    ('>Delete\n      </button>', '>Удалить\n      </button>'),
    # Bulk status options
    ('"new">New</option>', '"new">Новый</option>'),
    ('"contacted">Contacted</option>', '"contacted">На связи</option>'),
    ('"qualified">Qualified</option>', '"qualified">Квалифицирован</option>'),
    ('"converted">Converted</option>', '"converted">Конвертирован</option>'),
    ('"closed">Closed</option>', '"closed">Закрыт</option>'),
    # date separator
    ('>to<', '>по<'),
])

# ═══════════════════════════════════════════════════════════════════════════════
# CaseStudies.tsx (public page)
# ═══════════════════════════════════════════════════════════════════════════════
print('Patching CaseStudies.tsx...')
patch('src/pages/CaseStudies.tsx', [
    ('>Loading...</div>', '>Загрузка...</div>'),
    ('>No cases found</div>', '>Кейсы не найдены</div>'),
])

print('Done.')
