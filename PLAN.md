# XTeam.Pro — Сравнительный анализ и план доработки

**Дата анализа:** 2026-02-19
**Базис:** TECHSPEC.md v1.0

---

## 1. Сводная таблица: Спецификация vs Реализация

| Модуль / Фича | Спецификация | Реализовано | Дельта |
|---|---|---|---|
| **Публичный сайт** | | | |
| Home, Solutions, Pricing, About | Полная | ✅ Полностью | — |
| Blog (просмотр) | Список + детальная страница | ✅ Полностью | — |
| CaseStudies, Careers | Полная | ✅ Полностью | — |
| Contact, Privacy, Terms, Cookies | Полная | ✅ Полностью | — |
| **Аудит** | | | |
| Многошаговая форма | 4 шага + валидация | ✅ Полностью | — |
| Async AI обработка | pending→processing→completed | ✅ Полностью | — |
| Страница результатов + polling | Графики, PDF-ссылка | ✅ Полностью | — |
| PDF генерация | ReportLab + Matplotlib | ✅ Полностью | — |
| OpenAI GPT-4 анализ | Реальный + mock fallback | ⚠️ Mock режим работает, реальный — зависит от ключа | Нужен тест с реальным ключом |
| **ROI Калькулятор** | | | |
| POST /calculator/roi | Полный расчёт + AI инсайты | ⚠️ Pydantic модели есть, endpoint требует проверки | Smoke test |
| POST /calculator/process-analysis | Анализ процесса | ⚠️ Аналогично | Smoke test |
| GET /calculator/benchmarks/{industry} | Бенчмарки | ⚠️ Аналогично | Smoke test |
| **Email** | | | |
| contact_confirmation, contact_notification | SMTP + Jinja2 | ✅ Полностью | — |
| audit_completed | С PDF-ссылкой | ✅ Полностью | — |
| admin_invitation, password_reset | Приглашение / сброс пароля | ❌ Отсутствует | Реализовать |
| **Admin Panel — Аутентификация** | | | |
| Форма входа (username/password) | JWT, sessionStorage | ✅ Полностью | — |
| Logout | Очистка sessionStorage | ✅ Полностью | — |
| ProtectedRoute (guard) | Редирект неавторизованных | ❌ Отсутствует | Критично |
| RBAC в UI (по ролям) | Скрытие разделов по роли | ❌ Отсутствует | Важно |
| Refresh token rotation | POST /admin/refresh | ❌ Отсутствует | Важно |
| Блокировка аккаунта (5 попыток) | locked_until в модели | ⚠️ Поле есть в модели, логика не реализована | Реализовать |
| **Admin Panel — Dashboard** | | | |
| KPI-карточки (6 метрик) | total_audits, contacts, blog, avg_score, conversion | ✅ Полностью (4 из 6) | Добавить blog stats |
| Тренд-графики (line chart 12 мес.) | audits + contacts | ✅ Полностью | — |
| Распределение по отраслям (pie) | Топ-5 | ✅ Полностью | — |
| Воронка конверсии (funnel) | audit→completed→contact→converted | ❌ Отсутствует | Реализовать |
| Быстрые действия | Кнопки «Новые обращения», «Создать статью» | ❌ Отсутствует | Удобство |
| **Admin Panel — Аудиты** | | | |
| Список с фильтрами (статус, отрасль, дата, поиск) | Таблица + пагинация | ✅ Частично (нет фильтра по дате и отрасли) | Доработать |
| Детальная страница аудита | Все поля + результаты + PDF | ❌ Только список, нет детальной | Реализовать |
| Регенерация анализа | POST /admin/audits/{id}/reprocess | ❌ Endpoint отсутствует | Реализовать |
| Отправить email клиенту | POST /admin/audits/{id}/send-email | ❌ Endpoint отсутствует | Реализовать |
| Удалить аудит | DELETE /submissions/{id} | ✅ Полностью | — |
| **Admin Panel — Обращения (CRM)** | | | |
| Список с фильтрами | Таблица + поиск | ✅ Частично (базовый список) | Добавить фильтры priority/type |
| Детальная страница обращения | Все поля + CRM-управление | ❌ Отсутствует | Реализовать |
| Изменение статуса/приоритета/ответственного | PATCH /admin/contacts/{id} | ❌ Endpoint и UI отсутствуют | Реализовать |
| Пометить как спам | is_spam flag | ❌ Отсутствует | Реализовать |
| **Admin Panel — CMS Блог** | | | |
| Список статей с фильтрами | Таблица + статус + поиск | ❌ Весь раздел отсутствует | Критично |
| Создание статьи | Rich text editor, SEO, slug | ❌ Отсутствует | Критично |
| Редактирование статьи | Все поля + preview | ❌ Отсутствует | Критично |
| Удаление / архивирование | DELETE/PATCH статус | ❌ Отсутствует | Критично |
| Дублирование статьи | POST /admin/blog/{id}/duplicate | ❌ Отсутствует | Удобство |
| Быстрое переключение статуса | draft ↔ published в списке | ❌ Отсутствует | Удобство |
| Auto-slug генерация | Из заголовка | ❌ Отсутствует | Реализовать |
| **Admin Panel — Медиабиблиотека** | | | |
| Загрузка файлов (drag & drop) | POST /admin/media/upload | ❌ Весь раздел отсутствует | Важно |
| Список/grid медиафайлов | С миниатюрами | ❌ Отсутствует | Важно |
| Редактирование alt-текста | PATCH /admin/media/{id} | ❌ Отсутствует | Важно |
| Удаление файлов | DELETE /admin/media/{id} | ❌ Отсутствует | Важно |
| Модель media_files в БД | Таблица | ❌ Отсутствует | Важно |
| **Admin Panel — Управление пользователями** | | | |
| Список admin-пользователей | Таблица с ролями | ❌ Весь раздел отсутствует | Важно |
| Создание пользователя | POST /admin/users | ❌ Отсутствует | Важно |
| Редактирование / деактивация | PUT + PATCH /admin/users/{id} | ❌ Отсутствует | Важно |
| Сброс пароля | POST /admin/users/{id}/reset-password | ❌ Отсутствует | Важно |
| **Admin Panel — Аналитика** | | | |
| Обзорные KPI за период | С date range picker | ⚠️ Базовая аналитика есть, нет date range | Доработать |
| Экспорт аудитов (CSV) | GET /admin/export/audits | ✅ Полностью | — |
| Экспорт обращений (CSV) | GET /admin/export/contacts | ❌ Endpoint отсутствует | Реализовать |
| Статистика блога | Топ статей, просмотры | ❌ Отсутствует | Реализовать |
| **Admin Panel — Настройки** | | | |
| Конфигурация AI (модель, веса) | PUT /admin/configuration | ✅ Полностью | — |
| Настройки Email (SMTP test) | GET/PATCH + POST test | ❌ Endpoints отсутствуют | Реализовать |
| Общие настройки сайта | Название, URL, языки | ❌ Отсутствует | Реализовать |
| **Безопасность** | | | |
| RBAC на backend (проверка прав) | Зависит от роли пользователя | ❌ Права проверяются только в модели | Критично |
| Rate limit на /admin/login | Защита от брутфорса | ❌ Нет специального лимита | Важно |
| Блокировка аккаунта (5 попыток) | Логика + locked_until | ❌ Только поля, нет логики | Важно |
| **Инфраструктура** | | | |
| Alembic миграции | Versioned migrations | ❌ Не настроены | Важно |
| Zustand store | Глобальное состояние | ❌ Пакет установлен, нет файла | Полезно |
| Тесты (E2E / unit) | Playwright + pytest | ⚠️ Конфиг есть, минимальное покрытие | Наращивать |
| Admin Sidebar (навигация) | Полноценный sidebar с разделами | ❌ Только вкладки Tab | Критично |
| Rich text editor (TipTap) | Для редактора блога | ❌ Не установлен | Критично |

---

## 2. Итоговая оценка готовности

| Блок | Готовность |
|------|-----------|
| Публичный сайт | **100%** |
| Аудит (пользовательский flow) | **95%** |
| Email-уведомления | **80%** |
| Admin: Аутентификация | **70%** |
| Admin: Dashboard | **75%** |
| Admin: Управление аудитами | **50%** |
| Admin: CRM обращений | **40%** |
| Admin: CMS Блог | **0%** |
| Admin: Медиабиблиотека | **0%** |
| Admin: Управление пользователями | **0%** |
| Admin: Аналитика | **60%** |
| Admin: Настройки | **55%** |
| Безопасность (RBAC) | **30%** |
| Инфраструктура (миграции, тесты) | **15%** |
| **ИТОГО** | **~58%** |

---

## 3. План доработки

Задачи сгруппированы по **этапам**. Каждый этап — самодостаточный и деплоируемый.

---

### Этап 1 — Безопасность и архитектура Admin (фундамент)

> **Цель:** Перед добавлением новых фич Admin Panel — закрыть критические дыры безопасности и создать правильную архитектуру маршрутизации.

#### 1.1 ProtectedRoute компонент

**Файл:** `src/components/admin/ProtectedRoute.tsx`

```typescript
// Если нет токена — редирект на /admin/login
// Если нет нужного права — редирект на /admin/dashboard
export function ProtectedRoute({ children, permission? })
```

**Затрагивает:** `src/App.tsx` — обернуть все `/admin/*` маршруты

---

#### 1.2 Перестройка маршрутизации Admin

**Файл:** `src/App.tsx`

Текущее состояние: Admin.tsx — монолитный компонент с Tab-навигацией.
Цель: Разбить на отдельные страницы + общий AdminLayout.

```
/admin                      → редирект на /admin/dashboard
/admin/login                → AdminLogin (уже есть, вынести)
/admin/dashboard            → AdminDashboard
/admin/audits               → AdminAudits
/admin/audits/:id           → AdminAuditDetail
/admin/contacts             → AdminContacts
/admin/contacts/:id         → AdminContactDetail
/admin/blog                 → AdminBlog
/admin/blog/new             → AdminBlogEditor
/admin/blog/:id/edit        → AdminBlogEditor (с id)
/admin/media                → AdminMedia
/admin/users                → AdminUsers
/admin/analytics            → AdminAnalytics
/admin/settings             → AdminSettings
```

---

#### 1.3 AdminLayout с sidebar

**Файл:** `src/components/admin/AdminLayout.tsx`

```
┌──────────────┬────────────────────────────────┐
│  SIDEBAR     │  TOPBAR                         │
│  [Logo]      │  [Breadcrumbs]  [User] [Logout] │
│              ├────────────────────────────────┤
│  Dashboard   │                                │
│  Аудиты      │         CONTENT AREA           │
│  Обращения   │                                │
│  Блог        │                                │
│  Медиа       │                                │
│  Аналитика   │                                │
│  Польз-ли    │                                │
│  Настройки   │                                │
└──────────────┴────────────────────────────────┘
```

Поведение sidebar:
- Collapse/expand (сохранять в localStorage)
- Активный пункт подсвечивается
- Скрывать пункты по правам пользователя (RBAC)

---

#### 1.4 RBAC на backend

**Файл:** `backend/routes/admin.py`

Добавить dependency для проверки прав:
```python
async def require_permission(permission: str):
    async def _check(current_user: AdminUser = Depends(get_current_admin_user)):
        if not getattr(current_user, permission, False) and current_user.role != 'super_admin':
            raise HTTPException(403, "Insufficient permissions")
        return current_user
    return _check

# Применение:
@router.delete("/audits/{id}", dependencies=[Depends(require_permission("can_manage_audits"))])
```

---

#### 1.5 Zustand store для Admin

**Файл:** `src/store/adminStore.ts`

```typescript
interface AdminStore {
  authToken: string | null;
  adminUser: AdminUser | null;
  sidebarCollapsed: boolean;
  setAuthToken: (token: string | null) => void;
  setAdminUser: (user: AdminUser | null) => void;
  toggleSidebar: () => void;
  logout: () => void;
}
```

---

#### 1.6 Rate limit на login + логика блокировки

**Файл:** `backend/routes/admin.py`

При каждом неудачном входе:
1. Инкремент `failed_login_attempts`
2. Если >= 5: установить `locked_until = now() + 30min`
3. При успешном входе: сброс счётчика

При попытке входа: проверить `locked_until`.

---

**Результат Этапа 1:**
- Все admin-маршруты защищены
- Sidebar-навигация работает
- RBAC применяется на backend
- Глобальное состояние через Zustand

---

### Этап 2 — CMS Блог (полный цикл)

> **Цель:** Возможность создавать, редактировать, публиковать статьи блога из Admin Panel.

#### 2.1 Rich Text Editor

**Установка:**
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link @tiptap/extension-code-block-lowlight @tiptap/extension-placeholder @tiptap/extension-character-count lowlight
```

**Файл:** `src/components/admin/BlogEditor.tsx`

Toolbar: Bold, Italic, Underline, Strike, H1-H3, BulletList, OrderedList, Blockquote, Link, Image (из медиабиблиотеки), Code, CodeBlock, HorizontalRule.

---

#### 2.2 Backend: Blog API endpoints

**Файл:** `backend/routes/admin.py`

```python
# Добавить в admin router:

GET    /api/admin/blog
       Query: skip, limit, status, category, search
       Response: { items: [], total }

GET    /api/admin/blog/{post_id}
       Response: BlogPostResponse

POST   /api/admin/blog
       Body: BlogPostCreateRequest
       Response: BlogPostResponse
       # Auto-генерация slug из title
       # Auto-расчёт reading_time, word_count

PUT    /api/admin/blog/{post_id}
       Body: BlogPostUpdateRequest
       Response: BlogPostResponse

DELETE /api/admin/blog/{post_id}
       Response: { message }

POST   /api/admin/blog/{post_id}/duplicate
       Response: BlogPostResponse (status=draft, новый slug)

PATCH  /api/admin/blog/{post_id}/status
       Body: { status: "draft"|"published"|"archived" }
       Response: BlogPostResponse
```

**Pydantic модели добавить в `backend/routes/admin.py`:**
```python
class BlogPostCreateRequest(BaseModel):
    title: str
    slug: Optional[str] = None  # автогенерация если пусто
    excerpt: Optional[str] = None
    content: str
    meta_title: Optional[str] = None
    meta_description: Optional[str] = None
    keywords: Optional[str] = None
    featured_image: Optional[str] = None
    featured_image_alt: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[str] = None
    author_name: Optional[str] = None
    author_email: Optional[str] = None
    author_bio: Optional[str] = None
    status: str = "draft"
    published_at: Optional[datetime] = None
    is_featured: bool = False
    allow_comments: bool = True
    is_seo_optimized: bool = False
```

---

#### 2.3 Frontend: AdminBlog страница

**Файлы:**
- `src/pages/admin/AdminBlog.tsx` — список статей
- `src/pages/admin/AdminBlogEditor.tsx` — редактор (новая / редактирование)

**AdminBlog.tsx:**
- Таблица: thumbnail, title, category, status badge, views, date, actions
- Фильтры: status dropdown, category dropdown, search
- Кнопки в строке: Edit, Preview (новая вкладка), Дублировать, Удалить
- Быстрое переключение статуса (toggle draft/published)
- «Создать статью» → `/admin/blog/new`

**AdminBlogEditor.tsx:**
- Двухколоночный layout (редактор + правая панель настроек)
- TipTap rich text editor
- Auto-slug из title (с возможностью ручного редактирования)
- SEO-поля с подсказками (оптимальная длина meta_description, keywords)
- Выбор изображения обложки (ввод URL или открыть медиабиблиотеку)
- Preview кнопка → открывает `/blog/{slug}` в новой вкладке
- «Сохранить черновик», «Опубликовать»

---

#### 2.4 Public Blog — подключение к реальным данным

Текущее состояние: `Blog.tsx` и `BlogPost.tsx` используют статические данные (захардкоженные посты или переводы).

**Нужно:**
- `GET /api/blog` — публичный endpoint (список опубликованных)
- `GET /api/blog/{slug}` — детали поста (увеличивает view_count)
- Добавить маршруты в `backend/routes/` (отдельный `blog.py` или в существующий)
- Обновить `Blog.tsx` и `BlogPost.tsx` для получения данных через API

---

**Результат Этапа 2:**
- Полный CMS для блога в Admin Panel
- Публичный блог получает данные из БД
- Rich text редактор с форматированием

---

### Этап 3 — Медиабиблиотека

> **Цель:** Загрузка и управление изображениями для блога и других разделов.

#### 3.1 Backend: MediaFile модель

**Файл:** `backend/models/media.py` (новый файл)

```python
class MediaFile(Base):
    __tablename__ = "media_files"
    id = Column(Integer, primary_key=True)
    filename = Column(String(255), nullable=False)        # уникальное имя на диске
    original_name = Column(String(255), nullable=False)  # оригинальное имя файла
    file_path = Column(String(500), nullable=False)
    file_url = Column(String(500), nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String(100), nullable=False)
    width = Column(Integer)
    height = Column(Integer)
    alt_text = Column(String(300))
    uploaded_by = Column(Integer, ForeignKey("admin_users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
```

Зарегистрировать в `backend/database/config.py`.

---

#### 3.2 Backend: Media API endpoints

**Файл:** `backend/routes/admin.py` (добавить в admin router)

```python
GET    /api/admin/media
       Query: skip, limit, mime_type?
       Response: { items: MediaFileResponse[], total }

POST   /api/admin/media/upload
       Content-Type: multipart/form-data
       Body: file (UploadFile), alt_text? (str)
       # Валидация: только image/*, max 10MB
       # Генерация уникального filename (uuid + extension)
       # Сохранение в backend/uploads/
       # Определение width/height для изображений (Pillow)
       # Создание записи в MediaFile
       Response: MediaFileResponse

PATCH  /api/admin/media/{file_id}
       Body: { alt_text: str }
       Response: MediaFileResponse

DELETE /api/admin/media/{file_id}
       # Удалить файл с диска
       # Удалить запись из БД
       Response: { message }
```

---

#### 3.3 Frontend: AdminMedia страница

**Файл:** `src/pages/admin/AdminMedia.tsx`

- Drag & Drop зона + кнопка «Загрузить»
- Grid view (4 колонки) / List view переключатель
- Карточка файла: миниатюра, имя, размер, дата
- Hover: кнопки «Копировать URL», «Редактировать alt», «Удалить»
- Фильтр по типу (все / изображения / документы)
- Пагинация

**MediaPickerModal компонент** (`src/components/admin/MediaPickerModal.tsx`):
- Открывается из BlogEditor при вставке изображения
- Выбор из загруженных файлов или загрузка нового

---

**Результат Этапа 3:**
- Загрузка изображений через Admin Panel
- Медиабиблиотека доступна из редактора блога
- Файлы хранятся в `backend/uploads/`, URL через `/uploads/`

---

### Этап 4 — Управление обращениями (CRM доработка)

> **Цель:** Полноценный CRM-интерфейс для работы с обращениями клиентов.

#### 4.1 Backend: Contact endpoints (доработка)

**Файл:** `backend/routes/admin.py`

```python
GET    /api/admin/contacts/{inquiry_id}
       Response: ContactInquiryDetailResponse

PATCH  /api/admin/contacts/{inquiry_id}
       Body: { status?, priority?, assigned_to?, is_spam?, contacted_at? }
       Response: ContactInquiryResponse

DELETE /api/admin/contacts/{inquiry_id}
       Response: { message }

GET    /api/admin/export/contacts
       Query: status?, date_from?, date_to?
       Response: CSV file
```

---

#### 4.2 Frontend: AdminContacts доработка

**Файл:** `src/pages/admin/AdminContacts.tsx`

Добавить:
- Фильтр по priority (low/medium/high/urgent)
- Фильтр по inquiry_type
- Фильтр по дате
- Цветовые badges для приоритета

**Файл:** `src/pages/admin/AdminContactDetail.tsx` (новый)

Разделы:
1. Контактные данные (name, email, phone, company, position)
2. Тело обращения (subject, message)
3. Метаданные (source, UTM, created_at, contacted_at)
4. CRM-панель:
   - Status dropdown (new → contacted → qualified → converted → closed)
   - Priority dropdown
   - Assigned to (текстовое поле)
   - Toggle «Спам»
   - Кнопка «Отметить как контактировавшего» (устанавливает contacted_at)
5. «Отправить email» (открывает mailto: с заполненным адресом)

---

**Результат Этапа 4:**
- Детальный просмотр каждого обращения
- Управление статусами и приоритетами
- Экспорт обращений в CSV

---

### Этап 5 — Управление пользователями Admin

> **Цель:** Super admin может управлять другими admin-пользователями.

#### 5.1 Backend: Users API endpoints

**Файл:** `backend/routes/admin.py`

```python
GET    /api/admin/users
       # Только для super_admin
       Response: { items: AdminUserResponse[], total }

GET    /api/admin/users/{user_id}
       Response: AdminUserResponse

POST   /api/admin/users
       Body: { username, email, first_name, last_name, role, permissions{} }
       # Генерация временного пароля (12 символов)
       # Отправка письма-приглашения
       Response: AdminUserResponse

PUT    /api/admin/users/{user_id}
       Body: AdminUserUpdateRequest
       Response: AdminUserResponse

DELETE /api/admin/users/{user_id}
       # Нельзя удалить самого себя
       # Нельзя удалить последнего super_admin
       Response: { message }

POST   /api/admin/users/{user_id}/reset-password
       # Генерирует password_reset_token
       # Отправляет email со ссылкой
       Response: { message }

PATCH  /api/admin/users/{user_id}/toggle-active
       Response: { is_active }
```

---

#### 5.2 Email шаблоны (новые)

**Файлы:**
- `backend/templates/email/admin_invitation.html`
- `backend/templates/email/password_reset.html`

**EmailService:** добавить методы:
```python
async def send_admin_invitation(email: str, username: str, temp_password: str) -> None
async def send_password_reset(email: str, reset_token: str) -> None
```

---

#### 5.3 Frontend: AdminUsers страница

**Файл:** `src/pages/admin/AdminUsers.tsx`

Только для super_admin (скрыт в sidebar для других ролей).

Таблица:
- Avatar (инициалы), Full name, Username, Email, Role badge, Last login, Status toggle, Actions

Форма создания/редактирования (Dialog/Sheet):
- username, email, first_name, last_name
- role select
- Права: чекбоксы для каждого can_*
- is_active toggle

---

**Результат Этапа 5:**
- Super admin управляет командой
- Новые пользователи получают письмо с паролем
- Сброс пароля через email

---

### Этап 6 — Аудиты: детальный просмотр и доработка

> **Цель:** Полноценный просмотр аудита с возможностью управления.

#### 6.1 Backend: дополнительные endpoints для аудитов

**Файл:** `backend/routes/admin.py`

```python
GET    /api/admin/audits/{audit_id}
       Response: {
         audit: AuditFields,
         result: AuditResultFields | null,
         pdf_reports: PDFReportFields[]
       }

POST   /api/admin/audits/{audit_id}/reprocess
       # Сбрасывает status → "pending"
       # Запускает AIService.process_audit_async() заново
       Response: { message, status }

POST   /api/admin/audits/{audit_id}/send-email
       Body: { email?: str }
       # Отправляет audit_completed email
       Response: { message }
```

---

#### 6.2 Frontend: AdminAuditDetail страница

**Файл:** `src/pages/admin/AdminAuditDetail.tsx`

Разделы:
1. Информация о компании (все поля из формы)
2. Контактные данные
3. Статус + временные метки
4. Результаты (если completed):
   - Gauge: maturity_score
   - Финансовые показатели в 3 карточках
   - Accordion: Сильные стороны / Слабые / Возможности / Рекомендации
5. PDF-отчёты: список с кнопкой скачать
6. Действия: «Регенерировать анализ», «Отправить email», «Удалить»

---

**Результат Этапа 6:**
- Полный просмотр аудита
- Возможность перезапустить AI анализ
- Отправка результатов клиенту из Admin

---

### Этап 7 — Настройки системы (доработка)

> **Цель:** SMTP-тестирование и общие настройки через Admin.

#### 7.1 Backend: Settings endpoints

**Файл:** `backend/routes/admin.py`

```python
GET    /api/admin/settings/email
       Response: { smtp_server, smtp_port, smtp_username, from_email, from_name }
       # smtp_password — не возвращать

PATCH  /api/admin/settings/email
       Body: { smtp_server?, smtp_port?, smtp_username?, smtp_password?, from_email?, from_name? }
       # Сохранить в БД (новая таблица SystemSettings) или в .env через файл
       Response: { message }

POST   /api/admin/settings/email/test
       Body: { to_email: str }
       # Отправить тестовое письмо
       Response: { message, success }
```

**Модель `SystemSettings`** (новая таблица):
```python
class SystemSettings(Base):
    __tablename__ = "system_settings"
    key   = Column(String(100), primary_key=True)
    value = Column(Text)
    updated_at = Column(DateTime, default=datetime.utcnow)
```

---

#### 7.2 Frontend: AdminSettings страница

**Файл:** `src/pages/admin/AdminSettings.tsx`

Вкладки:
1. **AI** — существующий интерфейс конфигурации (перенести из монолитного Admin.tsx)
2. **Email** — форма SMTP + кнопка «Отправить тест»
3. **Общие** — название сайта, URL, поддерживаемые языки

---

**Результат Этапа 7:**
- Настройки SMTP доступны через интерфейс
- Тестирование email без деплоя
- Централизованное управление настройками

---

### Этап 8 — Аналитика (доработка) и Refresh Token

#### 8.1 Аналитика: date range + новые метрики

**Backend:**
```python
GET    /api/admin/analytics/summary
       Query: period? (7d|30d|90d|365d), date_from?, date_to?
       Response: полные метрики за период

GET    /api/admin/analytics/blog
       Response: { top_posts[], monthly_views[], category_breakdown{} }

GET    /api/admin/export/analytics
       Query: period?
       Response: PDF (через PDFService)
```

**Frontend (`src/pages/admin/AdminAnalytics.tsx`):**
- Date range picker (библиотека: react-day-picker — уже в зависимостях Radix)
- Быстрые preset: 7 дней, 30 дней, 90 дней, год
- Воронка конверсии (funnel chart или step-диаграмма)
- Таблица топ-10 статей блога

---

#### 8.2 Refresh Token механизм

**Backend:** добавить `POST /api/admin/refresh`

**Frontend:** перехватчик 401 ответа:
```typescript
// В src/utils/api.ts
// При получении 401 — попытаться обновить через refresh_token
// Если и это не работает — logout
```

---

**Результат Этапа 8:**
- Аналитика с гибким выбором периода
- Безопасная ротация токенов
- Экспорт аналитического отчёта в PDF

---

### Этап 9 — Alembic миграции и технический долг

#### 9.1 Инициализация Alembic

```bash
cd backend
alembic init alembic
# Настроить alembic.ini: sqlalchemy.url из DATABASE_URL
# Настроить alembic/env.py: импортировать все модели
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

---

#### 9.2 Удаление мёртвых зависимостей

Из `package.json` удалить:
- `express`, `multer`, `bcryptjs`, `jsonwebtoken`
- `@next/font`
- `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/multer`, `@types/sqlite3`

---

#### 9.3 Публичные Blog API endpoints

**Файл:** `backend/routes/blog.py` (новый)

```python
GET    /api/blog
       Query: skip, limit, category?, search?, featured?
       # Только published посты
       Response: { items: PublicBlogPostResponse[], total }

GET    /api/blog/{slug}
       # Инкремент view_count
       Response: PublicBlogPostResponse

GET    /api/blog/categories
       # Список уникальных категорий из опубликованных постов
       Response: string[]
```

Зарегистрировать в `backend/main.py`.

---

#### 9.4 E2E тесты (расширение)

**Файл:** `tests/e2e/smoke.spec.ts`

Добавить сценарии:
- Главная страница загружается
- Форма аудита отправляется
- Страница результатов показывает pending
- Страница контактов отправляет форму
- Admin login работает
- Dashboard отображается после входа

---

**Результат Этапа 9:**
- БД версионируется через миграции
- Публичный Blog API работает с реальными данными
- Убраны мёртвые зависимости
- Базовое тестовое покрытие

---

## 4. Приоритизация и зависимости

```
Этап 1 (Безопасность + Архитектура)
    │  ОБЯЗАТЕЛЕН ПЕРВЫМ — всё остальное строится на нём
    ▼
Этап 2 (CMS Блог) ──────────────────┐
    │                                │
    ▼                                ▼
Этап 3 (Медиабиблиотека)    Этап 4 (CRM Обращений)
    │  зависит от Этапа 2            │  независимый
    │  (нужен для вставки             │
    │  картинок в блог)               │
    └──────────────┬─────────────────┘
                   ▼
Этап 5 (Управление пользователями) ← независимый, нужен Этап 1
                   │
                   ▼
Этап 6 (Детали аудитов) ← независимый, нужен Этап 1
                   │
                   ▼
Этап 7 (Настройки) ← независимый, нужен Этап 1
                   │
                   ▼
Этап 8 (Аналитика + Refresh) ← нужен Этап 1
                   │
                   ▼
Этап 9 (Инфраструктура) ← можно параллельно с любым этапом
```

### Рекомендуемый порядок выполнения

| # | Этап | Приоритет | Зависит от |
|---|------|-----------|------------|
| 1 | Безопасность + архитектура Admin | 🔴 Критично | — |
| 2 | CMS Блог | 🔴 Критично | Этап 1 |
| 3 | Медиабиблиотека | 🟠 Высокий | Этапы 1, 2 |
| 4 | CRM Обращений (доработка) | 🟠 Высокий | Этап 1 |
| 5 | Управление пользователями | 🟠 Высокий | Этап 1 |
| 6 | Детали аудитов | 🟡 Средний | Этап 1 |
| 7 | Настройки | 🟡 Средний | Этап 1 |
| 8 | Аналитика + Refresh Token | 🟡 Средний | Этап 1 |
| 9 | Alembic + технический долг | 🟢 Инфраструктура | — |

---

## 5. Критические файлы для создания / изменения

### Новые файлы (frontend)

```
src/store/adminStore.ts
src/components/admin/ProtectedRoute.tsx
src/components/admin/AdminLayout.tsx
src/components/admin/AdminSidebar.tsx
src/components/admin/AdminTopbar.tsx
src/components/admin/BlogEditor.tsx         ← TipTap
src/components/admin/MediaPickerModal.tsx
src/pages/admin/AdminDashboard.tsx
src/pages/admin/AdminAudits.tsx
src/pages/admin/AdminAuditDetail.tsx
src/pages/admin/AdminContacts.tsx
src/pages/admin/AdminContactDetail.tsx
src/pages/admin/AdminBlog.tsx
src/pages/admin/AdminBlogEditor.tsx
src/pages/admin/AdminMedia.tsx
src/pages/admin/AdminUsers.tsx
src/pages/admin/AdminAnalytics.tsx
src/pages/admin/AdminSettings.tsx
```

### Изменяемые файлы (frontend)

```
src/App.tsx                    ← новые маршруты /admin/*
src/pages/Blog.tsx             ← подключить к API
src/pages/BlogPost.tsx         ← подключить к API
```

### Новые файлы (backend)

```
backend/models/media.py
backend/routes/blog.py         ← публичный blog API
backend/templates/email/admin_invitation.html
backend/templates/email/password_reset.html
```

### Изменяемые файлы (backend)

```
backend/routes/admin.py        ← добавить ~15 новых endpoints
backend/services/email_service.py  ← 2 новых метода
backend/database/config.py     ← зарегистрировать MediaFile
backend/main.py                ← подключить blog router
```

---

## 6. Новые зависимости для установки

```bash
# Frontend — Rich Text Editor
npm install @tiptap/react @tiptap/starter-kit \
  @tiptap/extension-image @tiptap/extension-link \
  @tiptap/extension-code-block-lowlight \
  @tiptap/extension-placeholder \
  @tiptap/extension-character-count \
  lowlight

# Frontend — Date picker (скорее всего уже есть через Radix)
# react-day-picker входит в shadcn/ui Calendar, проверить наличие
```

```bash
# Backend — для работы с изображениями при upload (Pillow уже установлен)
# python-multipart уже установлен
# Ничего дополнительного не требуется
```

---

*Документ создан автоматически на основе анализа кодовой базы и TECHSPEC.md v1.0*

---

## 7. Актуальный статус реализации (2026-02-20) — ОБНОВЛЕНО

> Gap-closing завершён 2026-02-20. Все задачи Medium/Low выполнены.

| Этап | Статус | Примечания |
|------|--------|------------|
| **1** Безопасность + архитектура | ✅ Полностью | RBAC применён в 13 маршрутах; refresh token interceptor в api.ts |
| **2** CMS Блог | ✅ Полностью | — |
| **3** Медиабиблиотека | ✅ Полностью | MediaPickerModal создан; grid/list toggle добавлен |
| **4** CRM Обращений | ✅ Полностью | Фильтры по inquiry_type + date range добавлены; Delete кнопки в списке и детали |
| **5** Пользователи | ✅ Полностью | Email invitation flow + send_password_reset + last super_admin guard |
| **6** Детали аудита | ✅ Полностью | PDF-отчёты возвращаются; кнопка Удалить на странице детали |
| **7** Настройки | ✅ Полностью | — |
| **8** Аналитика + Refresh | ✅ Полностью | `/analytics?period=` + `/analytics/blog`; период selector в UI |
| **9** Технический долг | ✅ Полностью | Alembic миграция создана и применена; e2e admin тесты добавлены |

---

## 8. Gap-Closing Чеклист (приоритет по убыванию)

### 🔴 CRITICAL — Безопасность

#### C-1: Применить RBAC через `require_permission()`

**Файл:** `backend/routes/admin.py`

Функция `require_permission()` определена (строка ~132), но ни разу не применена. Необходимо добавить `Depends(require_permission(...))` к чувствительным маршрутам:

```python
# Примеры:
@router.get("/users", dependencies=[Depends(require_permission("can_manage_users"))])
@router.post("/users", dependencies=[Depends(require_permission("can_manage_users"))])
@router.get("/users/{user_id}", dependencies=[Depends(require_permission("can_manage_users"))])
@router.delete("/blog/{post_id}", dependencies=[Depends(require_permission("can_manage_content"))])
@router.get("/export/contacts", dependencies=[Depends(require_permission("can_export_data"))])
@router.delete("/media/{media_id}", dependencies=[Depends(require_permission("can_manage_content"))])
```

---

#### C-2: Refresh Token interceptor в `api.ts`

**Файл:** `src/utils/api.ts`

```typescript
// При 401: взять refresh_token из adminStore, вызвать POST /api/admin/refresh,
// обновить authToken в store, повторить оригинальный запрос.
// Если refresh тоже 401 — вызвать store.logout() и бросить ошибку.
```

---

### 🟠 HIGH — Функциональные разрывы

#### H-1: `DELETE /api/admin/contacts/{id}`

**Файл:** `backend/routes/admin.py` — добавить endpoint после PATCH contacts.

```python
@router.delete("/contacts/{contact_id}", status_code=204)
async def delete_contact(contact_id: int, ...):
    ...
```

Добавить кнопку «Удалить» в `AdminContactDetail.tsx` и `AdminContacts.tsx`.

---

#### H-2: Защита "последний super_admin"

**Файл:** `backend/routes/admin.py`, функция `delete_admin_user` (~строка 1650)

```python
# Перед удалением проверить:
super_admin_count = await db.scalar(
    select(func.count(AdminUser.id)).where(AdminUser.role == "super_admin")
)
if super_admin_count <= 1 and user.role == "super_admin":
    raise HTTPException(400, "Cannot delete the last super_admin")
```

---

#### H-3: PDF-отчёты в `GET /admin/audits/{id}`

**Файл:** `backend/routes/admin.py`, функция `get_audit_detail`

Добавить в возвращаемый dict:
```python
"pdf_reports": [
    {
        "id": r.id, "filename": r.filename,
        "file_size": r.file_size, "generated_at": r.generated_at.isoformat(),
        "download_url": f"/reports/{r.filename}",
    }
    for r in audit.pdf_reports
]
```

Отобразить в `AdminAuditDetail.tsx` (секция «PDF-отчёты»).

---

#### H-4: Удаление dead npm зависимостей

**Файл:** `package.json`

Удалить из `dependencies`:
- `express`, `multer`, `bcryptjs`, `jsonwebtoken`, `@next/font`
- `@types/bcryptjs`, `@types/jsonwebtoken`, `@types/multer`, `@types/sqlite3`

Удалить из `devDependencies`:
- `@types/cors`, `@types/express`

Проверить сборку: `npm run build`.

---

### 🟡 MEDIUM — Функциональность

#### M-1: Аналитика с date range (Этап 8.1)

**Backend:** добавить в `admin.py`:

```python
GET /api/admin/analytics/summary
    Query: period? (7d|30d|90d|365d)
    # Фильтрация audits/contacts по created_at

GET /api/admin/analytics/blog
    Response: { top_posts[], monthly_views[] }
```

**Frontend:** `AdminAnalytics.tsx` — добавить period selector (кнопки 7d/30d/90d/год), перегружать данные при смене периода.

---

#### M-2: Создать начальную Alembic миграцию

```bash
cd backend
./venv/Scripts/pip install alembic  # если не установлен
./venv/Scripts/alembic revision --autogenerate -m "initial_schema"
./venv/Scripts/alembic upgrade head
```

Коммитить файл в `backend/migrations/versions/`.

---

#### M-3: Фильтры в AdminContacts

**Файл:** `src/pages/admin/AdminContacts.tsx`

Добавить к существующим фильтрам:
- Dropdown `inquiry_type` (general/consultation/support/partnership)
- Date picker для фильтрации по `created_at`

**Backend:** обновить `GET /admin/contacts` для поддержки `inquiry_type` и `date_from/date_to` query params.

---

#### M-4: Email invitation flow для новых пользователей

**Backend:** в `POST /admin/users` (`admin.py` ~строка 1584) вместо прямой передачи пароля:
1. Генерировать временный пароль (12 символов)
2. Сохранить `hashed_password`
3. Вызвать `email_service.send_admin_invitation(email, username, temp_password)`
4. Не возвращать пароль в response

**Email template:** `backend/email_templates/admin_invitation.html`

---

#### M-5: MediaPickerModal

**Файл:** `src/components/admin/MediaPickerModal.tsx` (новый)

Открывается из `BlogEditor.tsx` при нажатии кнопки Image — вместо `window.prompt`. Показывает grid существующих медиафайлов + кнопку загрузить новый. При выборе — вставляет URL в редактор.

---

#### M-6: E2E тесты Admin

**Файл:** `tests/e2e/smoke.spec.ts`

Добавить сценарии (Playwright):
- `admin login` — успешный вход через `/admin/login`
- `dashboard loads` — проверить KPI-карточки
- `admin logout` — очистка sessionStorage

---

### 🟢 LOW — Удобство

- AdminMedia: добавить grid/list view переключатель
- AdminAuditDetail: добавить кнопку «Удалить аудит» (вызов `DELETE /submissions/{id}`)
- AdminAudits: добавить фильтры по дате и отрасли
- AdminBlogEditor: интеграция с MediaPickerModal (зависит от M-5)
- AdminContacts export: поддержка фильтров по датам/статусу

---

## 9. Порядок выполнения оставшихся задач

| # | Задача | Сложность | Зависимости |
|---|--------|-----------|-------------|
| 1 | **C-1** RBAC enforcement | Низкая | — |
| 2 | **C-2** Refresh token interceptor | Средняя | — |
| 3 | **H-1** DELETE contacts | Низкая | — |
| 4 | **H-2** Last super_admin guard | Низкая | — |
| 5 | **H-3** PDF reports in audit detail | Низкая | — |
| 6 | **H-4** Удалить dead npm deps | Низкая | — |
| 7 | **M-2** Alembic initial migration | Низкая | pip install alembic |
| 8 | **M-1** Analytics date range | Средняя | — |
| 9 | **M-3** Contact filters | Средняя | — |
| 10 | **M-4** Email invitation | Средняя | email templates |
| 11 | **M-5** MediaPickerModal | Средняя | Этап 3 done |
| 12 | **M-6** E2E admin tests | Средняя | — |

*Обновлено: 2026-02-20 на основе gap-анализа и верификации кода*
