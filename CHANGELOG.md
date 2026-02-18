# Changelog

Все значимые изменения проекта фиксируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), семантика версий — [SemVer](https://semver.org/).

## [Unreleased] - 2026-02-18

### Added
- Добавлены страницы: `Careers`, `Privacy`, `Terms`, `Cookies`, `NotFound (404)`.
- Добавлены админ-эндпоинты:
  - `DELETE /api/admin/submissions/{submission_id}`
  - `GET /api/admin/export?format=csv`
- Добавлен release-gate workflow: `.github/workflows/release-gate.yml`.
- Добавлены backend интеграционные тесты:
  - `backend/tests/conftest.py`
  - `backend/tests/test_release_readiness.py`

### Changed
- Frontend Docker образ переведен на `node:20-alpine` для соответствия `engines.node=20.x`.
- JWT-стек в backend стандартизирован на `python-jose`.
- Конфигурация админки:
  - внешний контракт сохраняет `ai_model`
  - внутренний ORM маппинг в `openai_model`
  - расширенные настройки сохраняются в `description` (JSON metadata).
- Токен админки во frontend переведен с `localStorage` на `sessionStorage`.
- Навигация `Header`/`Footer` переведена на React Router (`Link`).
- Proxy в `vite.config.ts` обновлен на backend `:8000`.

### Fixed
- Исправлен frontend blocker сборки: `src/pages/Audit.tsx` (`contactInfo` -> `contact` + синхронизация типов/валидации/трансформации).
- Исправлены ошибки авторизации админки:
  - корректное поле `hashed_password` вместо `password_hash`
  - корректная сборка `full_name` из `first_name/last_name`
  - нормализация `sub` в JWT и корректная конверсия `user_id`.
- Исправлены runtime 500 в admin:
  - корректный вызов `AnalyticsService()`
  - фиксы `/dashboard`, `/configuration`, `/export`.
- Исправлен CSV экспорт: телефон берется из `Audit.phone`.
- Исправлена contact форма:
  - `marketing_consent` поддержан без падения ORM
  - корректная работа `contact-submit`.
- Исправлен audit pipeline:
  - унифицирован контракт AI-результата (`automation_opportunities`, `timeline_estimate`, `cost_analysis`)
  - добавлены fallback/default поля для устойчивости
  - устранены ошибки `audit -> failed` при неполном AI ответе.
- Исправлен доступ к данным по ID в audit/contact/admin роутинге (строки/числа).
- Исправлен `backend/main.py` shutdown (`async_engine.dispose()` вместо sync engine).

### Security
- Удален небезопасный JWT secret fallback: `JWT_SECRET_KEY` обязателен.
- Удалены дефолтные/утекающие секреты из compose/frontend env.
- Удален debug endpoint, раскрывавший чувствительные конфиги.
- Усилен CSP в `nginx.conf` (убраны небезопасные директивы).

### Infrastructure
- Backend Docker запускается с `--workers 4` (production образ).
- В `backend/requirements.txt` добавлены:
  - `httpx==0.27.2` (совместимость TestClient/CI)
  - `bcrypt==4.0.1` (совместимость passlib/bcrypt в runtime).
- В `.gitignore` добавлен `backend/test_xteam_pro.db`.

### Internationalization
- Исправлены ключи/дубликаты в локалях `en.json` и `ru.json`.
- В `Blog.tsx` локаль даты переведена с hardcoded `en-US` на `i18n.language`.

### Cleanup
- Удалены неиспользуемые frontend зависимости и мертвый код.
- Снижено количество frontend lint ошибок в измененных файлах (критические устранены).

### Validation
- Подтверждено локально:
  - `npm run check` — OK
  - `npm run build` — OK
  - `docker build -f Dockerfile .` — OK
  - `docker build -f backend/Dockerfile ./backend` — OK
  - `pytest -q backend/tests` (в dockerized Python 3.11 env) — OK
