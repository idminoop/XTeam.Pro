# XTeam.Pro — Техническая спецификация продукта

**Версия:** 1.0
**Дата:** 2026-02-19
**Статус:** Актуальная

---

## Содержание

1. [Обзор продукта](#1-обзор-продукта)
2. [Стек технологий](#2-стек-технологий)
3. [Архитектура системы](#3-архитектура-системы)
4. [Frontend — спецификация](#4-frontend--спецификация)
   - 4.1 [Маршрутизация и страницы](#41-маршрутизация-и-страницы)
   - 4.2 [Компоненты Layout](#42-компоненты-layout)
   - 4.3 [UI-компоненты](#43-ui-компоненты)
   - 4.4 [Управление состоянием](#44-управление-состоянием)
   - 4.5 [Формы и валидация](#45-формы-и-валидация)
   - 4.6 [Интернационализация (i18n)](#46-интернационализация-i18n)
   - 4.7 [Темизация](#47-темизация)
   - 4.8 [Работа с API](#48-работа-с-api)
5. [Backend — спецификация](#5-backend--спецификация)
   - 5.1 [Структура приложения](#51-структура-приложения)
   - 5.2 [Маршруты API](#52-маршруты-api)
   - 5.3 [Сервисный слой](#53-сервисный-слой)
   - 5.4 [Middleware](#54-middleware)
6. [База данных — схема](#6-база-данных--схема)
   - 6.1 [Модели](#61-модели)
   - 6.2 [Связи](#62-связи)
   - 6.3 [Миграции](#63-миграции)
7. [Полная спецификация Admin Panel (CMS)](#7-полная-спецификация-admin-panel-cms)
   - 7.1 [Аутентификация и роли](#71-аутентификация-и-роли)
   - 7.2 [Dashboard — главная страница](#72-dashboard--главная-страница)
   - 7.3 [Управление аудитами](#73-управление-аудитами)
   - 7.4 [Управление обращениями (CRM)](#74-управление-обращениями-crm)
   - 7.5 [CMS — Блог и контент](#75-cms--блог-и-контент)
   - 7.6 [Управление пользователями](#76-управление-пользователями)
   - 7.7 [Аналитика и отчёты](#77-аналитика-и-отчёты)
   - 7.8 [Настройки системы](#78-настройки-системы)
   - 7.9 [Медиабиблиотека](#79-медиабиблиотека)
   - 7.10 [Admin API — полная спецификация эндпоинтов](#710-admin-api--полная-спецификация-эндпоинтов)
8. [Безопасность](#8-безопасность)
9. [Email-коммуникации](#9-email-коммуникации)
10. [AI-интеграция](#10-ai-интеграция)
11. [PDF-генерация](#11-pdf-генерация)
12. [Нефункциональные требования](#12-нефункциональные-требования)
13. [Переменные окружения](#13-переменные-окружения)
14. [Инфраструктура и развёртывание](#14-инфраструктура-и-развёртывание)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Известные ограничения и технический долг](#16-известные-ограничения-и-технический-долг)

---

## 1. Обзор продукта

**XTeam.Pro** — платформа оценки готовности бизнеса к автоматизации и консалтинга. Предоставляет клиентам инструменты AI-диагностики бизнес-процессов, расчёта ROI автоматизации и получения персонализированных рекомендаций.

### Ключевые функциональные блоки

| Блок | Описание |
|------|----------|
| AI Аудит | Многошаговый опрос → GPT-4 анализ → PDF-отчёт |
| ROI Калькулятор | Расчёт возврата инвестиций с 3-летними проекциями |
| CRM / Контакты | Управление входящими обращениями |
| Блог | Публикация статей, управление контентом |
| Admin Panel | Полноценный CMS/CRM для менеджмента |

### Поддерживаемые языки

- **Русский** (основной)
- **Английский**

### Целевая аудитория

- Клиенты платформы (руководители бизнеса, IT-директора)
- Администраторы и менеджеры XTeam

---

## 2. Стек технологий

### Frontend

| Категория | Технология | Версия |
|-----------|------------|--------|
| Фреймворк | React | 18.3.1 |
| Язык | TypeScript | 5.x |
| Сборщик | Vite | 5.x |
| Маршрутизация | React Router | 7.3.0 |
| Стилизация | Tailwind CSS | 3.4.17 |
| UI-библиотека | shadcn/ui + Radix UI | latest |
| Формы | React Hook Form | 7.62.0 |
| Валидация | Zod | 3.23.8 |
| Графики | Recharts | 3.1.2 |
| Анимации | Framer Motion | 12.23.12 |
| Уведомления | Sonner (toast) | 2.0.7 |
| Состояние | Zustand | 5.0.3 |
| i18n | i18next + react-i18next | 25.x / 15.x |
| HTTP-клиент | Fetch API (apiCall wrapper) | — |
| Иконки | Lucide React | 0.511.0 |

### Backend

| Категория | Технология | Версия |
|-----------|------------|--------|
| Фреймворк | FastAPI | 0.104.1 |
| ASGI-сервер | Uvicorn | 0.24.0 |
| ORM | SQLAlchemy (async) | 2.0.23 |
| Миграции | Alembic | 1.12.1 |
| DB (dev) | SQLite + aiosqlite | 0.20.0 |
| DB (prod) | PostgreSQL + asyncpg | — |
| AI | OpenAI GPT-4 | 1.3.7 |
| PDF | ReportLab + Matplotlib | 4.0.7 / 3.8.2 |
| Auth | JWT (python-jose) + bcrypt | 3.3.0 / 4.0.1 |
| Шаблоны email | Jinja2 | 3.1.2 |
| Email | SMTP (asyncio) | — |
| Валидация | Pydantic v2 | 2.5.0 |

---

## 3. Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (Browser)                        │
│                                                              │
│  React SPA (Vite)                                            │
│  ├── Public Pages (Home, About, Blog, Pricing, Solutions)    │
│  ├── Audit Flow (Audit → AuditResults)                       │
│  ├── ROI Calculator                                          │
│  ├── Contact                                                 │
│  └── Admin Panel (CMS/CRM Dashboard)                         │
│                                                              │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTPS / JSON API
                             │ /api/* proxy (dev: Vite → 8001)
┌────────────────────────────▼────────────────────────────────┐
│                   FastAPI Application                         │
│  ├── RateLimitMiddleware (60 req/min, 100 req/hr per IP)     │
│  ├── RequestLoggerMiddleware                                  │
│  ├── CORS Middleware                                          │
│  ├── TrustedHost Middleware (prod only)                       │
│  │                                                            │
│  ├── /api/audit      → AuditRouter                           │
│  ├── /api/contact    → ContactRouter                         │
│  ├── /api/calculator → CalculatorRouter                      │
│  ├── /api/admin      → AdminRouter (JWT required)            │
│  ├── /health         → Health check                          │
│  ├── /reports/       → Static PDF files                      │
│  └── /uploads/       → Static uploaded media                 │
│                                                              │
│  Services                                                     │
│  ├── AIService (OpenAI GPT-4, mock fallback)                 │
│  ├── AuthService (JWT, bcrypt)                               │
│  ├── EmailService (SMTP, Jinja2 templates)                   │
│  ├── PDFService (ReportLab, Matplotlib)                      │
│  └── AnalyticsService                                         │
│                                                              │
└──────────────┬──────────────────────────┬───────────────────┘
               │                          │
┌──────────────▼──────────┐  ┌────────────▼─────────────────┐
│  SQLite (development)    │  │  PostgreSQL (production)      │
│  xteam_pro.db            │  │  DATABASE_URL=postgresql://   │
│                          │  │                               │
│  Tables:                 │  │  Same schema, async driver    │
│  - audits                │  │  (asyncpg)                    │
│  - audit_results         │  │                               │
│  - pdf_reports           │  └───────────────────────────────┘
│  - contact_inquiries     │
│  - admin_users           │
│  - audit_configurations  │
│  - blog_posts            │
└──────────────────────────┘
```

### Поток обработки аудита (асинхронный)

```
Client                     FastAPI                        OpenAI
  │                           │                              │
  │  POST /api/audit/submit   │                              │
  │──────────────────────────►│                              │
  │                           │ CREATE Audit (status=pending)│
  │                           │ asyncio.create_task(         │
  │                           │   _process_audit_background) │
  │  ◄── {audit_id, pending} ─│                              │
  │                           │                              │
  │  [polling every 3s]       │ status → processing          │
  │  GET /api/audit/status/id │                              │
  │──────────────────────────►│  POST chat/completions ─────►│
  │  ◄── {status: processing} │                              │
  │                           │  ◄── analysis JSON ──────────│
  │  GET /api/audit/status/id │ CREATE AuditResult           │
  │──────────────────────────►│ GENERATE PDF                 │
  │  ◄── {status: completed}  │ SEND email to user           │
  │                           │ status → completed           │
  │  GET /api/audit/results/id│                              │
  │──────────────────────────►│                              │
  │  ◄── {full results + PDF} │                              │
```

---

## 4. Frontend — спецификация

### 4.1 Маршрутизация и страницы

Все страницы подключаются через `React.lazy()` + `Suspense` (code splitting).

| Маршрут | Компонент | Описание |
|---------|-----------|----------|
| `/` | `Home` | Главная страница (hero, features, stats, CTA) |
| `/audit` | `Audit` | Многошаговый опросник аудита |
| `/audit/results/:id` | `AuditResults` | Результаты аудита с графиками |
| `/solutions` | `Solutions` | Обзор решений компании |
| `/pricing` | `Pricing` | Тарифные планы |
| `/blog` | `Blog` | Список статей блога |
| `/blog/:slug` | `BlogPost` | Отдельная статья |
| `/cases` | `CaseStudies` | Кейсы клиентов |
| `/about` | `About` | О компании |
| `/careers` | `Careers` | Карьера |
| `/contact` | `Contact` | Форма обратной связи |
| `/privacy` | `Privacy` | Политика конфиденциальности |
| `/terms` | `Terms` | Условия использования |
| `/cookies` | `Cookies` | Политика cookies |
| `/admin/*` | `Admin` | Панель администратора (все вложенные маршруты) |
| `*` | `NotFound` | 404 страница |

#### Admin Panel — вложенные маршруты

| Маршрут | Описание |
|---------|----------|
| `/admin` | Редирект на `/admin/login` или `/admin/dashboard` |
| `/admin/login` | Страница входа |
| `/admin/dashboard` | Главная панель (статистика) |
| `/admin/audits` | Список аудитов |
| `/admin/audits/:id` | Детали аудита |
| `/admin/contacts` | Список обращений |
| `/admin/contacts/:id` | Детали обращения |
| `/admin/blog` | Список записей блога |
| `/admin/blog/new` | Создание новой статьи |
| `/admin/blog/:id/edit` | Редактирование статьи |
| `/admin/media` | Медиабиблиотека |
| `/admin/analytics` | Аналитика и отчёты |
| `/admin/users` | Управление пользователями |
| `/admin/settings` | Настройки системы |

### 4.2 Компоненты Layout

#### `Layout.tsx`
Общая обёртка для публичных страниц.
```
<Layout>
  <Header />
  <main>{children}</main>
  <Footer />
</Layout>
```

#### `Header.tsx`
- Логотип (ссылка на `/`)
- Навигационные ссылки
- Кнопка смены языка (`LanguageSwitcher`)
- Кнопка переключения темы (dark/light)
- CTA-кнопка «Пройти аудит»

#### `Footer.tsx`
- Разделы: О компании, Услуги, Ресурсы, Контакты
- Социальные сети
- Копирайт
- Ссылки на Privacy/Terms/Cookies

#### `AdminLayout.tsx` (требует реализации / доработки)
- Боковое меню (sidebar) с навигацией по разделам
- Верхняя панель (topbar): имя пользователя, роль, кнопка выхода
- Область контента
- Breadcrumbs

### 4.3 UI-компоненты

Все компоненты shadcn/ui хранятся в `src/components/ui/` и **не редактируются вручную** — добавляются через `npx shadcn add <component>`.

Установленные компоненты:
- `button`, `card`, `input`, `label`, `select`, `tabs`, `dialog`, `dropdown-menu`, `toast`, `tooltip`, `badge`, `separator`, `skeleton`, `textarea`, `checkbox`, `radio-group`, `switch`, `progress`, `alert`, `avatar`, `table`

### 4.4 Управление состоянием

| Состояние | Инструмент |
|-----------|------------|
| Глобальное UI-состояние | Zustand store |
| Тема (dark/light) | `useTheme` hook (localStorage + CSS class) |
| Язык | i18next (localStorage) |
| Auth токен (admin) | sessionStorage |
| Серверное состояние | Локальные useState + useEffect (polling) |

#### Zustand Store (предполагаемая структура)
```typescript
interface AppStore {
  // Auth
  authToken: string | null;
  setAuthToken: (token: string | null) => void;
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser | null) => void;
  // UI
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
}
```

### 4.5 Формы и валидация

Все формы — **React Hook Form + Zod**.

#### Форма аудита (`Audit.tsx`)
Многошаговая (wizard), шаги:
1. Информация о компании (company_name, industry, company_size)
2. Текущие процессы (current_challenges[], business_processes[])
3. Цели автоматизации (automation_goals[], budget_range, timeline)
4. Контактные данные (contact_email, contact_name, phone)

#### Форма контакта (`Contact.tsx`)
Поля: name, email, phone?, company?, position?, inquiry_type, subject, message, marketing_consent

#### ROI Калькулятор
Поля: company_size, industry, annual_revenue, current_processes[], employee_count, processes_to_automate[], expected_efficiency_gain, budget_range

### 4.6 Интернационализация (i18n)

- **Библиотека:** i18next + react-i18next
- **Файлы:** `src/locales/en.json`, `src/locales/ru.json`
- **Определение языка:** `i18next-browser-languagedetector` (из localStorage, navigator)
- **Fallback:** английский

**Правило:** все строки видимые пользователю — через `useTranslation()`.
```typescript
const { t } = useTranslation();
// Использование:
t('home.hero.title')
t('audit.steps.company.title')
```

**Проверка синхронизации:** `npm run i18n:check`

### 4.7 Темизация

- **Режим:** `class`-based (Tailwind)
- **Хранение:** `localStorage` ключ `theme`
- **Переключение:** добавляет/убирает класс `dark` на `<html>`
- **CSS-переменные:** определены в `src/index.css`

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  /* ... */
}
.dark {
  --background: 222.2 84% 4.9%;
  /* ... */
}
```

### 4.8 Работа с API

Единственная точка входа — `src/utils/api.ts`:

```typescript
// Базовый URL из VITE_API_URL (default: http://localhost:8000)
async function apiCall<T>(
  endpoint: string,
  options?: RequestInit,
  token?: string
): Promise<ApiResponse<T>>
```

В dev-режиме Vite проксирует `/api/*` → `http://localhost:8001`.

---

## 5. Backend — спецификация

### 5.1 Структура приложения

```
backend/
├── main.py                    # App factory, middleware, lifespan
├── database/
│   └── config.py              # Engine, sessions, init_db()
├── models/
│   ├── audit.py               # Audit, AuditResult, PDFReport
│   ├── contact.py             # ContactInquiry
│   ├── admin.py               # AdminUser, AuditConfiguration
│   └── blog.py                # BlogPost
├── routes/
│   ├── audit.py               # /api/audit/*
│   ├── contact.py             # /api/contact/*
│   ├── calculator.py          # /api/calculator/*
│   └── admin.py               # /api/admin/* (JWT required)
├── services/
│   ├── ai_service.py          # OpenAI GPT-4 integration
│   ├── auth_service.py        # JWT, bcrypt
│   ├── email_service.py       # SMTP, Jinja2 templates
│   ├── pdf_service.py         # ReportLab, Matplotlib
│   └── analytics_service.py   # Statistics & trends
├── middleware/
│   └── rate_limit.py          # IP-based rate limiting
├── templates/
│   └── email/                 # Jinja2 HTML email templates
├── reports/                   # Generated PDF reports (static)
├── uploads/                   # Uploaded media files (static)
├── tests/
│   ├── conftest.py
│   └── test_release_readiness.py
├── requirements.txt
└── .env.example
```

### 5.2 Маршруты API

#### `GET /health`
```json
{
  "status": "healthy",
  "timestamp": "2026-02-19T12:00:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

#### Аудит — `/api/audit`

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/submit` | — | Отправить аудит |
| GET | `/results/{audit_id}` | — | Получить результаты |
| GET | `/status/{audit_id}` | — | Статус обработки |
| GET | `/download/{audit_id}` | — | Скачать PDF |

#### Контакт — `/api/contact`

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/contact-submit` | — | Отправить обращение |
| GET | `/inquiry/{inquiry_id}` | — | Детали обращения |
| GET | `/inquiries` | Admin | Список обращений |
| PATCH | `/inquiry/{inquiry_id}/status` | Admin | Изменить статус |

#### Калькулятор — `/api/calculator`

| Метод | Путь | Auth | Описание |
|-------|------|------|----------|
| POST | `/roi` | — | Рассчитать ROI |
| POST | `/process-analysis` | — | Анализ процесса |
| GET | `/benchmarks/{industry}` | — | Бенчмарки отрасли |

#### Администрирование — `/api/admin`

Полная спецификация в разделе 7.10.

### 5.3 Сервисный слой

#### AIService

```python
class AIService:
    # Mock режим: когда OPENAI_API_KEY отсутствует или placeholder
    mock_mode: bool

    async def process_audit_async(audit_id: int, audit_data: dict) -> None
    # Создаёт asyncio.create_task для фонового процесса

    async def _process_audit_background(audit_id: int, audit_data: dict) -> None
    # 1. Меняет статус на "processing"
    # 2. Вызывает _analyze_business_processes()
    # 3. Создаёт AuditResult в БД
    # 4. Генерирует PDF через PDFService
    # 5. Меняет статус на "completed" или "failed"
    # 6. Отправляет email через EmailService

    async def _analyze_business_processes(
        audit_data: dict,
        model: str = "gpt-4",
        config: AuditConfiguration = None
    ) -> dict
    # GPT-4 системный промпт: бизнес-аналитик
    # Возвращает структурированный JSON:
    # { maturity_score, roi_projection, timeline_estimate,
    #   automation_opportunities[], recommendations[],
    #   cost_analysis: { estimated_savings, implementation_cost, payback_period } }

    async def generate_roi_insights(roi_data: dict) -> dict
    # Возвращает: { recommendations[], roadmap[], risk_mitigation[] }
```

#### AuthService

```python
class AuthService:
    SECRET_KEY: str  # из JWT_SECRET_KEY env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE: int = 30  # минут

    def verify_password(plain: str, hashed: str) -> bool
    def get_password_hash(password: str) -> str
    def create_access_token(data: dict, expires_delta=None) -> str
    def create_refresh_token(data: dict) -> str
    def verify_token(token: str, token_type: str = "access") -> dict
    async def authenticate_user(username: str, password: str) -> Optional[AdminUser]
    async def initialize_default_admin() -> None
    async def get_current_user(token: str) -> AdminUser  # FastAPI Depends
```

#### EmailService

```python
class EmailService:
    async def send_contact_notification(inquiry: ContactInquiry) -> None
    async def send_contact_confirmation(inquiry: ContactInquiry) -> None
    async def send_audit_completed(audit_id: int, results: dict) -> None
    async def send_welcome_email(email: str, name: str) -> None
    async def send_admin_invitation(email: str, temp_password: str) -> None  # NEW
    async def send_password_reset(email: str, reset_token: str) -> None     # NEW
```

#### PDFService

```python
class PDFService:
    async def generate_audit_report(
        audit_id: int,
        analysis: dict
    ) -> PDFReport
    # Разделы отчёта:
    # - Обложка (логотип, название, дата)
    # - Резюме для руководства
    # - Оценка зрелости (maturity_score gauge chart)
    # - Потенциал автоматизации
    # - ROI-проекция (bar chart 3 года)
    # - Детальный анализ процессов
    # - Рекомендации (приоритизированные)
    # - Дорожная карта внедрения
    # - Финансовый расчёт

    async def generate_executive_summary(audit_id: int) -> PDFReport  # NEW
```

#### AnalyticsService

```python
class AnalyticsService:
    async def get_audit_statistics() -> dict
    async def get_contact_statistics() -> dict
    async def get_monthly_trends(months: int = 12) -> dict
    async def get_roi_analysis() -> dict
    async def get_blog_statistics() -> dict          # NEW
    async def get_conversion_funnel() -> dict        # NEW
    async def get_top_industries() -> dict           # NEW
```

### 5.4 Middleware

#### RateLimitMiddleware
- 60 запросов/минуту на IP
- 100 запросов/час на IP (настраивается через `RATE_LIMIT_REQUESTS`)
- При превышении: `HTTP 429 Too Many Requests`
- Исключения: `/health`, статические файлы

#### RequestLoggerMiddleware
Логирует: метод, путь, статус, время выполнения, IP-клиента.

---

## 6. База данных — схема

### 6.1 Модели

#### `audits`

```sql
CREATE TABLE audits (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    company_name        VARCHAR(200) NOT NULL,
    industry            VARCHAR(100) NOT NULL,
    company_size        VARCHAR(50) NOT NULL,
    current_challenges  JSON,          -- string[]
    business_processes  JSON,          -- string[]
    automation_goals    JSON,          -- string[]
    budget_range        VARCHAR(50),
    timeline            VARCHAR(50),
    contact_email       VARCHAR(200) NOT NULL,
    contact_name        VARCHAR(200) NOT NULL,
    phone               VARCHAR(50),
    status              VARCHAR(20) NOT NULL DEFAULT 'pending',
                        -- ENUM: pending | processing | completed | failed
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

#### `audit_results`

```sql
CREATE TABLE audit_results (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id                INTEGER NOT NULL REFERENCES audits(id),
    maturity_score          FLOAT,          -- 0-100
    automation_potential    FLOAT,          -- 0-100
    roi_projection          FLOAT,          -- процент
    implementation_timeline VARCHAR(100),
    strengths               JSON,           -- string[]
    weaknesses              JSON,           -- string[]
    opportunities           JSON,           -- string[]
    recommendations         JSON,           -- string[]
    process_scores          JSON,           -- {process: score}
    priority_areas          JSON,           -- string[]
    estimated_savings       FLOAT,          -- USD/год
    implementation_cost     FLOAT,          -- USD
    payback_period          FLOAT,          -- месяцев
    created_at              TIMESTAMP DEFAULT NOW()
);
```

#### `pdf_reports`

```sql
CREATE TABLE pdf_reports (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    audit_id        INTEGER NOT NULL REFERENCES audits(id),
    filename        VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_size       INTEGER,                -- байт
    report_type     VARCHAR(50) DEFAULT 'audit_report',
                    -- ENUM: audit_report | executive_summary
    generated_at    TIMESTAMP DEFAULT NOW(),
    download_count  INTEGER DEFAULT 0
);
```

#### `contact_inquiries`

```sql
CREATE TABLE contact_inquiries (
    id                          INTEGER PRIMARY KEY AUTOINCREMENT,
    name                        VARCHAR(200) NOT NULL,
    email                       VARCHAR(200) NOT NULL,
    phone                       VARCHAR(50),
    company                     VARCHAR(200),
    position                    VARCHAR(100),
    subject                     VARCHAR(300),
    message                     TEXT NOT NULL,
    inquiry_type                VARCHAR(50) DEFAULT 'consultation',
                                -- ENUM: consultation | support | partnership | other
    preferred_contact_method    VARCHAR(20) DEFAULT 'email',
                                -- ENUM: email | phone | both
    budget_range                VARCHAR(50),
    timeline                    VARCHAR(50),
    status                      VARCHAR(20) DEFAULT 'new',
                                -- ENUM: new | contacted | qualified | converted | closed
    priority                    VARCHAR(10) DEFAULT 'medium',
                                -- ENUM: low | medium | high | urgent
    assigned_to                 VARCHAR(200),
    source                      VARCHAR(100) DEFAULT 'website',
    utm_source                  VARCHAR(100),
    utm_medium                  VARCHAR(100),
    utm_campaign                VARCHAR(100),
    is_newsletter_subscribed    BOOLEAN DEFAULT FALSE,
    is_gdpr_compliant           BOOLEAN DEFAULT TRUE,
    is_spam                     BOOLEAN DEFAULT FALSE,
    created_at                  TIMESTAMP DEFAULT NOW(),
    updated_at                  TIMESTAMP DEFAULT NOW(),
    contacted_at                TIMESTAMP
);
```

#### `admin_users`

```sql
CREATE TABLE admin_users (
    id                      INTEGER PRIMARY KEY AUTOINCREMENT,
    username                VARCHAR(100) UNIQUE NOT NULL,
    email                   VARCHAR(200) UNIQUE NOT NULL,
    hashed_password         VARCHAR(255) NOT NULL,
    first_name              VARCHAR(100),
    last_name               VARCHAR(100),
    role                    VARCHAR(20) DEFAULT 'analyst',
                            -- ENUM: super_admin | admin | analyst
    can_manage_audits       BOOLEAN DEFAULT TRUE,
    can_manage_users        BOOLEAN DEFAULT FALSE,
    can_view_analytics      BOOLEAN DEFAULT TRUE,
    can_export_data         BOOLEAN DEFAULT FALSE,
    can_manage_content      BOOLEAN DEFAULT FALSE,
    is_active               BOOLEAN DEFAULT TRUE,
    is_verified             BOOLEAN DEFAULT FALSE,
    last_login              TIMESTAMP,
    created_at              TIMESTAMP DEFAULT NOW(),
    updated_at              TIMESTAMP DEFAULT NOW(),
    created_by              INTEGER REFERENCES admin_users(id),
    failed_login_attempts   INTEGER DEFAULT 0,
    locked_until            TIMESTAMP,
    password_reset_token    VARCHAR(255),
    password_reset_expires  TIMESTAMP
);
```

#### `audit_configurations`

```sql
CREATE TABLE audit_configurations (
    id                              INTEGER PRIMARY KEY AUTOINCREMENT,
    name                            VARCHAR(200) NOT NULL,
    description                     JSON,
    openai_model                    VARCHAR(50) DEFAULT 'gpt-4',
    temperature                     FLOAT DEFAULT 0.7,
    max_tokens                      INTEGER DEFAULT 2000,
    process_automation_weight       FLOAT DEFAULT 0.25,
    data_integration_weight         FLOAT DEFAULT 0.20,
    decision_making_weight          FLOAT DEFAULT 0.20,
    customer_interaction_weight     FLOAT DEFAULT 0.15,
    reporting_analytics_weight      FLOAT DEFAULT 0.20,
    include_executive_summary       BOOLEAN DEFAULT TRUE,
    include_detailed_analysis       BOOLEAN DEFAULT TRUE,
    include_roi_projections         BOOLEAN DEFAULT TRUE,
    include_implementation_roadmap  BOOLEAN DEFAULT TRUE,
    is_active                       BOOLEAN DEFAULT TRUE,
    is_default                      BOOLEAN DEFAULT FALSE,
    created_at                      TIMESTAMP DEFAULT NOW(),
    updated_at                      TIMESTAMP DEFAULT NOW(),
    created_by                      INTEGER REFERENCES admin_users(id)
);
```

#### `blog_posts`

```sql
CREATE TABLE blog_posts (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    title               VARCHAR(300) NOT NULL,
    slug                VARCHAR(300) UNIQUE NOT NULL,
    excerpt             TEXT,
    content             TEXT NOT NULL,
    meta_title          VARCHAR(300),
    meta_description    VARCHAR(500),
    keywords            VARCHAR(500),           -- comma-separated
    featured_image      VARCHAR(500),           -- путь или URL
    featured_image_alt  VARCHAR(300),
    category            VARCHAR(100),
    tags                VARCHAR(500),           -- comma-separated
    author_name         VARCHAR(200),
    author_email        VARCHAR(200),
    author_bio          TEXT,
    status              VARCHAR(20) DEFAULT 'draft',
                        -- ENUM: draft | published | archived
    published_at        TIMESTAMP,
    view_count          INTEGER DEFAULT 0,
    like_count          INTEGER DEFAULT 0,
    share_count         INTEGER DEFAULT 0,
    reading_time        INTEGER,                -- минут
    word_count          INTEGER,
    is_featured         BOOLEAN DEFAULT FALSE,
    allow_comments      BOOLEAN DEFAULT TRUE,
    is_seo_optimized    BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMP DEFAULT NOW(),
    updated_at          TIMESTAMP DEFAULT NOW()
);
```

#### `media_files` (NEW — требует реализации)

```sql
CREATE TABLE media_files (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    filename        VARCHAR(255) NOT NULL,
    original_name   VARCHAR(255) NOT NULL,
    file_path       VARCHAR(500) NOT NULL,
    file_url        VARCHAR(500) NOT NULL,
    file_size       INTEGER NOT NULL,           -- байт
    mime_type       VARCHAR(100) NOT NULL,
    width           INTEGER,                    -- для изображений
    height          INTEGER,                    -- для изображений
    alt_text        VARCHAR(300),
    uploaded_by     INTEGER REFERENCES admin_users(id),
    created_at      TIMESTAMP DEFAULT NOW()
);
```

### 6.2 Связи

```
audits (1) ──── (N) audit_results
audits (1) ──── (N) pdf_reports
admin_users (1) ──── (N) audit_configurations  [created_by]
admin_users (1) ──── (N) admin_users           [created_by]
admin_users (1) ──── (N) media_files           [uploaded_by]
```

### 6.3 Миграции

Используется **Alembic**. Команды:
```bash
cd backend
alembic init alembic           # Инициализация (выполнено)
alembic revision --autogenerate -m "description"
alembic upgrade head
alembic downgrade -1
```

---

## 7. Полная спецификация Admin Panel (CMS)

### 7.1 Аутентификация и роли

#### Роли и права

| Право | super_admin | admin | analyst |
|-------|-------------|-------|---------|
| Управление аудитами | ✅ | ✅ | ✅ (только чтение) |
| Управление обращениями | ✅ | ✅ | ✅ (только чтение) |
| Просмотр аналитики | ✅ | ✅ | ✅ |
| Экспорт данных | ✅ | ✅ | ❌ |
| Управление блогом | ✅ | ✅ | ❌ |
| Медиабиблиотека | ✅ | ✅ | ❌ |
| Управление пользователями | ✅ | ❌ | ❌ |
| Системные настройки | ✅ | ❌ | ❌ |

#### Защита маршрутов (Frontend)

```typescript
// ProtectedRoute компонент
function ProtectedRoute({ children, requiredPermission }) {
  const { authToken, adminUser } = useStore();
  if (!authToken) return <Navigate to="/admin/login" />;
  if (requiredPermission && !adminUser[requiredPermission]) {
    return <Navigate to="/admin/dashboard" />;
  }
  return children;
}
```

#### JWT Flow

1. `POST /api/admin/login` → получение `access_token` + `refresh_token`
2. Токены хранятся в `sessionStorage` (безопасность)
3. Все запросы: заголовок `Authorization: Bearer <access_token>`
4. При 401: попытка обновить через refresh token
5. Выход: очистка sessionStorage

#### Блокировка аккаунта

- После 5 неудачных попыток входа — аккаунт блокируется на 30 минут
- Поле `locked_until` в `admin_users`

### 7.2 Dashboard — главная страница

#### Виджеты статистики (карточки)

| Метрика | Данные |
|---------|--------|
| Всего аудитов | Общее число + динамика за месяц (%) |
| Аудитов за месяц | Текущий месяц + сравнение с прошлым |
| Всего обращений | Общее + новые за месяц |
| Средний балл аудита | Mean maturity_score по завершённым |
| Конверсия | Отношение контактов к аудитам |
| Статьи блога | Опубликовано / Черновики |

#### Графики

1. **Тренды за 12 месяцев** — количество аудитов и обращений (line chart, Recharts)
2. **Распределение по отраслям** — топ-5 отраслей (pie chart)
3. **Воронка конверсии** — аудиты → завершённые → контакты → конверсия
4. **Последние активности** — лента последних событий (аудиты, обращения)

#### Быстрые действия

- «Посмотреть новые обращения» → `/admin/contacts?status=new`
- «Создать статью» → `/admin/blog/new`
- «Скачать отчёт» → `/admin/analytics`

### 7.3 Управление аудитами

#### Список аудитов (`/admin/audits`)

**Фильтры:**
- Статус: all | pending | processing | completed | failed
- Отрасль (dropdown)
- Диапазон дат (date picker)
- Поиск по company_name, contact_email

**Таблица:**

| Колонка | Данные |
|---------|--------|
| ID | #id |
| Компания | company_name |
| Отрасль | industry |
| Размер | company_size |
| Статус | badge (pending/processing/completed/failed) |
| Балл | maturity_score (если completed) |
| Дата | created_at |
| Действия | Просмотр, Скачать PDF, Удалить |

**Пагинация:** 20 записей/страница, номера страниц.

#### Детали аудита (`/admin/audits/:id`)

Разделы:
1. **Информация о компании** — все поля из формы аудита
2. **Статус обработки** — текущий статус, временные метки
3. **Результаты анализа** (если completed):
   - Gauge chart: Индекс зрелости
   - Progress bar: Потенциал автоматизации
   - Финансовые показатели: Экономия, Инвестиции, Срок окупаемости
   - Списки: Сильные стороны, Слабые стороны, Возможности
   - Приоритетные зоны автоматизации
   - Рекомендации
4. **PDF-отчёты** — список сгенерированных, кнопки скачать
5. **Действия:** Регенерировать анализ, Отправить email клиенту, Удалить

### 7.4 Управление обращениями (CRM)

#### Список обращений (`/admin/contacts`)

**Фильтры:**
- Статус: new | contacted | qualified | converted | closed
- Приоритет: low | medium | high | urgent
- Тип: consultation | support | partnership | other
- Поиск по name, email, company

**Таблица:**

| Колонка | Данные |
|---------|--------|
| Имя | name |
| Email | email |
| Компания | company |
| Тип | inquiry_type badge |
| Приоритет | priority badge (цветовое кодирование) |
| Статус | status badge |
| Дата | created_at |
| Действия | Просмотр, Изменить статус, Удалить |

#### Детали обращения (`/admin/contacts/:id`)

Разделы:
1. **Контактная информация** — все поля
2. **Тело обращения** — subject, message
3. **Метаданные** — source, utm_*, created_at, contacted_at
4. **CRM-управление:**
   - Изменение статуса (dropdown)
   - Изменение приоритета
   - Назначение ответственного (assigned_to)
   - Пометить как спам
5. **История взаимодействий** (будущее расширение — timeline)
6. **Быстрые действия:** Отправить email, Пометить как контактировавшего

### 7.5 CMS — Блог и контент

#### Список статей (`/admin/blog`)

**Фильтры:** Статус (all | draft | published | archived), Категория

**Таблица:**

| Колонка | Данные |
|---------|--------|
| Изображение | featured_image thumbnail |
| Заголовок | title + slug |
| Категория | category badge |
| Статус | draft/published/archived badge |
| Просмотры | view_count |
| Дата | published_at или created_at |
| Действия | Редактировать, Предпросмотр, Дублировать, Удалить |

**Быстрые действия в строке:**
- Переключение статуса (draft ↔ published)
- Пометить/снять как избранную

#### Редактор статьи (`/admin/blog/new`, `/admin/blog/:id/edit`)

**Макет:**

```
┌─────────────────────────────┬─────────────────────┐
│  РЕДАКТОР (левая колонка)   │  НАСТРОЙКИ (правая) │
│                             │                      │
│  [Заголовок]                │  Статус              │
│                             │  ○ Черновик          │
│  [Короткое описание]        │  ● Опубликован       │
│                             │  ○ Архив             │
│  ┌─────────────────────┐    │                      │
│  │  Rich Text Editor   │    │  [Дата публикации]   │
│  │  (WYSIWYG или MD)   │    │                      │
│  │                     │    │  Категория           │
│  └─────────────────────┘    │  [dropdown]          │
│                             │                      │
│  SEO                        │  Теги                │
│  [Meta Title]               │  [tag input]         │
│  [Meta Description]         │                      │
│  [Keywords]                 │  Автор               │
│                             │  [Author Name]       │
│                             │  [Author Bio]        │
│                             │                      │
│                             │  Обложка             │
│                             │  [Upload / URL]      │
│                             │  [Alt text]          │
│                             │                      │
│                             │  Настройки           │
│                             │  ☑ Избранная         │
│                             │  ☑ Разрешить коммент.│
│                             │  ☑ SEO оптимизирована│
└─────────────────────────────┴─────────────────────┘
│  [Сохранить черновик]  [Предпросмотр]  [Опубликовать] │
└───────────────────────────────────────────────────────┘
```

**Rich Text Editor:** Использовать `@uiw/react-md-editor` или `TipTap` (рекомендуется TipTap с расширениями: Bold, Italic, Heading, Link, Image, Code, CodeBlock, Table, BulletList, OrderedList).

**Auto-slug:** При вводе заголовка автоматически генерируется slug (транслитерация + lowercase + hyphens).

**Авто-расчёт:** `reading_time` и `word_count` рассчитываются при сохранении.

**Предпросмотр:** Открывает публичную страницу статьи в новой вкладке (или side-by-side panel).

#### Управление категориями (будущее расширение)

Отдельная таблица `blog_categories` (id, name, slug, description, color).

### 7.6 Управление пользователями

Доступно только для ролей: `super_admin`.

#### Список пользователей (`/admin/users`)

**Таблица:**

| Колонка | Данные |
|---------|--------|
| Имя | first_name + last_name |
| Логин | username |
| Email | email |
| Роль | role badge |
| Последний вход | last_login |
| Статус | is_active toggle |
| Действия | Редактировать, Сбросить пароль, Удалить |

#### Создание/редактирование пользователя

Поля:
- username (уникальный)
- email (уникальный)
- first_name, last_name
- role (super_admin | admin | analyst)
- Права (чекбоксы): can_manage_audits, can_manage_users, can_view_analytics, can_export_data, can_manage_content
- is_active (toggle)

При создании: генерируется временный пароль, отправляется на email пользователя.

**Сброс пароля:** Генерируется `password_reset_token`, отправляется письмо со ссылкой.

### 7.7 Аналитика и отчёты

#### Панель аналитики (`/admin/analytics`)

**Фильтры:** Период (7 дней, 30 дней, 90 дней, 12 месяцев, custom)

**Разделы:**

1. **Обзорные метрики** (KPI-карточки)
   - Всего аудитов за период
   - Средний балл зрелости
   - Средний ROI projection
   - Конверсия audit → contact

2. **Аудиты — тренд** (line chart: submitted vs completed)

3. **Распределение по отраслям** (bar chart)

4. **Распределение по размеру компаний** (pie chart)

5. **Средний балл по отраслям** (horizontal bar chart)

6. **Обращения — воронка** (funnel: new → contacted → qualified → converted)

7. **Статистика блога**
   - Топ-10 статей по просмотрам
   - Динамика просмотров (line chart)

8. **Экспорт данных**
   - Аудиты → CSV
   - Обращения → CSV
   - Аналитический отчёт → PDF

### 7.8 Настройки системы

Доступно только для: `super_admin`.

#### Конфигурация AI (`/admin/settings/ai`)

| Параметр | Тип | По умолчанию |
|----------|-----|--------------|
| Модель OpenAI | select | gpt-4 |
| Temperature | slider 0-1 | 0.7 |
| Max Tokens | number | 2000 |
| Вес: Автоматизация процессов | slider | 0.25 |
| Вес: Интеграция данных | slider | 0.20 |
| Вес: Принятие решений | slider | 0.20 |
| Вес: Клиентское взаимодействие | slider | 0.15 |
| Вес: Отчётность и аналитика | slider | 0.20 |
| Включить executive summary | toggle | true |
| Включить детальный анализ | toggle | true |
| Включить ROI-проекции | toggle | true |
| Включить дорожную карту | toggle | true |

#### Настройки Email (`/admin/settings/email`)

| Параметр | Тип |
|----------|-----|
| SMTP Server | text |
| SMTP Port | number |
| SMTP Username | text |
| SMTP Password | password |
| From Email | email |
| From Name | text |
| [Тест SMTP] | button → отправляет тестовое письмо |

#### Общие настройки (`/admin/settings/general`)

| Параметр | Описание |
|----------|----------|
| Название сайта | Заголовок в email и PDF |
| URL сайта | Для ссылок в письмах |
| Поддерживаемые языки | toggle EN / RU |
| Rate limit (req/min) | Ограничение запросов |
| Debug режим | toggle |

### 7.9 Медиабиблиотека

#### Список файлов (`/admin/media`)

**Вид:** Grid (2, 3, 4 колонки) + List переключатель.

**Загрузка:**
- Drag & Drop зона
- Кнопка «Загрузить файл»
- Поддерживаемые форматы: JPEG, PNG, WebP, GIF, SVG (макс. 10MB)

**Карточка файла:**
- Миниатюра изображения
- Имя файла
- Размер файла
- Дата загрузки
- Кнопки: Копировать URL, Редактировать Alt текст, Удалить

**API Upload:**
```
POST /api/admin/media/upload
Content-Type: multipart/form-data
Body: file, alt_text?
Response: { id, file_url, filename, file_size, mime_type, width, height }
```

**Интеграция с редактором блога:** при вставке изображения открывается модал выбора из медиабиблиотеки.

### 7.10 Admin API — полная спецификация эндпоинтов

Все эндпоинты требуют: `Authorization: Bearer <jwt_token>`

#### Аутентификация

```
POST   /api/admin/login
       Body: { username, password }
       Response: { access_token, token_type, expires_in, user_info }

POST   /api/admin/refresh
       Body: { refresh_token }
       Response: { access_token, expires_in }

POST   /api/admin/logout
       Response: { message: "logged out" }

GET    /api/admin/me
       Response: AdminUserResponse

POST   /api/admin/change-password
       Body: { current_password, new_password }
       Response: { message }
```

#### Dashboard

```
GET    /api/admin/dashboard/stats
       Response: {
         total_audits, audits_this_month, audits_change_pct,
         total_contacts, contacts_this_month, contacts_change_pct,
         total_blog_posts, published_posts, draft_posts,
         average_audit_score, conversion_rate,
         recent_activities: [ { type, description, created_at } ]
       }
```

#### Управление аудитами

```
GET    /api/admin/audits
       Query: skip?, limit?, status?, industry?, date_from?, date_to?, search?
       Response: { items: AuditManagementResponse[], total, page, pages }

GET    /api/admin/audits/{audit_id}
       Response: AuditDetailResponse (с результатами и PDF)

DELETE /api/admin/audits/{audit_id}
       Response: { message }

POST   /api/admin/audits/{audit_id}/reprocess
       Response: { message, status }

POST   /api/admin/audits/{audit_id}/send-email
       Body: { email? }  -- если пустой, отправить на contact_email
       Response: { message }
```

#### Управление обращениями

```
GET    /api/admin/contacts
       Query: skip?, limit?, status?, priority?, inquiry_type?, search?
       Response: { items: ContactInquiryResponse[], total, page, pages }

GET    /api/admin/contacts/{inquiry_id}
       Response: ContactInquiryResponse

PATCH  /api/admin/contacts/{inquiry_id}
       Body: { status?, priority?, assigned_to?, is_spam? }
       Response: ContactInquiryResponse

DELETE /api/admin/contacts/{inquiry_id}
       Response: { message }
```

#### CMS — Блог

```
GET    /api/admin/blog
       Query: skip?, limit?, status?, category?, search?
       Response: { items: BlogPostResponse[], total, page, pages }

GET    /api/admin/blog/{post_id}
       Response: BlogPostResponse

POST   /api/admin/blog
       Body: BlogPostCreateRequest {
         title, slug?, excerpt, content,
         meta_title?, meta_description?, keywords?,
         featured_image?, featured_image_alt?,
         category?, tags?,
         author_name?, author_email?, author_bio?,
         status (draft|published|archived),
         published_at?,
         is_featured?, allow_comments?, is_seo_optimized?
       }
       Response: BlogPostResponse

PUT    /api/admin/blog/{post_id}
       Body: BlogPostUpdateRequest (все поля опциональные)
       Response: BlogPostResponse

DELETE /api/admin/blog/{post_id}
       Response: { message }

POST   /api/admin/blog/{post_id}/duplicate
       Response: BlogPostResponse (новый пост со статусом draft)

PATCH  /api/admin/blog/{post_id}/publish
       Response: BlogPostResponse

PATCH  /api/admin/blog/{post_id}/unpublish
       Response: BlogPostResponse
```

#### Медиабиблиотека

```
GET    /api/admin/media
       Query: skip?, limit?, mime_type?
       Response: { items: MediaFileResponse[], total }

POST   /api/admin/media/upload
       Content-Type: multipart/form-data
       Body: file, alt_text?
       Response: MediaFileResponse

PATCH  /api/admin/media/{file_id}
       Body: { alt_text }
       Response: MediaFileResponse

DELETE /api/admin/media/{file_id}
       Response: { message }
```

#### Пользователи (только super_admin)

```
GET    /api/admin/users
       Response: { items: AdminUserResponse[], total }

GET    /api/admin/users/{user_id}
       Response: AdminUserResponse

POST   /api/admin/users
       Body: AdminUserCreateRequest {
         username, email, first_name, last_name, role,
         permissions: { can_manage_audits, ... }
       }
       Response: AdminUserResponse

PUT    /api/admin/users/{user_id}
       Body: AdminUserUpdateRequest
       Response: AdminUserResponse

DELETE /api/admin/users/{user_id}
       Response: { message }

POST   /api/admin/users/{user_id}/reset-password
       Response: { message: "Reset email sent" }

PATCH  /api/admin/users/{user_id}/toggle-active
       Response: { is_active }
```

#### Аналитика

```
GET    /api/admin/analytics/summary
       Query: period? (7d|30d|90d|365d), date_from?, date_to?
       Response: AnalyticsSummaryResponse

GET    /api/admin/analytics/trends
       Query: period?, metric? (audits|contacts|blog)
       Response: { labels[], datasets[] }

GET    /api/admin/analytics/industries
       Response: { industry, count, avg_score }[]

GET    /api/admin/analytics/funnel
       Response: { stage, count, conversion_rate }[]
```

#### Экспорт

```
GET    /api/admin/export/audits
       Query: status?, date_from?, date_to?
       Response: CSV file (Content-Disposition: attachment)

GET    /api/admin/export/contacts
       Query: status?, date_from?, date_to?
       Response: CSV file

GET    /api/admin/export/analytics
       Query: period?
       Response: PDF file
```

#### Конфигурация

```
GET    /api/admin/configuration
       Response: AuditConfigurationResponse

PATCH  /api/admin/configuration
       Body: AuditConfigurationRequest
       Response: AuditConfigurationResponse

GET    /api/admin/settings/email
       Response: EmailSettingsResponse (без пароля)

PATCH  /api/admin/settings/email
       Body: { smtp_server, smtp_port, smtp_username, smtp_password?, from_email, from_name }
       Response: { message }

POST   /api/admin/settings/email/test
       Body: { to_email }
       Response: { message }
```

---

## 8. Безопасность

### Аутентификация

| Механизм | Детали |
|----------|--------|
| JWT | HS256, секрет из `JWT_SECRET_KEY` env |
| Access Token | 30 минут (настраивается) |
| Refresh Token | 7 дней (настраивается) |
| Хранение (frontend) | `sessionStorage` (не localStorage) |
| Хэширование паролей | bcrypt, rounds=12 |
| Блокировка | 5 неудач → блок на 30 минут |

### Авторизация

- RBAC на основе полей `can_*` в `admin_users`
- FastAPI `Depends(get_current_user)` на всех защищённых эндпоинтах
- Проверка разрешений внутри хендлеров для тонкого контроля

### Защита от атак

| Угроза | Защита |
|--------|--------|
| Rate Limiting | RateLimitMiddleware (60/мин, 100/час на IP) |
| CORS | Разрешённые origins из `CORS_ORIGINS` env |
| SQL Injection | SQLAlchemy ORM (параметризованные запросы) |
| XSS | Jinja2 auto-escape в email, валидация входных данных |
| CSRF | Не применимо (SPA + JWT, нет cookie-auth) |
| Trusted Hosts | TrustedHostMiddleware в production |
| Sensitive Data | Пароли только в hashed виде, SMTP password не возвращается в API |

### Переменные окружения

Никакие секреты не хранятся в коде. Все чувствительные данные — в `.env` файлах, которые исключены из git (`.gitignore`).

---

## 9. Email-коммуникации

### Шаблоны

| Шаблон | Когда | Получатель |
|--------|-------|-----------|
| `contact_confirmation.html` | При отправке формы контакта | Пользователь |
| `contact_notification.html` | При новом обращении | Администратор |
| `audit_completed.html` | Аудит завершён (+ ссылка на PDF) | Контактное лицо аудита |
| `welcome.html` | (будущее) Регистрация | Пользователь |
| `admin_invitation.html` | Приглашение нового admin-пользователя | Новый admin |
| `password_reset.html` | Сброс пароля | Admin-пользователь |

### Структура шаблона (Jinja2)

```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <table> <!-- email-safe layout -->
    <tr>
      <td><!-- Header: Logo XTeam.Pro --></td>
    </tr>
    <tr>
      <td><!-- Content block --></td>
    </tr>
    <tr>
      <td><!-- Footer: contacts, unsubscribe --></td>
    </tr>
  </table>
</body>
</html>
```

### SMTP конфигурация

- Сервер: `SMTP_SERVER` (default: smtp.gmail.com)
- Порт: `SMTP_PORT` (default: 587, STARTTLS)
- Auth: `SMTP_USERNAME` + `SMTP_PASSWORD`
- Отправитель: `FROM_EMAIL` / `FROM_NAME`

---

## 10. AI-интеграция

### OpenAI GPT-4

**Системный промпт (аудит):**
```
You are an expert business automation consultant. Analyze the provided
business information and return a detailed assessment in JSON format with:
- maturity_score (0-100): overall automation maturity
- automation_potential (0-100): potential for improvement
- roi_projection (float): expected ROI percentage
- timeline_estimate: implementation timeline
- strengths/weaknesses/opportunities (string arrays)
- recommendations (prioritized list)
- process_scores (dict of process areas)
- cost_analysis: { estimated_savings, implementation_cost, payback_period }
```

**Mock режим** (когда OPENAI_API_KEY не настроен):
- Возвращает детерминированный фиктивный анализ
- Позволяет тестировать весь flow без API ключа

**Конфигурируемые параметры:**
- Модель (gpt-4, gpt-4-turbo, gpt-3.5-turbo)
- Temperature (0.0 — 1.0)
- Max tokens
- Веса для различных бизнес-процессов

---

## 11. PDF-генерация

### Структура отчёта

1. **Обложка**
   - Логотип XTeam.Pro
   - Название: «Отчёт об оценке готовности к автоматизации»
   - Название компании, дата
   - Конфиденциально

2. **Резюме для руководства** (1 страница)
   - Ключевые показатели в таблице
   - Краткие выводы (3-5 пунктов)

3. **Индекс зрелости автоматизации**
   - Gauge chart (0-100)
   - Интерпретация уровня

4. **Анализ бизнес-процессов**
   - Радарная диаграмма по направлениям
   - Таблица оценок по каждому процессу

5. **ROI-проекция**
   - Bar chart (3 года)
   - Таблица: инвестиции, экономия по годам, срок окупаемости

6. **Приоритеты автоматизации**
   - Пронумерованный список с описаниями

7. **Рекомендации**
   - По уровням: Quick wins, Среднесрочные, Долгосрочные

8. **Дорожная карта внедрения**
   - Timeline с этапами

9. **Финансовый расчёт**
   - Детальная таблица затрат и экономии

10. **Контакты XTeam.Pro**

### Хранение

- Директория: `backend/reports/`
- Имя файла: `audit_report_{audit_id}_{timestamp}.pdf`
- URL доступа: `/reports/{filename}`
- Запись в БД: таблица `pdf_reports`

---

## 12. Нефункциональные требования

### Производительность

| Метрика | Цель |
|---------|------|
| Time to First Byte | < 200ms (API) |
| Время отклика API (p95) | < 500ms |
| Time to Interactive (SPA) | < 3s |
| Размер бандла (initial) | < 200KB gzip |
| AI обработка аудита | < 60 секунд |
| PDF генерация | < 30 секунд |

### Масштабируемость

- Горизонтальное масштабирование backend: uvicorn workers или несколько Pod (K8s)
- Database connection pooling: SQLAlchemy pool_size=5, max_overflow=10
- Фоновые задачи: asyncio.create_task (текущий подход) → возможна миграция на Celery + Redis при росте нагрузки

### Доступность

- Целевой uptime: 99.5%
- Graceful shutdown: обработка незавершённых запросов
- Healthcheck: `GET /health` для мониторинга

### Совместимость браузеров

- Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- Мобильные: iOS Safari 14+, Chrome Mobile 90+

### Accessibility (A11y)

- Базовый уровень WCAG 2.1 AA
- Все интерактивные элементы — keyboard navigable
- ARIA-атрибуты на Radix UI компонентах (встроены)
- Контраст цветов: не менее 4.5:1

---

## 13. Переменные окружения

### Frontend (`.env`)

```env
# API
VITE_API_URL=http://localhost:8000

# OpenAI (только для client-side, не рекомендуется в prod)
VITE_OPENAI_API_KEY=sk-...
VITE_OPENAI_MODEL=gpt-4

# Аналитика
VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Другое
VITE_CALENDLY_URL=https://calendly.com/xteam/...
VITE_STORAGE_BUCKET=
VITE_DEV_MODE=false
VITE_DEBUG_MODE=false
```

### Backend (`backend/.env`)

```env
# База данных
DATABASE_URL=sqlite+aiosqlite:///./xteam_pro.db
# Для prod:
# DATABASE_URL=postgresql+asyncpg://user:password@host:5432/xteam_pro

# JWT
JWT_SECRET_KEY=your-very-secret-key-here-min-32-chars
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# OpenAI
OPENAI_API_KEY=sk-...

# Admin по умолчанию
DEFAULT_ADMIN_EMAIL=admin@xteam.pro
DEFAULT_ADMIN_PASSWORD=SecurePassword123!

# SMTP
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your@gmail.com
SMTP_PASSWORD=app-specific-password
FROM_EMAIL=noreply@xteam.pro
FROM_NAME=XTeam.Pro

# Приложение
DEBUG=false
ENVIRONMENT=production
PORT=8000
ALLOWED_HOSTS=xteam.pro,www.xteam.pro
CORS_ORIGINS=https://xteam.pro,https://www.xteam.pro

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=3600
```

---

## 14. Инфраструктура и развёртывание

### Схема развёртывания (Production)

```
                    ┌─────────────┐
                    │   DNS / CDN  │
                    │  (Cloudflare)│
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Nginx/Caddy │
                    │  (Reverse    │
                    │  Proxy +     │
                    │  SSL/TLS)    │
                    └──┬───────┬──┘
                       │       │
            ┌──────────▼──┐  ┌─▼──────────┐
            │  React SPA  │  │  FastAPI    │
            │  (статика   │  │  (uvicorn,  │
            │  на Nginx   │  │  port 8000) │
            │  или CDN)   │  └─────┬───────┘
            └─────────────┘        │
                              ┌────▼────┐
                              │ PostgreSQL│
                              └──────────┘
```

### Dockerfile — Frontend

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

### Dockerfile — Backend

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Переменные для production

- Использовать `ENVIRONMENT=production`
- `DEBUG=false` (скрывает документацию Swagger)
- `ALLOWED_HOSTS` — только реальные домены
- `CORS_ORIGINS` — только домен фронтенда
- PostgreSQL вместо SQLite

---

## 15. CI/CD Pipeline

Файл: `.github/workflows/release-gate.yml`

### Jobs

```yaml
jobs:
  frontend-quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-node@v4 (node 20)
      - npm ci
      - npm run check          # TypeScript type check
      - npm run lint           # ESLint
      - npm run build          # Production build
      - npm run i18n:check     # i18n key sync verification
      - npm run e2e:smoke      # Playwright smoke tests

  backend-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/setup-python@v4 (python 3.11)
      - pip install -r backend/requirements.txt pytest pytest-asyncio
      - pytest backend/tests/
    env:
      JWT_SECRET_KEY: ci-secret-key
      OPENAI_API_KEY: placeholder
      DATABASE_URL: sqlite+aiosqlite:///./test.db

  docker-smoke:
    needs: [frontend-quality, backend-integration]
    steps:
      - docker build -f Dockerfile.frontend .
      - docker build -f Dockerfile.backend .
```

### Требования к прохождению

Все три job должны пройти успешно для merge в `master`.

---

## 16. Известные ограничения и технический долг

### Мёртвые зависимости в package.json

Следующие пакеты установлены, но **не используются** (наследие Node.js-бэкенда):
- `express`, `multer`, `bcryptjs`, `jsonwebtoken`, `@next/font`

**Рекомендация:** удалить из `package.json` в следующем релизе.

### TypeScript Strict Mode

Строгий режим (`strict: true`) **отключён** в `tsconfig.json`. Включение потребует устранения многочисленных ошибок типов по всему проекту.

**Рекомендация:** включить постепенно, по модулям.

### Фоновые задачи

Текущая реализация (`asyncio.create_task`) не поддерживает:
- Перезапуск при падении (no retry)
- Очередь задач (нет приоритетов)
- Мониторинг зависших задач

**Рекомендация для масштабирования:** мигрировать на Celery + Redis или RQ.

### Хранилище файлов

Загруженные файлы и PDF-отчёты хранятся **локально** на диске (`backend/uploads/`, `backend/reports/`). При горизонтальном масштабировании это создаёт проблемы.

**Рекомендация:** мигрировать на объектное хранилище (S3, DigitalOcean Spaces, MinIO).

### Отсутствие rich-text редактора

Редактор блога сейчас требует реализации. Рекомендуемый подход: **TipTap** (headless, хорошо интегрируется с React и shadcn/ui).

### Документация API

Swagger UI доступен только при `DEBUG=true`. В production — отключён.

**Рекомендация:** настроить статическую документацию (Redocly или экспорт OpenAPI schema).

### Отсутствует система уведомлений в реальном времени

Для получения уведомлений в admin panel (новые обращения, завершённые аудиты) используется polling.

**Рекомендация:** WebSocket или Server-Sent Events через `/api/admin/events`.

---

*Этот документ является живым. Он должен обновляться при каждом значимом изменении архитектуры или функциональности.*
