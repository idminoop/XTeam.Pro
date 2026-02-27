from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.config import get_async_db
from models.case_study import CaseStudy

router = APIRouter(tags=["cases"])


def _localized(case: CaseStudy, base: str, lang: str) -> str:
    localized = getattr(case, f"{base}_{lang}", None)
    alt_lang = "en" if lang == "ru" else "ru"
    localized_alt = getattr(case, f"{base}_{alt_lang}", None)
    return (localized or localized_alt or "").strip()


def _localized_metrics(raw_results: list, lang: str) -> list:
    metrics = []
    alt_lang = "en" if lang == "ru" else "ru"
    for item in raw_results or []:
        if not isinstance(item, dict):
            continue
        metrics.append(
            {
                "metric": (item.get(f"metric_{lang}") or item.get(f"metric_{alt_lang}") or "").strip(),
                "value": (item.get("value") or "").strip(),
                "improvement": (item.get(f"improvement_{lang}") or item.get(f"improvement_{alt_lang}") or "").strip(),
            }
        )
    return metrics


def _public_case_payload(case: CaseStudy, lang: str) -> dict:
    return {
        "id": case.id,
        "slug": case.slug,
        "title": _localized(case, "title", lang),
        "client_company": case.client_company,
        "industry": _localized(case, "industry", lang),
        "challenge": _localized(case, "challenge", lang),
        "solution": _localized(case, "solution", lang),
        "results": _localized_metrics(case.results or [], lang),
        "roi": case.roi,
        "time_saved": case.time_saved,
        "testimonial": _localized(case, "testimonial", lang),
        "featured_image": case.featured_image,
        "is_featured": bool(case.is_featured),
        "published_at": case.published_at.isoformat() if case.published_at else None,
    }


@router.get("")
async def list_published_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(12, ge=1, le=100),
    featured: bool = Query(None),
    industry: str = Query(None),
    search: str = Query(None),
    lang: str = Query("en", pattern="^(ru|en)$"),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(CaseStudy).where(CaseStudy.status == "published")

    conditions = []
    if featured is not None:
        conditions.append(CaseStudy.is_featured == featured)
    if industry:
        if lang == "ru":
            conditions.append(CaseStudy.industry_ru == industry)
        else:
            conditions.append(CaseStudy.industry_en == industry)
    if search:
        term = f"%{search}%"
        conditions.append(
            or_(
                CaseStudy.title_ru.ilike(term),
                CaseStudy.title_en.ilike(term),
                CaseStudy.challenge_ru.ilike(term),
                CaseStudy.challenge_en.ilike(term),
                CaseStudy.solution_ru.ilike(term),
                CaseStudy.solution_en.ilike(term),
                CaseStudy.client_company.ilike(term),
            )
        )

    if conditions:
        query = query.where(and_(*conditions))

    total_q = select(func.count()).select_from(query.subquery())
    total = await db.scalar(total_q)

    rows = await db.execute(
        query.order_by(CaseStudy.is_featured.desc(), CaseStudy.sort_order.asc(), CaseStudy.published_at.desc())
        .offset(skip)
        .limit(limit)
    )
    cases = rows.scalars().all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [_public_case_payload(case, lang) for case in cases],
    }


@router.get("/industries")
async def list_case_industries(
    lang: str = Query("en", pattern="^(ru|en)$"),
    db: AsyncSession = Depends(get_async_db),
):
    industry_col = CaseStudy.industry_ru if lang == "ru" else CaseStudy.industry_en
    rows = await db.execute(
        select(industry_col.label("industry"), func.count(CaseStudy.id).label("count"))
        .where(CaseStudy.status == "published")
        .group_by(industry_col)
        .order_by(func.count(CaseStudy.id).desc())
    )
    industries = [{"industry": r.industry, "count": r.count} for r in rows.all() if r.industry]
    return {"industries": industries}


@router.get("/{slug}")
async def get_published_case(
    slug: str,
    lang: str = Query("en", pattern="^(ru|en)$"),
    db: AsyncSession = Depends(get_async_db),
):
    case = await db.scalar(
        select(CaseStudy).where(CaseStudy.slug == slug, CaseStudy.status == "published")
    )
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return _public_case_payload(case, lang)
