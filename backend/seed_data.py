#!/usr/bin/env python3
"""
Seed script: populates the XTeam.Pro database with test data.
Inserts: 4 case studies, 5 blog posts, 8 contacts, 5 analytics goals,
3 email templates.

Run from project root:
    python backend/seed_data.py
"""
import asyncio
import json
import sys
import os
from datetime import datetime, timezone, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from database.config import AsyncSessionLocal
from models.case_study import CaseStudy
from models.blog import BlogPost
from models.contact import ContactInquiry, ContactNote, EmailTemplate
from models.analytics import AnalyticsGoal

NOW = datetime.now(timezone.utc)


# ═══════════════════════════════════════════════════════════════════════════════
# CASE STUDIES
# ═══════════════════════════════════════════════════════════════════════════════

CASES = [
    {
        "slug": "aviation-rfq-automation",
        "title_ru": "Авиационная компания — автоматизация коммерческих заявок",
        "title_en": "Aviation Company — RFQ Automation",
        "industry_ru": "Авиация",
        "industry_en": "Aviation",
        "client_company": "Авиационная компания (авиационные комплектующие)",
        "challenge_ru": (
            "Сотни сложных коммерческих запросов (RFQ) в день обрабатывались вручную. "
            "Более 30 менеджеров тратили большую часть рабочего времени на рутину. "
            "Процент ошибок превышал 10%, что приводило к потере клиентов и выручки."
        ),
        "challenge_en": (
            "Hundreds of complex RFQ requests processed manually every day by 30+ managers. "
            "Error rate exceeded 10%, causing revenue and client losses."
        ),
        "solution_ru": (
            "Разработана интеллектуальная система обработки заявок: автоматическое чтение "
            "входящих RFQ, проверка по базе, расчёт стоимости и формирование коммерческого "
            "предложения. Менеджер контролирует финальную сделку."
        ),
        "solution_en": (
            "Intelligent RFQ processing system: automated reading, database lookup, "
            "cost calculation and commercial offer generation. Managers retain control over final deals."
        ),
        "testimonial_ru": (
            "Система автоматизировала рутинные части нашего рабочего процесса, которые "
            "раньше отнимали большую часть времени менеджеров. Теперь они сосредоточены "
            "на сложных сделках и клиентах, а не на вводе данных."
        ),
        "testimonial_en": (
            "The system automated the routine parts of our workflow that used to consume "
            "most of our managers' time. They now focus on complex deals, not data entry."
        ),
        "results": [
            {"metric_ru": "Ускорение обработки заявок", "metric_en": "Request processing speed",
             "value": "3–5x", "improvement_ru": "быстрее чем вручную", "improvement_en": "faster than manual"},
            {"metric_ru": "Снижение ошибок", "metric_en": "Error reduction",
             "value": "<2%", "improvement_ru": "с 10%+ до <2%", "improvement_en": "from 10%+ to <2%"},
            {"metric_ru": "Экономия времени менеджеров", "metric_en": "Manager time saved",
             "value": "60%", "improvement_ru": "рабочего времени", "improvement_en": "working time"},
        ],
        "roi": "6–9 месяцев",
        "time_saved": "60% времени менеджеров",
        "status": "published",
        "is_featured": True,
        "sort_order": 1,
        "published_at": NOW - timedelta(days=30),
    },
    {
        "slug": "corporate-knowledge-base",
        "title_ru": "MLM-компания — корпоративная база знаний с ИИ-консультантом",
        "title_en": "MLM Company — Corporate Knowledge Base with AI Consultant",
        "industry_ru": "MLM / Корпоративное обучение",
        "industry_en": "MLM / L&D",
        "client_company": "Коммерческая кадровая компания",
        "challenge_ru": (
            "Низкая эффективность партнёров из-за сложного ассортимента и тяжёлого онбординга. "
            "Знания уходили вместе с людьми. Партнёры месяцами не выходили на результат."
        ),
        "challenge_en": (
            "Low partner effectiveness due to complex product range and difficult onboarding. "
            "Corporate knowledge left with people. Partners took months to become productive."
        ),
        "solution_ru": (
            "Создана интеллектуальная корпоративная база знаний с внутренним ИИ-консультантом. "
            "Автоматическая диагностика пробелов, персональные траектории обучения, "
            "мгновенные ответы на вопросы по продукту и регламентам."
        ),
        "solution_en": (
            "Built an intelligent corporate knowledge base with an AI consultant. "
            "Automated gap diagnostics, personal learning paths, instant answers on products and policies."
        ),
        "testimonial_ru": (
            "Система управления знаниями изменила то, как наши сотрудники учатся и работают. "
            "Онбординг сократился с 3 месяцев до 3 недель, а партнёры стали увереннее."
        ),
        "testimonial_en": (
            "The knowledge management system changed how our employees learn and work. "
            "Onboarding dropped from 3 months to 3 weeks, partners became more confident."
        ),
        "results": [
            {"metric_ru": "Высвобождение времени команды", "metric_en": "Team time freed",
             "value": "30–50%", "improvement_ru": "меньше рутинных вопросов", "improvement_en": "fewer routine questions"},
            {"metric_ru": "Сокращение онбординга", "metric_en": "Onboarding reduction",
             "value": "3 недели", "improvement_ru": "вместо 3 месяцев", "improvement_en": "vs 3 months before"},
            {"metric_ru": "Рост производительности партнёров", "metric_en": "Partner productivity growth",
             "value": "+25%", "improvement_ru": "в первые 90 дней", "improvement_en": "in first 90 days"},
        ],
        "roi": "8–12 месяцев",
        "time_saved": "30–50% времени команды",
        "status": "published",
        "is_featured": True,
        "sort_order": 2,
        "published_at": NOW - timedelta(days=45),
    },
    {
        "slug": "energy-sector-digitalization",
        "title_ru": "Энергетический сектор (МЭС) — пилотная цифровизация",
        "title_en": "Energy Sector (MES) — Pilot Digitalization",
        "industry_ru": "Энергетика",
        "industry_en": "Energy",
        "client_company": "Компания энергетического сектора (МЭС)",
        "challenge_ru": (
            "Разрозненные процессы: CRM, отчёты и ППР существовали отдельно. "
            "Бумажные отчёты, отсутствие сквозного контроля бригад в поле, потери времени."
        ),
        "challenge_en": (
            "Fragmented processes: CRM, reports and PPR existed separately. "
            "Paper reports, no end-to-end field team control, time losses."
        ),
        "solution_ru": (
            "Запуск пилотных цифровых проектов: CRM под услуги МЭС, автоматизация отчётов, "
            "ППР-система и мобильное приложение для полевых бригад. "
            "Быстрая проверка гипотез за 4–6 недель."
        ),
        "solution_en": (
            "Launched pilot digital projects: MES-specific CRM, report automation, "
            "PPR system and mobile app for field teams. Fast hypothesis testing in 4–6 weeks."
        ),
        "testimonial_ru": (
            "Пилот помог быстро проверить гипотезы и показать команде, как цифровизация "
            "реально работает. Мы увидели результаты уже в первые недели."
        ),
        "testimonial_en": (
            "The pilot helped quickly test hypotheses and show the team how digitalization "
            "actually works. We saw results within the first weeks."
        ),
        "results": [
            {"metric_ru": "Сокращение ручных операций", "metric_en": "Manual operations reduction",
             "value": "20–40%", "improvement_ru": "за счёт автоматизации", "improvement_en": "through automation"},
            {"metric_ru": "Скорость отчётности", "metric_en": "Reporting speed",
             "value": "5x", "improvement_ru": "быстрее формирование отчётов", "improvement_en": "faster report generation"},
            {"metric_ru": "Срок запуска пилота", "metric_en": "Pilot launch time",
             "value": "4–6 нед", "improvement_ru": "от идеи до первых результатов", "improvement_en": "from idea to first results"},
        ],
        "roi": "6–9 месяцев",
        "time_saved": "20–40% ручных операций",
        "status": "published",
        "is_featured": False,
        "sort_order": 3,
        "published_at": NOW - timedelta(days=60),
    },
    {
        "slug": "study-ninja-edtech",
        "title_ru": "StudyNinja — персонализированная платформа доп. образования",
        "title_en": "StudyNinja — Personalized Supplementary Education Platform",
        "industry_ru": "Образование / EdTech",
        "industry_en": "Education / EdTech",
        "client_company": "StudyNinja (XTeam.Pro)",
        "challenge_ru": (
            "Стандартные программы не учитывают психотип и темп ученика. "
            "Низкое удержание в традиционных онлайн-курсах. Репетитор дорог, "
            "а ИИ-тьюторы не адаптируются под конкретного ученика."
        ),
        "challenge_en": (
            "Standard programs don't account for student psychotype and learning pace. "
            "Low retention in traditional online courses. Tutors are expensive, "
            "AI tutors don't adapt to individual students."
        ),
        "solution_ru": (
            "Граф знаний + диагностика психотипа HBDI + мини-уроки под ученика + ИИ-тьютор. "
            "Система строит персональную траекторию обучения и адаптирует контент "
            "под стиль мышления каждого ученика."
        ),
        "solution_en": (
            "Knowledge graph + HBDI psychotype diagnostics + personalized mini-lessons + AI tutor. "
            "The system builds a personal learning trajectory and adapts content "
            "to each student's thinking style."
        ),
        "testimonial_ru": (
            "StudyNinja строит персональную траекторию с учётом психотипа ученика — "
            "это меняет само понятие онлайн-образования."
        ),
        "testimonial_en": (
            "StudyNinja builds a personal trajectory accounting for the student's psychotype — "
            "this changes the very concept of online education."
        ),
        "results": [
            {"metric_ru": "D30 Retention", "metric_en": "D30 Retention",
             "value": "35–40%", "improvement_ru": "удержание vs 8–12% у конкурентов", "improvement_en": "vs 8–12% industry average"},
            {"metric_ru": "Адаптация контента", "metric_en": "Content adaptation",
             "value": "100%", "improvement_ru": "под психотип каждого ученика", "improvement_en": "to each student's psychotype"},
            {"metric_ru": "Поддержка", "metric_en": "Support",
             "value": "ФСИ / Сколково", "improvement_ru": "государственный грант", "improvement_en": "government grant"},
        ],
        "roi": "Грант ФСИ / Сколково",
        "time_saved": "Персонализация траектории",
        "status": "published",
        "is_featured": True,
        "sort_order": 4,
        "published_at": NOW - timedelta(days=20),
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# BLOG POSTS
# ═══════════════════════════════════════════════════════════════════════════════

BLOG_POSTS = [
    {
        "title": "Автоматизация рутины: с чего начать в 2025 году",
        "title_ru": "Автоматизация рутины: с чего начать в 2025 году",
        "title_en": "Routine Automation: Where to Start in 2025",
        "slug": "automation-where-to-start-2025",
        "excerpt_ru": (
            "Большинство компаний теряют тысячи рабочих часов на задачи, которые "
            "можно автоматизировать за несколько недель. Разбираем, как выбрать "
            "первый процесс для автоматизации и не ошибиться."
        ),
        "excerpt_en": (
            "Most companies lose thousands of working hours on tasks that can be "
            "automated in a few weeks. We break down how to choose the first process "
            "for automation."
        ),
        "content_ru": """
## Почему компании откладывают автоматизацию

Автоматизация часто воспринимается как дорогостоящий и долгосрочный проект.
На практике — большинство «болевых точек» решаются за 4–8 недель при правильном выборе приоритетов.

## Как выбрать первый процесс

**Правило трёх P:**
- **Pain** — процесс вызывает регулярную боль: ошибки, задержки, перегрузку людей
- **Predictable** — процесс повторяется по предсказуемой логике
- **Provable** — результат автоматизации легко измерить

## Типичные кандидаты на автоматизацию

1. **Обработка входящих заявок** — парсинг email, CRM-запись, первичная квалификация
2. **Формирование отчётов** — агрегация данных из нескольких источников
3. **Маршрутизация задач** — распределение тикетов, заявок, документов
4. **Согласование документов** — уведомления, статусы, архивирование

## Пилот за 4–6 недель

Мы рекомендуем начинать с пилота: выбрать один процесс, автоматизировать его,
измерить результат. Это снижает риски и даёт команде уверенность в технологии.

**Хотите узнать, что можно автоматизировать у вас?** Запишитесь на 30-минутный звонок —
мы разберём ваши процессы и покажем потенциал.
""",
        "content_en": """
## Why Companies Delay Automation

Automation is often perceived as an expensive and long-term project.
In practice, most "pain points" are solved in 4–8 weeks with proper prioritization.

## How to Choose the First Process

**The Three P Rule:**
- **Pain** — the process causes regular pain: errors, delays, people overload
- **Predictable** — the process repeats with predictable logic
- **Provable** — the result of automation is easy to measure

## Typical Automation Candidates

1. **Incoming request processing** — email parsing, CRM entry, initial qualification
2. **Report generation** — data aggregation from multiple sources
3. **Task routing** — distributing tickets, requests, documents
4. **Document approval** — notifications, statuses, archiving

## Pilot in 4–6 Weeks

We recommend starting with a pilot: choose one process, automate it, measure the result.
This reduces risks and gives the team confidence in the technology.
""",
        "excerpt": "Большинство компаний теряют тысячи рабочих часов на задачи, которые можно автоматизировать.",
        "content": "Большинство компаний теряют тысячи рабочих часов на задачи, которые можно автоматизировать.",
        "category": "Automation",
        "tags": "автоматизация,RPA,бизнес-процессы,пилот",
        "author_name": "Команда XTeam.Pro",
        "author_email": "team@xteam.pro",
        "status": "published",
        "is_featured": True,
        "reading_time": 5,
        "word_count": 400,
        "published_at": NOW - timedelta(days=7),
    },
    {
        "title": "ИИ в B2B-продажах: как не потерять клиента в эпоху автоматизации",
        "title_ru": "ИИ в B2B-продажах: как не потерять клиента в эпоху автоматизации",
        "title_en": "AI in B2B Sales: How Not to Lose a Client in the Age of Automation",
        "slug": "ai-in-b2b-sales-2025",
        "excerpt_ru": (
            "ИИ-инструменты ускоряют обработку лидов, но без правильной настройки "
            "превращаются в спам-машину. Рассказываем, как внедрить AI в B2B-продажи "
            "так, чтобы клиент этого не заметил — в хорошем смысле."
        ),
        "excerpt_en": (
            "AI tools speed up lead processing, but without proper setup they become spam machines. "
            "We explain how to implement AI in B2B sales so the client doesn't notice — in a good way."
        ),
        "content_ru": """
## Проблема «роботизированного» общения

Когда компания внедряет ИИ в продажи без подготовки, клиенты это чувствуют.
Шаблонные письма, одинаковые ответы, отсутствие персонализации — всё это снижает конверсию.

## Что работает в B2B

**Сегментация по сигналам, а не по демографии.**
ИИ анализирует поведение: какие страницы просматривал клиент,
что скачивал, как реагировал на предыдущие касания.

**Автоматизация рутины, человек — для сложного.**
Квалификация лидов, напоминания, первичные ответы — ИИ.
Финальные переговоры, возражения, сложные сделки — менеджер.

**Тестирование гипотез быстро.**
A/B тесты на разных сегментах, быстрая итерация.

## Кейс: рост конверсии на 40%

Один из наших клиентов автоматизировал квалификацию лидов и первичные
ответы на входящие заявки. Результат: время ответа сократилось с 4 часов
до 7 минут, конверсия в встречу выросла на 40%.

## Как начать

1. Выберите один этап воронки
2. Автоматизируйте только рутинные действия
3. Измерьте результат за 30 дней
4. Масштабируйте то, что работает
""",
        "content_en": """
## The "Robotic Communication" Problem

When a company implements AI in sales without preparation, clients feel it.
Template emails, identical responses, lack of personalization — all reduce conversion.

## What Works in B2B

**Segmentation by signals, not demographics.**
AI analyzes behavior: which pages the client viewed, what they downloaded, how they responded to previous touchpoints.

**Automate routine, human for complex.**
Lead qualification, reminders, initial responses — AI.
Final negotiations, objections, complex deals — manager.

## Case: 40% Conversion Growth

One of our clients automated lead qualification and initial responses.
Result: response time reduced from 4 hours to 7 minutes, conversion to meeting grew 40%.
""",
        "excerpt": "ИИ-инструменты ускоряют обработку лидов, но без правильной настройки превращаются в спам-машину.",
        "content": "ИИ-инструменты ускоряют обработку лидов.",
        "category": "AI",
        "tags": "ИИ,B2B,продажи,лиды,CRM",
        "author_name": "Команда XTeam.Pro",
        "author_email": "team@xteam.pro",
        "status": "published",
        "is_featured": False,
        "reading_time": 6,
        "word_count": 480,
        "published_at": NOW - timedelta(days=14),
    },
    {
        "title": "ROI автоматизации: как считать до внедрения",
        "title_ru": "ROI автоматизации: как считать до внедрения",
        "title_en": "Automation ROI: How to Calculate Before Implementation",
        "slug": "automation-roi-calculation",
        "excerpt_ru": (
            "Многие компании не могут обосновать бюджет на автоматизацию перед бордом. "
            "Даём простую модель расчёта ROI, которую можно собрать за час."
        ),
        "excerpt_en": (
            "Many companies can't justify the automation budget to the board. "
            "We provide a simple ROI calculation model that can be assembled in an hour."
        ),
        "content_ru": """
## Формула базового ROI автоматизации

```
ROI = (Годовая экономия - Стоимость внедрения) / Стоимость внедрения × 100%
```

## Как посчитать «годовую экономию»

**Шаг 1: Найдите часы.**
Спросите у людей, сколько времени они тратят на конкретный процесс в неделю.
Умножьте на 52, умножьте на стоимость часа.

**Шаг 2: Добавьте стоимость ошибок.**
Ошибки в ручных процессах стоят денег. Посчитайте средний ущерб от ошибки ×
количество ошибок в месяц × 12.

**Шаг 3: Добавьте стоимость скорости.**
Если задержки стоят денег (потери клиентов, штрафы), включите их.

## Пример расчёта

- 3 менеджера × 2 ч/день × 250 рабочих дней × 1500 ₽/ч = **2 250 000 ₽/год**
- Ошибки: 5/мес × 30 000 ₽ × 12 = **1 800 000 ₽/год**
- Итого экономия: **4 050 000 ₽/год**
- Стоимость внедрения: **1 500 000 ₽**
- ROI за год: **170%**

## Срок окупаемости

При такой модели срок окупаемости — около 4.5 месяцев.
Большинство наших проектов окупаются за 6–12 месяцев.
""",
        "content_en": """
## Basic Automation ROI Formula

```
ROI = (Annual Savings - Implementation Cost) / Implementation Cost × 100%
```

## How to Calculate "Annual Savings"

**Step 1: Find the hours.**
Ask people how much time they spend on a specific process per week.
Multiply by 52, multiply by the hourly cost.

**Step 2: Add the cost of errors.**
Errors in manual processes cost money. Calculate average error cost × errors per month × 12.

## Example Calculation

- 3 managers × 2h/day × 250 working days × $20/h = **$30,000/year**
- Errors: 5/month × $400 × 12 = **$24,000/year**
- Total savings: **$54,000/year**
- Implementation cost: **$20,000**
- Year 1 ROI: **170%**
""",
        "excerpt": "Как обосновать бюджет на автоматизацию перед бордом — простая модель расчёта ROI.",
        "content": "Как обосновать бюджет на автоматизацию.",
        "category": "Automation",
        "tags": "ROI,автоматизация,бизнес-кейс,экономика",
        "author_name": "Команда XTeam.Pro",
        "author_email": "team@xteam.pro",
        "status": "published",
        "is_featured": False,
        "reading_time": 4,
        "word_count": 350,
        "published_at": NOW - timedelta(days=21),
    },
    {
        "title": "Корпоративные базы знаний: от Excel до ИИ-ассистента",
        "title_ru": "Корпоративные базы знаний: от Excel до ИИ-ассистента",
        "title_en": "Corporate Knowledge Bases: From Excel to AI Assistant",
        "slug": "corporate-knowledge-base-ai",
        "excerpt_ru": (
            "Большинство корпоративных баз знаний — это кладбища документов. "
            "Рассказываем, как превратить разрозненные материалы в умного "
            "ИИ-ассистента, который реально помогает сотрудникам."
        ),
        "excerpt_en": (
            "Most corporate knowledge bases are document cemeteries. "
            "We explain how to turn disparate materials into a smart AI assistant "
            "that actually helps employees."
        ),
        "content_ru": """
## Почему корпоративные базы знаний не работают

Три главные причины провала корпоративных вики:
1. **Устаревшие данные** — никто не обновляет
2. **Плохой поиск** — нужно знать, что искать
3. **Нет контекста** — документ есть, но непонятно, как применять

## Что такое ИИ-ассистент на базе знаний

Вместо поиска по ключевым словам — диалог на естественном языке.
Сотрудник спрашивает: «Какова процедура возврата от клиента?» —
и получает точный ответ с ссылкой на нужный раздел.

## Архитектура решения

1. **Сбор знаний** — загрузка документов, регламентов, FAQ
2. **Векторизация** — преобразование текстов в векторные представления
3. **RAG-поиск** — поиск релевантных фрагментов по запросу
4. **LLM-ответ** — генерация чёткого ответа с источниками

## Результаты внедрения

Из нашего опыта:
- **30–50%** снижение повторяющихся вопросов к экспертам
- **3 недели** вместо 3 месяцев на онбординг новых сотрудников
- **80%+** точность ответов при правильно структурированной базе знаний

## С чего начать

Не пытайтесь загрузить всё сразу. Начните с 3–5 самых частых вопросов
и создайте под них качественный контент. Затем расширяйте.
""",
        "content_en": """
## Why Corporate Knowledge Bases Don't Work

Three main reasons corporate wikis fail:
1. **Outdated data** — nobody updates
2. **Poor search** — you need to know what to look for
3. **No context** — the document exists but it's unclear how to apply it

## What is an AI Assistant Based on Knowledge Base

Instead of keyword search — natural language dialogue.
An employee asks: "What is the customer return procedure?" —
and gets a precise answer with a link to the relevant section.

## Implementation Results

From our experience:
- **30–50%** reduction in repetitive questions to experts
- **3 weeks** instead of 3 months for onboarding new employees
- **80%+** answer accuracy with properly structured knowledge base
""",
        "excerpt": "Как превратить кладбище документов в умного ИИ-ассистента.",
        "content": "Корпоративные базы знаний и ИИ-ассистенты.",
        "category": "AI",
        "tags": "база знаний,ИИ,RAG,онбординг,корпоративный",
        "author_name": "Команда XTeam.Pro",
        "author_email": "team@xteam.pro",
        "status": "published",
        "is_featured": True,
        "reading_time": 7,
        "word_count": 560,
        "published_at": NOW - timedelta(days=35),
    },
    {
        "title": "Как выбрать ИИ-инструмент для бизнеса в 2025: практический гайд",
        "title_ru": "Как выбрать ИИ-инструмент для бизнеса в 2025: практический гайд",
        "title_en": "How to Choose an AI Tool for Business in 2025: Practical Guide",
        "slug": "how-to-choose-ai-tool-2025",
        "excerpt_ru": (
            "Рынок ИИ-инструментов переполнен. Как не потратить полгода на тестирование "
            "и выбрать решение, которое реально заработает в вашем бизнесе?"
        ),
        "excerpt_en": (
            "The AI tools market is overcrowded. How not to spend six months testing "
            "and choose a solution that will actually work in your business?"
        ),
        "content_ru": """
## Главная ошибка при выборе ИИ-инструмента

Компании выбирают инструмент до того, как сформулировали задачу.
«Хотим внедрить ИИ» — это не задача. «Хотим сократить время обработки "
заявок с 4 часов до 30 минут» — это задача.

## Три вопроса перед выбором

1. **Что конкретно должен делать инструмент?**
   Опишите входные данные, желаемый выход, критерий успеха.

2. **Кто будет это использовать?**
   Технический специалист или обычный менеджер? От этого зависит интерфейс.

3. **Как будет оцениваться результат?**
   Метрики должны быть определены до внедрения, не после.

## Критерии оценки инструментов

| Критерий | Вес |
|---------|-----|
| Соответствие задаче | 40% |
| Простота интеграции | 25% |
| Стоимость владения | 20% |
| Поддержка и документация | 15% |

## Не забывайте про change management

Лучший инструмент провалится, если команда его не примет.
Планируйте обучение, собирайте обратную связь, итерируйте.

## Вывод

Выбор ИИ-инструмента — это не технический, а бизнес-вопрос.
Начните с задачи, затем ищите инструмент. Не наоборот.
""",
        "content_en": """
## The Main Mistake When Choosing an AI Tool

Companies choose the tool before they've formulated the task.
"We want to implement AI" — this is not a task. "We want to reduce request processing time from 4 hours to 30 minutes" — this is a task.

## Three Questions Before Choosing

1. **What specifically should the tool do?**
2. **Who will use it?**
3. **How will the result be evaluated?**

## Evaluation Criteria

| Criterion | Weight |
|-----------|--------|
| Task fit | 40% |
| Integration ease | 25% |
| Total cost of ownership | 20% |
| Support & documentation | 15% |
""",
        "excerpt": "Рынок ИИ-инструментов переполнен. Как выбрать правильный для своего бизнеса?",
        "content": "Практический гайд по выбору ИИ-инструментов для бизнеса.",
        "category": "AI",
        "tags": "ИИ,инструменты,выбор,стратегия,2025",
        "author_name": "Команда XTeam.Pro",
        "author_email": "team@xteam.pro",
        "status": "published",
        "is_featured": False,
        "reading_time": 5,
        "word_count": 420,
        "published_at": NOW - timedelta(days=50),
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# CONTACTS
# ═══════════════════════════════════════════════════════════════════════════════

CONTACTS = [
    {
        "name": "Алексей Смирнов",
        "email": "a.smirnov@aviparts.ru",
        "phone": "+7 (495) 123-45-67",
        "company": "АвиаКомплект",
        "position": "Директор по операциям",
        "subject": "Автоматизация обработки RFQ-заявок",
        "message": (
            "Добрый день! Мы занимаемся поставкой авиационных комплектующих. "
            "Ежедневно обрабатываем 200+ коммерческих запросов вручную. "
            "Хотим автоматизировать этот процесс. Есть ли у вас опыт в этой отрасли?"
        ),
        "inquiry_type": "consultation",
        "status": "qualified",
        "priority": "high",
        "pipeline_stage": "qualified",
        "score": 85,
        "tags": "авиация,RFQ,приоритет",
        "source": "website",
        "created_at": NOW - timedelta(days=5),
    },
    {
        "name": "Марина Козлова",
        "email": "m.kozlova@mlmcompany.ru",
        "phone": "+7 (812) 987-65-43",
        "company": "Торговая сеть Партнёры",
        "position": "HR-директор",
        "subject": "Корпоративная система обучения и база знаний",
        "message": (
            "Мы сеть MLM с 500+ партнёрами. Хотим создать ИИ-ассистента, "
            "который поможет новым партнёрам быстрее выйти на результат. "
            "Сколько займёт проект и какой бюджет нужен?"
        ),
        "inquiry_type": "consultation",
        "status": "converted",
        "priority": "high",
        "pipeline_stage": "converted",
        "score": 92,
        "tags": "MLM,база знаний,обучение,конвертирован",
        "source": "referral",
        "created_at": NOW - timedelta(days=45),
    },
    {
        "name": "Дмитрий Волков",
        "email": "d.volkov@energygroup.ru",
        "phone": "+7 (499) 555-12-34",
        "company": "ЭнергоГрупп МЭС",
        "position": "ИТ-директор",
        "subject": "Цифровизация операционных процессов",
        "message": (
            "Нас интересует пилотный проект по цифровизации. "
            "Есть три направления: CRM для услуг, автоматизация ППР, "
            "мобильное приложение для полевых бригад. С чего лучше начать?"
        ),
        "inquiry_type": "consultation",
        "status": "contacted",
        "priority": "high",
        "pipeline_stage": "contacted",
        "score": 78,
        "tags": "энергетика,пилот,CRM,МЭС",
        "source": "website",
        "created_at": NOW - timedelta(days=10),
    },
    {
        "name": "Екатерина Новикова",
        "email": "e.novikova@edtech-startup.ru",
        "company": "EduStart",
        "position": "CEO",
        "subject": "Разработка образовательной платформы с ИИ",
        "message": (
            "Хотим создать образовательную платформу с персонализированными "
            "траекториями обучения. Видели ваш кейс StudyNinja — интересно узнать "
            "подробнее о технологии."
        ),
        "inquiry_type": "consultation",
        "status": "new",
        "priority": "medium",
        "pipeline_stage": "new",
        "score": 65,
        "tags": "EdTech,образование,ИИ-тьютор",
        "source": "website",
        "created_at": NOW - timedelta(days=2),
    },
    {
        "name": "Игорь Петров",
        "email": "i.petrov@logistik.ru",
        "phone": "+7 (383) 444-55-66",
        "company": "ЛогистикПро",
        "position": "Операционный директор",
        "subject": "Оптимизация маршрутов и складских операций",
        "message": (
            "Управляем сетью из 8 складов. Хотим автоматизировать планирование "
            "маршрутов и управление запасами. Какие решения вы предлагаете?"
        ),
        "inquiry_type": "consultation",
        "status": "new",
        "priority": "medium",
        "pipeline_stage": "new",
        "score": 55,
        "tags": "логистика,склад,маршруты",
        "source": "website",
        "created_at": NOW - timedelta(days=1),
    },
    {
        "name": "Татьяна Белова",
        "email": "t.belova@retail-chain.ru",
        "company": "Ретейл Сеть",
        "position": "Маркетинг-директор",
        "subject": "Персонализация и рекомендательная система",
        "message": (
            "У нас 300 000 SKU и 2 млн клиентов. Хотим внедрить рекомендательную "
            "систему и персонализацию email-рассылок. Бюджет обсуждаем."
        ),
        "inquiry_type": "consultation",
        "status": "new",
        "priority": "urgent",
        "pipeline_stage": "new",
        "score": 88,
        "tags": "ретейл,персонализация,рекомендации",
        "source": "website",
        "created_at": NOW - timedelta(hours=3),
    },
    {
        "name": "Сергей Громов",
        "email": "s.gromov@manufacture.ru",
        "phone": "+7 (351) 222-33-44",
        "company": "МашПром",
        "position": "Технический директор",
        "subject": "Предиктивное обслуживание оборудования",
        "message": (
            "Производим оборудование. Простои стоят нам 2–3 млн рублей в день. "
            "Изучаем предиктивное обслуживание на основе данных с датчиков IoT."
        ),
        "inquiry_type": "consultation",
        "status": "closed",
        "priority": "low",
        "pipeline_stage": "closed",
        "score": 30,
        "tags": "производство,IoT,предиктивный",
        "source": "referral",
        "created_at": NOW - timedelta(days=60),
    },
    {
        "name": "Анастасия Фёдорова",
        "email": "a.fedorova@fintech.ru",
        "company": "ФинТех Решения",
        "position": "Руководитель отдела аналитики",
        "subject": "Партнёрство по ИИ-решениям для банков",
        "message": (
            "Мы разрабатываем решения для банков. Хотим рассмотреть возможность "
            "партнёрства в области ИИ-аналитики и автоматизации риск-менеджмента."
        ),
        "inquiry_type": "partnership",
        "status": "qualified",
        "priority": "medium",
        "pipeline_stage": "qualified",
        "score": 70,
        "tags": "партнёрство,финтех,банки,ИИ",
        "source": "referral",
        "created_at": NOW - timedelta(days=15),
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# ANALYTICS GOALS
# ═══════════════════════════════════════════════════════════════════════════════

GOALS = [
    {"metric": "total_submissions", "target_value": 50, "period": "30d", "is_active": True},
    {"metric": "completed_audits", "target_value": 20, "period": "30d", "is_active": True},
    {"metric": "total_contacts", "target_value": 30, "period": "30d", "is_active": True},
    {"metric": "converted_contacts", "target_value": 5, "period": "30d", "is_active": True},
    {"metric": "average_maturity_score", "target_value": 65, "period": "30d", "is_active": True},
]


# ═══════════════════════════════════════════════════════════════════════════════
# EMAIL TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

EMAIL_TEMPLATES = [
    {
        "name": "Первичный ответ на заявку",
        "subject": "Получили вашу заявку — {{name}}",
        "body": """Здравствуйте, {{name}}!

Мы получили вашу заявку и уже изучаем её.

Обычно мы отвечаем в течение 1 рабочего дня. Если у вас срочный вопрос —
напишите нам напрямую или позвоните.

Кратко о вашей заявке:
— Тема: {{subject}}
— Компания: {{company}}

Скоро свяжемся!

С уважением,
Команда XTeam.Pro""",
        "category": "onboarding",
        "is_active": True,
    },
    {
        "name": "Приглашение на discovery-звонок",
        "subject": "Предлагаем 30 минут для разбора вашей задачи — {{company}}",
        "body": """Здравствуйте, {{name}}!

Изучили вашу заявку и видим потенциал для сотрудничества.

Предлагаем провести 30-минутный discovery-звонок, где мы:
✓ Разберём вашу задачу
✓ Покажем релевантные кейсы
✓ Обозначим возможный объём пилота

Удобное время для встречи: https://calendly.com/xteam

Если вопросы — пишите на {{email}}.

С уважением,
Команда XTeam.Pro""",
        "category": "sales",
        "is_active": True,
    },
    {
        "name": "Благодарность за встречу",
        "subject": "Спасибо за встречу, {{name}} — следующие шаги",
        "body": """Здравствуйте, {{name}}!

Спасибо за продуктивную встречу!

Резюмируем договорённости:

1. Мы подготовим предложение по пилоту до [дата]
2. Вы предоставите доступ к [данные/системы] до [дата]
3. Следующая встреча: [дата и время]

Если появятся вопросы — пишите напрямую.

С уважением,
Команда XTeam.Pro""",
        "category": "sales",
        "is_active": True,
    },
]


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════════

async def seed():
    async with AsyncSessionLocal() as db:
        # ── Case Studies ────────────────────────────────────────────────────────
        print("Seeding case studies...")
        existing_slugs = set()
        from sqlalchemy import select as sa_select
        rows = await db.execute(sa_select(CaseStudy.slug))
        existing_slugs = {r[0] for r in rows.all()}

        for data in CASES:
            if data["slug"] in existing_slugs:
                print(f"  SKIP case {data['slug']} (already exists)")
                continue
            cs = CaseStudy(**data)
            db.add(cs)
            print(f"  ADD  case {data['slug']}")

        # ── Blog Posts ──────────────────────────────────────────────────────────
        print("Seeding blog posts...")
        rows = await db.execute(sa_select(BlogPost.slug))
        existing_blog_slugs = {r[0] for r in rows.all()}

        for data in BLOG_POSTS:
            if data["slug"] in existing_blog_slugs:
                print(f"  SKIP post {data['slug']} (already exists)")
                continue
            bp = BlogPost(**data)
            db.add(bp)
            print(f"  ADD  post {data['slug']}")

        # ── Contacts ────────────────────────────────────────────────────────────
        print("Seeding contacts...")
        rows = await db.execute(sa_select(ContactInquiry.email))
        existing_emails = {r[0] for r in rows.all()}

        contact_objs = []
        for data in CONTACTS:
            if data["email"] in existing_emails:
                print(f"  SKIP contact {data['email']} (already exists)")
                continue
            data_copy = dict(data)
            created_at = data_copy.pop("created_at", None)
            c = ContactInquiry(**data_copy)
            if created_at:
                c.created_at = created_at
            db.add(c)
            contact_objs.append((c, data))
            print(f"  ADD  contact {data['email']}")

        # Flush to get IDs
        await db.flush()

        # Add notes for first contact
        if contact_objs:
            first_contact, _ = contact_objs[0]
            if first_contact.id:
                note = ContactNote(
                    contact_id=first_contact.id,
                    note="Клиент подтвердил интерес. Отправлено коммерческое предложение. Жду ответа.",
                    created_by="admin",
                )
                db.add(note)

        # ── Analytics Goals ─────────────────────────────────────────────────────
        print("Seeding analytics goals...")
        rows = await db.execute(sa_select(AnalyticsGoal.metric))
        existing_metrics = {r[0] for r in rows.all()}

        for data in GOALS:
            if data["metric"] in existing_metrics:
                print(f"  SKIP goal {data['metric']} (already exists)")
                continue
            g = AnalyticsGoal(**data)
            db.add(g)
            print(f"  ADD  goal {data['metric']}")

        # ── Email Templates ─────────────────────────────────────────────────────
        print("Seeding email templates...")
        rows = await db.execute(sa_select(EmailTemplate.name))
        existing_tpl_names = {r[0] for r in rows.all()}

        for data in EMAIL_TEMPLATES:
            if data["name"] in existing_tpl_names:
                print(f"  SKIP template '{data['name']}' (already exists)")
                continue
            t = EmailTemplate(**data)
            db.add(t)
            print(f"  ADD  template '{data['name']}'")

        await db.commit()
        print("\nDone! Database seeded successfully.")


if __name__ == "__main__":
    asyncio.run(seed())
