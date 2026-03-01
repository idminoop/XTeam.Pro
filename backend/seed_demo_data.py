"""
Seed the database with realistic demo data for local development.

Usage (inside backend container or local venv):
    python seed_demo_data.py
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterable

from database.config import Base, SessionLocal, engine
from models.admin import AdminUser
from models.analytics import AnalyticsGoal
from models.audit import Audit, AuditResult
from models.blog import BlogPost
from models.case_study import CaseStudy
from models.contact import ContactActivity, ContactInquiry, ContactNote, ContactTask, EmailTemplate


def _upsert_by_slug(existing: dict[str, object], slug: str, model_cls, payload: dict):
    item = existing.get(slug)
    if item is None:
        return model_cls(**payload), True
    for key, value in payload.items():
        setattr(item, key, value)
    return item, False


def _seed_case_studies(db) -> tuple[int, int]:
    now = datetime.now(timezone.utc)
    payloads = [
        {
            "slug": "fastai-aviation-automation",
            "title_ru": "Автоматизация обработки RFQ в авиации (FastAI / DealMaster)",
            "title_en": "Aviation RFQ Automation (FastAI / DealMaster)",
            "client_company": "Aviation Parts Distributor",
            "industry_ru": "Авиация",
            "industry_en": "Aviation",
            "challenge_ru": "Сотни входящих RFQ-писем без структуры, ручная обработка заявок, потери в выручке из-за медленных ответов.",
            "challenge_en": "Hundreds of daily RFQ emails with no structure, manual request processing, and revenue leakage due to slow responses.",
            "solution_ru": "AI-пайплайн разбора писем, умная классификация P/N, BPM-автоматизация воронки и приоритетная inbox-панель для менеджеров.",
            "solution_en": "AI email ingestion pipeline, part-number classification, BPM-driven workflow automation, and a priority inbox for managers.",
            "results": [
                {
                    "metric_ru": "Скорость обработки",
                    "metric_en": "Processing speed",
                    "value": "3-5x",
                    "improvement_ru": "быстрее",
                    "improvement_en": "faster",
                },
                {
                    "metric_ru": "Потери из-за ошибок",
                    "metric_en": "Losses from mistakes",
                    "value": "10%+",
                    "improvement_ru": "снижение",
                    "improvement_en": "reduction",
                },
            ],
            "roi": "6-9 месяцев",
            "time_saved": "4-8 недель до пилота",
            "testimonial_ru": "Автоматизация сняла рутину с команды и позволила сосредоточиться на приоритетных сделках.",
            "testimonial_en": "Automation removed routine tasks and let the team focus on priority deals.",
            "featured_image": "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1200&q=80",
            "status": "published",
            "is_featured": True,
            "sort_order": 1,
            "published_at": now - timedelta(days=30),
        },
        {
            "slug": "hr-knowledge-base-effectiveness",
            "title_ru": "HR-эффективность и корпоративная база знаний",
            "title_en": "HR Effectiveness and Corporate Knowledge Base",
            "client_company": "Commercial Personnel Company",
            "industry_ru": "HR и обучение",
            "industry_en": "HR & L&D",
            "challenge_ru": "Разрозненные знания, долгий онбординг, нестабильная производительность новых сотрудников.",
            "challenge_en": "Scattered knowledge, long onboarding, and unstable performance of newly hired employees.",
            "solution_ru": "Единая база знаний X-LogOS, модель компетенций, автоматизированные треки адаптации и аналитика эффективности.",
            "solution_en": "Unified X-LogOS knowledge base, competency model, automated onboarding tracks, and performance analytics.",
            "results": [
                {
                    "metric_ru": "Рост продуктивности",
                    "metric_en": "Productivity growth",
                    "value": "30-50%",
                    "improvement_ru": "по команде",
                    "improvement_en": "team-wide",
                },
                {
                    "metric_ru": "Скорость онбординга",
                    "metric_en": "Onboarding speed",
                    "value": "3x",
                    "improvement_ru": "быстрее",
                    "improvement_en": "faster",
                },
            ],
            "roi": "8-12 месяцев",
            "time_saved": "6-12 месяцев внедрения",
            "testimonial_ru": "Срок адаптации сократился, а результаты сотрудников стали предсказуемыми.",
            "testimonial_en": "Onboarding timelines shrank and employee performance became more predictable.",
            "featured_image": "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
            "status": "published",
            "is_featured": True,
            "sort_order": 2,
            "published_at": now - timedelta(days=25),
        },
        {
            "slug": "mes-energy-pilot-digitalization",
            "title_ru": "Пилот цифровизации для энергетической компании (МЭС)",
            "title_en": "MES Energy Pilot Digitalization",
            "client_company": "Energy Sector Company (MES)",
            "industry_ru": "Энергетика",
            "industry_en": "Energy",
            "challenge_ru": "Разрозненные CRM/отчёты/ППР, бумажные процессы и отсутствие прозрачности по полевым командам.",
            "challenge_en": "Siloed CRM/reporting/maintenance processes, paperwork-heavy operations, and no field-team visibility.",
            "solution_ru": "Пилотные цифровые модули: CRM под МЭС, автоматизация отчётности, приложение инженера и контроль KPI.",
            "solution_en": "Pilot digital modules: MES-tailored CRM, automated reporting, engineer app, and KPI tracking.",
            "results": [
                {
                    "metric_ru": "Снижение ручных операций",
                    "metric_en": "Manual operations reduction",
                    "value": "20-40%",
                    "improvement_ru": "меньше рутины",
                    "improvement_en": "less routine",
                },
                {
                    "metric_ru": "Прозрачность полевых работ",
                    "metric_en": "Field operations visibility",
                    "value": "100%",
                    "improvement_ru": "цифровой контроль",
                    "improvement_en": "digital control",
                },
            ],
            "roi": "6-9 месяцев",
            "time_saved": "4-6 недель",
            "testimonial_ru": "Пилот быстро доказал ценность и дал основу для масштабирования.",
            "testimonial_en": "The pilot quickly validated value and provided a foundation for scaling.",
            "featured_image": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
            "status": "published",
            "is_featured": False,
            "sort_order": 3,
            "published_at": now - timedelta(days=20),
        },
        {
            "slug": "studyninja-personalized-learning",
            "title_ru": "StudyNinja: персонализированная образовательная платформа",
            "title_en": "StudyNinja Personalized Learning Platform",
            "client_company": "StudyNinja (XTeam.Pro)",
            "industry_ru": "Образование / EdTech",
            "industry_en": "Education / EdTech",
            "challenge_ru": "Типовые программы не учитывают индивидуальный темп и стиль обучения, низкое удержание учащихся.",
            "challenge_en": "Standard curricula ignore individual learning pace and style, causing low retention.",
            "solution_ru": "Граф знаний + диагностика психотипа + AI-тьютор с адаптивными микротреками.",
            "solution_en": "Knowledge graph + psychotype diagnostics + adaptive AI tutor with micro-learning tracks.",
            "results": [
                {
                    "metric_ru": "D30 удержание",
                    "metric_en": "D30 retention",
                    "value": "35-40%",
                    "improvement_ru": "рост",
                    "improvement_en": "increase",
                },
                {
                    "metric_ru": "Сокращение времени обучения",
                    "metric_en": "Learning time reduction",
                    "value": "-35%",
                    "improvement_ru": "быстрее до результата",
                    "improvement_en": "faster time-to-result",
                },
            ],
            "roi": "Грантовая модель",
            "time_saved": "2024-2025",
            "testimonial_ru": "Персонализация дала измеримый рост вовлечённости и прогресса учеников.",
            "testimonial_en": "Personalization produced measurable gains in learner engagement and progress.",
            "featured_image": "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80",
            "status": "published",
            "is_featured": False,
            "sort_order": 4,
            "published_at": now - timedelta(days=15),
        },
    ]

    existing = {item.slug: item for item in db.query(CaseStudy).all()}
    created, updated = 0, 0
    for payload in payloads:
        item, is_new = _upsert_by_slug(existing, payload["slug"], CaseStudy, payload)
        if is_new:
            db.add(item)
            created += 1
        else:
            updated += 1
    return created, updated


def _seed_blog_posts(db) -> tuple[int, int]:
    now = datetime.now(timezone.utc)
    posts = [
        {
            "slug": "audit-ai-maturity-2026-guide",
            "title_ru": "AI-аудит зрелости 2026: как подготовить компанию за 10 дней",
            "title_en": "AI Maturity Audit 2026: How to Prepare Your Company in 10 Days",
            "excerpt_ru": "Пошаговый план быстрой подготовки к AI-аудиту: данные, процессы, KPI и риски.",
            "excerpt_en": "A practical 10-day preparation plan for AI audit readiness: data, processes, KPIs, and risks.",
            "content_ru": "<p>AI-аудит начинается с карты процессов и метрик. За 10 дней можно собрать минимальный baseline...</p>",
            "content_en": "<p>An AI audit starts with process mapping and KPI baseline. In 10 days you can prepare enough context...</p>",
            "category": "AI Strategy",
            "tags": "AI Audit,AI Strategy,Governance,KPI",
            "is_featured": True,
            "published_at": now - timedelta(days=12),
            "reading_time": 7,
            "word_count": 1200,
        },
        {
            "slug": "b2b-sales-automation-playbook",
            "title_ru": "Автоматизация B2B-продаж: playbook для лидов и КП",
            "title_en": "B2B Sales Automation Playbook for Leads and Proposals",
            "excerpt_ru": "Как выстроить pipeline от входящей заявки до КП без ручной рутины.",
            "excerpt_en": "How to build an end-to-end pipeline from inbound lead to proposal without manual bottlenecks.",
            "content_ru": "<p>Начните с SLA на ответ по лидам и добавьте автоматический скоринг...</p>",
            "content_en": "<p>Start with lead-response SLA and introduce automatic scoring...</p>",
            "category": "Automation",
            "tags": "B2B,CRM,Lead Scoring,Automation",
            "is_featured": False,
            "published_at": now - timedelta(days=10),
            "reading_time": 6,
            "word_count": 980,
        },
        {
            "slug": "knowledge-base-architecture-rag",
            "title_ru": "Корпоративная база знаний на RAG: архитектура без боли",
            "title_en": "Corporate Knowledge Base with RAG: Practical Architecture",
            "excerpt_ru": "Выбор структуры документов, embeddings и источников правды для быстрого запуска.",
            "excerpt_en": "A practical guide to document structure, embeddings, and source-of-truth design for fast launch.",
            "content_ru": "<p>RAG-системы проваливаются, когда нет дисциплины по источникам данных...</p>",
            "content_en": "<p>RAG systems fail when there is no source discipline and freshness policy...</p>",
            "category": "Case Studies",
            "tags": "RAG,Knowledge Base,LLM,Architecture",
            "is_featured": True,
            "published_at": now - timedelta(days=8),
            "reading_time": 9,
            "word_count": 1400,
        },
        {
            "slug": "energy-mes-digital-pilot",
            "title_ru": "Пилот цифровизации в МЭС: что реально сделать за 6 недель",
            "title_en": "MES Digital Pilot: What You Can Realistically Deliver in 6 Weeks",
            "excerpt_ru": "Практический сценарий пилота для энергетических компаний с быстрым эффектом.",
            "excerpt_en": "A practical six-week pilot scenario for energy companies focused on fast measurable gains.",
            "content_ru": "<p>В энергетике важно не ломать текущий контур, поэтому пилот должен быть модульным...</p>",
            "content_en": "<p>In energy operations, pilots must be modular to avoid disrupting existing workflows...</p>",
            "category": "Industry Insights",
            "tags": "Energy,MES,Pilot,Digitalization",
            "is_featured": False,
            "published_at": now - timedelta(days=6),
            "reading_time": 5,
            "word_count": 850,
        },
        {
            "slug": "admin-panel-kpi-dashboard-design",
            "title_ru": "Как проектировать KPI-дашборд в админке: 12 анти-паттернов",
            "title_en": "How to Design KPI Dashboards in Admin Panels: 12 Anti-Patterns",
            "excerpt_ru": "Разбираем ошибки в визуализации KPI и как не потерять управляемость.",
            "excerpt_en": "Common KPI dashboard mistakes and how to keep operational visibility intact.",
            "content_ru": "<p>Смешение операционных и стратегических метрик делает дашборд бесполезным...</p>",
            "content_en": "<p>Mixing strategic and operational metrics in one panel often destroys usability...</p>",
            "category": "AI Strategy",
            "tags": "Dashboard,KPI,Admin UI,Analytics",
            "is_featured": False,
            "published_at": now - timedelta(days=4),
            "reading_time": 8,
            "word_count": 1100,
        },
        {
            "slug": "ai-cost-control-ops-budget",
            "title_ru": "Контроль затрат на AI: бюджетирование и лимиты без деградации качества",
            "title_en": "AI Cost Control: Budgeting and Limits Without Quality Loss",
            "excerpt_ru": "Как держать стоимость inference под контролем и не ломать UX.",
            "excerpt_en": "How to control inference costs while keeping response quality and UX stable.",
            "content_ru": "<p>Установите бюджеты на уровень сценариев и клиентов, а не только на модель...</p>",
            "content_en": "<p>Apply budgets at scenario and customer levels, not only by model...</p>",
            "category": "Automation",
            "tags": "Cost Control,LLM,Ops,FinOps",
            "is_featured": False,
            "published_at": now - timedelta(days=2),
            "reading_time": 6,
            "word_count": 930,
        },
    ]

    existing = {item.slug: item for item in db.query(BlogPost).all()}
    created, updated = 0, 0
    for item in posts:
        payload = {
            "title": item["title_en"],
            "slug": item["slug"],
            "excerpt": item["excerpt_en"],
            "content": item["content_en"],
            "title_ru": item["title_ru"],
            "title_en": item["title_en"],
            "excerpt_ru": item["excerpt_ru"],
            "excerpt_en": item["excerpt_en"],
            "content_ru": item["content_ru"],
            "content_en": item["content_en"],
            "meta_title": item["title_en"],
            "meta_description": item["excerpt_en"],
            "keywords": item["tags"],
            "featured_image": "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
            "featured_image_alt": item["title_en"],
            "category": item["category"],
            "tags": item["tags"],
            "author_name": "XTeam.Pro",
            "author_email": "info@xteam.pro",
            "author_bio": "Команда XTeam.Pro — AI и автоматизация для сложных бизнес-процессов.",
            "status": "published",
            "published_at": item["published_at"],
            "view_count": 0,
            "like_count": 0,
            "share_count": 0,
            "reading_time": item["reading_time"],
            "word_count": item["word_count"],
            "is_featured": item["is_featured"],
            "allow_comments": True,
            "is_seo_optimized": True,
        }
        db_item, is_new = _upsert_by_slug(existing, payload["slug"], BlogPost, payload)
        if is_new:
            db.add(db_item)
            created += 1
        else:
            updated += 1

    return created, updated


def _seed_contacts(db, admin_username: str) -> tuple[int, int, int]:
    statuses = ["new", "contacted", "qualified", "converted", "closed"]
    priorities = ["low", "medium", "high", "urgent"]
    source_cycle = ["website", "linkedin", "referral", "webinar", "email"]
    names = [
        ("Анна Крылова", "Aster Logistics"),
        ("Илья Петров", "Nord Agro"),
        ("Мария Соколова", "Skyline Travel"),
        ("Павел Романов", "Retail Nova"),
        ("Екатерина Власова", "FinCore"),
        ("Артем Ким", "MetaBuild"),
        ("Светлана Орлова", "EdBridge"),
        ("Денис Захаров", "TechnoPort"),
        ("Елена Исаева", "ProService"),
        ("Максим Гришин", "BioWave"),
    ]
    created_contacts = 0
    created_notes = 0
    created_tasks = 0

    for idx, (name, company) in enumerate(names, start=1):
        email = f"demo.contact{idx:02d}@xteam.pro"
        existing = db.query(ContactInquiry).filter(ContactInquiry.email == email).one_or_none()
        status = statuses[idx % len(statuses)]
        if existing is None:
            contact = ContactInquiry(
                name=name,
                email=email,
                phone=f"+7 900 555-{idx:04d}",
                company=company,
                position="Операционный менеджер",
                subject=f"Запрос на AI-пилот #{idx}",
                message="Хотим сократить ручные операции и получить пилот с KPI.",
                inquiry_type="consultation",
                preferred_contact_method="email",
                budget_range="500k-1m",
                timeline="1-3_months",
                status=status,
                priority=priorities[idx % len(priorities)],
                assigned_to=admin_username,
                tags="demo,lead,automation",
                score=40 + idx * 4,
                pipeline_stage=status if status in {"new", "contacted", "qualified", "converted", "closed"} else "new",
                source=source_cycle[idx % len(source_cycle)],
                utm_source="demo_seed",
                utm_medium="script",
                utm_campaign="admin_preview",
                is_newsletter_subscribed=idx % 2 == 0,
                is_gdpr_compliant=True,
            )
            db.add(contact)
            db.flush()
            created_contacts += 1
        else:
            contact = existing
            contact.status = status
            contact.pipeline_stage = status
            contact.priority = priorities[idx % len(priorities)]
            contact.assigned_to = admin_username
            contact.score = 40 + idx * 4

        note_text = f"Демо-заметка по контакту #{idx}: согласован следующий шаг."
        existing_note = (
            db.query(ContactNote)
            .filter(ContactNote.contact_id == contact.id, ContactNote.note == note_text)
            .one_or_none()
        )
        if existing_note is None:
            db.add(ContactNote(contact_id=contact.id, note=note_text, created_by=admin_username))
            created_notes += 1

        task_title = f"Подготовить коммерческое предложение #{idx}"
        existing_task = (
            db.query(ContactTask)
            .filter(ContactTask.contact_id == contact.id, ContactTask.title == task_title)
            .one_or_none()
        )
        if existing_task is None:
            db.add(
                ContactTask(
                    contact_id=contact.id,
                    title=task_title,
                    description="Собрать вводные и отправить КП клиенту.",
                    status="todo" if idx % 3 else "in_progress",
                    priority=priorities[idx % len(priorities)],
                    assigned_to=admin_username,
                    created_by=admin_username,
                    due_date=datetime.now(timezone.utc) + timedelta(days=idx),
                )
            )
            created_tasks += 1

        activity_text = f"Контакт добавлен демо-скриптом (этап: {contact.pipeline_stage})."
        existing_activity = (
            db.query(ContactActivity)
            .filter(
                ContactActivity.contact_id == contact.id,
                ContactActivity.activity_type == "system",
                ContactActivity.message == activity_text,
            )
            .one_or_none()
        )
        if existing_activity is None:
            db.add(
                ContactActivity(
                    contact_id=contact.id,
                    activity_type="system",
                    message=activity_text,
                    metadata_json={"source": "seed_demo_data.py"},
                    created_by=admin_username,
                )
            )

    return created_contacts, created_notes, created_tasks


def _seed_audits(db) -> tuple[int, int]:
    companies = [
        ("NorthWind Cargo", "logistics"),
        ("Helios Retail", "retail"),
        ("Vega Energy", "energy"),
        ("Nova Clinic", "healthcare"),
        ("Aurum Foods", "manufacturing"),
        ("Atlas Insurance", "finance"),
        ("Quantum HR", "hr"),
        ("Orbit Education", "edtech"),
    ]
    statuses = ["completed", "completed", "processing", "pending", "completed", "failed", "completed", "pending"]
    created_audits = 0
    created_results = 0

    for idx, (company, industry) in enumerate(companies, start=1):
        email = f"audit.demo{idx:02d}@xteam.pro"
        audit = db.query(Audit).filter(Audit.contact_email == email).one_or_none()
        if audit is None:
            audit = Audit(
                company_name=company,
                industry=industry,
                company_size="51-200",
                current_challenges=["manual_work", "data_silos", "slow_reporting"],
                business_processes=["sales", "operations", "support"],
                automation_goals=["reduce_costs", "increase_speed", "improve_quality"],
                budget_range="1m-3m",
                timeline="3-6_months",
                contact_email=email,
                contact_name=f"Demo Contact {idx}",
                phone=f"+7 900 777-{idx:04d}",
                status=statuses[idx - 1],
            )
            db.add(audit)
            db.flush()
            created_audits += 1
        else:
            audit.status = statuses[idx - 1]

        has_result = db.query(AuditResult).filter(AuditResult.audit_id == audit.id).first()
        if audit.status == "completed" and not has_result:
            db.add(
                AuditResult(
                    audit_id=audit.id,
                    maturity_score=58 + idx * 4,
                    automation_potential=62 + idx * 3,
                    roi_projection=120.0 + idx * 10,
                    implementation_timeline="3-4 месяца",
                    strengths=["Сильная команда", "Высокая мотивация к автоматизации"],
                    weaknesses=["Разрозненные данные", "Много ручной рутины"],
                    opportunities=["AI-классификация", "Автоматизация отчётности", "Сквозная аналитика"],
                    recommendations=["Запустить пилот на одном процессе", "Внедрить KPI-дашборд"],
                    process_scores={"sales": 65 + idx, "operations": 55 + idx, "support": 60 + idx},
                    priority_areas=["operations", "reporting"],
                    estimated_savings=2_000_000 + idx * 250_000,
                    implementation_cost=1_200_000 + idx * 120_000,
                    payback_period=7.0 - min(idx * 0.4, 2.5),
                )
            )
            created_results += 1

    return created_audits, created_results


def _seed_email_templates(db) -> tuple[int, int]:
    payloads = [
        {
            "name": "demo_welcome",
            "subject": "Спасибо за обращение в XTeam.Pro",
            "body": "Здравствуйте! Мы получили вашу заявку и подготовим следующий шаг в течение 1 рабочего дня.",
            "category": "general",
            "is_active": True,
        },
        {
            "name": "demo_followup",
            "subject": "Уточнение по AI-пилоту",
            "body": "Подскажите, пожалуйста, какие процессы для вас приоритетны в ближайшие 3 месяца?",
            "category": "sales",
            "is_active": True,
        },
        {
            "name": "demo_reactivation",
            "subject": "Возобновим обсуждение AI-автоматизации?",
            "body": "Мы подготовили обновлённый план пилота и можем обсудить его на коротком звонке.",
            "category": "sales",
            "is_active": True,
        },
    ]

    existing = {item.name: item for item in db.query(EmailTemplate).all()}
    created, updated = 0, 0
    for payload in payloads:
        item = existing.get(payload["name"])
        if item is None:
            db.add(EmailTemplate(**payload))
            created += 1
        else:
            item.subject = payload["subject"]
            item.body = payload["body"]
            item.category = payload["category"]
            item.is_active = payload["is_active"]
            updated += 1
    return created, updated


def _seed_analytics_goals(db) -> tuple[int, int]:
    payloads = [
        {"metric": "conversion_rate", "target_value": 18.0, "period": "30d", "is_active": True},
        {"metric": "contact_response_time_hours", "target_value": 4.0, "period": "30d", "is_active": True},
        {"metric": "avg_audit_score", "target_value": 72.0, "period": "90d", "is_active": True},
    ]
    existing = {item.metric: item for item in db.query(AnalyticsGoal).all()}
    created, updated = 0, 0
    for payload in payloads:
        item = existing.get(payload["metric"])
        if item is None:
            db.add(AnalyticsGoal(**payload))
            created += 1
        else:
            item.target_value = payload["target_value"]
            item.period = payload["period"]
            item.is_active = payload["is_active"]
            updated += 1
    return created, updated


def _first_admin_username(db) -> str:
    admin = db.query(AdminUser).order_by(AdminUser.id.asc()).first()
    return admin.username if admin else "system"


def _print_summary(summary: Iterable[tuple[str, str]]) -> None:
    print("\nDemo data seed summary:")
    for key, value in summary:
        print(f"- {key}: {value}")


def seed_demo_data() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin_username = _first_admin_username(db)

        cases_created, cases_updated = _seed_case_studies(db)
        posts_created, posts_updated = _seed_blog_posts(db)
        contacts_created, notes_created, tasks_created = _seed_contacts(db, admin_username)
        audits_created, results_created = _seed_audits(db)
        templates_created, templates_updated = _seed_email_templates(db)
        goals_created, goals_updated = _seed_analytics_goals(db)

        db.commit()
        _print_summary(
            [
                ("Case studies", f"+{cases_created} new, {cases_updated} updated"),
                ("Blog posts", f"+{posts_created} new, {posts_updated} updated"),
                ("Contacts", f"+{contacts_created} new"),
                ("Contact notes", f"+{notes_created} new"),
                ("Contact tasks", f"+{tasks_created} new"),
                ("Audits", f"+{audits_created} new"),
                ("Audit results", f"+{results_created} new"),
                ("Email templates", f"+{templates_created} new, {templates_updated} updated"),
                ("Analytics goals", f"+{goals_created} new, {goals_updated} updated"),
            ]
        )
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_demo_data()
