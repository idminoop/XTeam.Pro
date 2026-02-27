import re
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field
from sqlalchemy import and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from database.config import get_async_db
from models.admin import AdminUser
from models.case_study import CaseStudy
from routes.admin import get_current_admin_user, require_permission

router = APIRouter(tags=["admin-cases"])


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


async def _unique_slug(db: AsyncSession, base_slug: str, exclude_id: Optional[int] = None) -> str:
    slug = base_slug
    counter = 1
    while True:
        query = select(CaseStudy).where(CaseStudy.slug == slug)
        if exclude_id:
            query = query.where(CaseStudy.id != exclude_id)
        existing = await db.scalar(query)
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


class CaseMetric(BaseModel):
    metric_ru: str = Field(..., min_length=1)
    metric_en: str = Field(..., min_length=1)
    value: str = Field(..., min_length=1)
    improvement_ru: str = Field(..., min_length=1)
    improvement_en: str = Field(..., min_length=1)


class CaseStudyCreate(BaseModel):
    title_ru: str = Field(..., min_length=1, max_length=255)
    title_en: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    client_company: Optional[str] = Field(None, max_length=255)
    industry_ru: str = Field(..., min_length=1, max_length=255)
    industry_en: str = Field(..., min_length=1, max_length=255)
    challenge_ru: str = Field(..., min_length=1)
    challenge_en: str = Field(..., min_length=1)
    solution_ru: str = Field(..., min_length=1)
    solution_en: str = Field(..., min_length=1)
    results: List[CaseMetric] = Field(default_factory=list)
    roi: Optional[str] = Field(None, max_length=100)
    time_saved: Optional[str] = Field(None, max_length=100)
    testimonial_ru: Optional[str] = None
    testimonial_en: Optional[str] = None
    featured_image: Optional[str] = Field(None, max_length=500)
    status: str = Field("draft", pattern="^(draft|published|archived)$")
    is_featured: bool = False
    sort_order: int = 0


class CaseStudyUpdate(BaseModel):
    title_ru: Optional[str] = Field(None, min_length=1, max_length=255)
    title_en: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    client_company: Optional[str] = Field(None, max_length=255)
    industry_ru: Optional[str] = Field(None, min_length=1, max_length=255)
    industry_en: Optional[str] = Field(None, min_length=1, max_length=255)
    challenge_ru: Optional[str] = None
    challenge_en: Optional[str] = None
    solution_ru: Optional[str] = None
    solution_en: Optional[str] = None
    results: Optional[List[CaseMetric]] = None
    roi: Optional[str] = Field(None, max_length=100)
    time_saved: Optional[str] = Field(None, max_length=100)
    testimonial_ru: Optional[str] = None
    testimonial_en: Optional[str] = None
    featured_image: Optional[str] = Field(None, max_length=500)
    status: Optional[str] = Field(None, pattern="^(draft|published|archived)$")
    is_featured: Optional[bool] = None
    sort_order: Optional[int] = None


class CaseStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|published|archived)$")


class CaseReorderItem(BaseModel):
    id: int
    sort_order: int


class CaseReorderPayload(BaseModel):
    items: List[CaseReorderItem]


class CaseBulkDeletePayload(BaseModel):
    ids: List[int] = Field(default_factory=list)


def _normalize_case_payload(values: Dict[str, Any]) -> Dict[str, Any]:
    normalized = dict(values)
    for key in [
        "title_ru",
        "title_en",
        "industry_ru",
        "industry_en",
        "challenge_ru",
        "challenge_en",
        "solution_ru",
        "solution_en",
        "testimonial_ru",
        "testimonial_en",
        "client_company",
        "roi",
        "time_saved",
        "featured_image",
    ]:
        if key in normalized and isinstance(normalized[key], str):
            normalized[key] = normalized[key].strip()
    return normalized


def _validate_required_bilingual(values: Dict[str, Any], existing: Optional[CaseStudy] = None) -> Dict[str, str]:
    def resolve(field: str) -> str:
        candidate = values.get(field)
        if candidate is None and existing is not None:
            candidate = getattr(existing, field)
        return (candidate or "").strip()

    required = {
        "title_ru": resolve("title_ru"),
        "title_en": resolve("title_en"),
        "industry_ru": resolve("industry_ru"),
        "industry_en": resolve("industry_en"),
        "challenge_ru": resolve("challenge_ru"),
        "challenge_en": resolve("challenge_en"),
        "solution_ru": resolve("solution_ru"),
        "solution_en": resolve("solution_en"),
    }
    missing = [field for field, value in required.items() if not value]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required fields: {', '.join(missing)}")
    return required


def _validate_metrics(metrics: List[CaseMetric]) -> List[Dict[str, str]]:
    normalized = []
    for idx, metric in enumerate(metrics):
        row = {
            "metric_ru": metric.metric_ru.strip(),
            "metric_en": metric.metric_en.strip(),
            "value": metric.value.strip(),
            "improvement_ru": metric.improvement_ru.strip(),
            "improvement_en": metric.improvement_en.strip(),
        }
        if not all(row.values()):
            raise HTTPException(status_code=400, detail=f"Invalid metric at index {idx}")
        normalized.append(row)
    return normalized


def _admin_case_payload(case: CaseStudy) -> Dict[str, Any]:
    return {
        "id": case.id,
        "slug": case.slug,
        "title_ru": case.title_ru,
        "title_en": case.title_en,
        "client_company": case.client_company,
        "industry_ru": case.industry_ru,
        "industry_en": case.industry_en,
        "challenge_ru": case.challenge_ru,
        "challenge_en": case.challenge_en,
        "solution_ru": case.solution_ru,
        "solution_en": case.solution_en,
        "results": case.results or [],
        "roi": case.roi,
        "time_saved": case.time_saved,
        "testimonial_ru": case.testimonial_ru,
        "testimonial_en": case.testimonial_en,
        "featured_image": case.featured_image,
        "status": case.status,
        "is_featured": case.is_featured,
        "sort_order": case.sort_order,
        "published_at": case.published_at.isoformat() if case.published_at else None,
        "created_at": case.created_at.isoformat() if case.created_at else None,
        "updated_at": case.updated_at.isoformat() if case.updated_at else None,
    }


@router.get("/cases", dependencies=[Depends(require_permission("can_manage_cases"))])
async def list_cases(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(draft|published|archived)$"),
    search: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    query = select(CaseStudy)
    conditions = []
    if status:
        conditions.append(CaseStudy.status == status)
    if search:
        term = f"%{search}%"
        conditions.append(
            or_(
                CaseStudy.title_ru.ilike(term),
                CaseStudy.title_en.ilike(term),
                CaseStudy.client_company.ilike(term),
                CaseStudy.industry_ru.ilike(term),
                CaseStudy.industry_en.ilike(term),
            )
        )
    if conditions:
        query = query.where(and_(*conditions))

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    rows = await db.execute(
        query.order_by(CaseStudy.is_featured.desc(), CaseStudy.sort_order.asc(), CaseStudy.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = rows.scalars().all()
    return {"total": total, "skip": skip, "limit": limit, "items": [_admin_case_payload(c) for c in items]}


@router.get("/cases/{case_id}", dependencies=[Depends(require_permission("can_manage_cases"))])
async def get_case(
    case_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    case = await db.get(CaseStudy, case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    return _admin_case_payload(case)


@router.post("/cases", status_code=201, dependencies=[Depends(require_permission("can_manage_cases"))])
async def create_case(
    data: CaseStudyCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    payload = _normalize_case_payload(data.model_dump())
    required = _validate_required_bilingual(payload)
    metrics = _validate_metrics(data.results)

    base_slug = payload.get("slug") or _slugify(required["title_en"])
    slug = await _unique_slug(db, base_slug)
    published_at = datetime.utcnow() if payload.get("status") == "published" else None

    case = CaseStudy(
        slug=slug,
        title_ru=required["title_ru"],
        title_en=required["title_en"],
        client_company=payload.get("client_company"),
        industry_ru=required["industry_ru"],
        industry_en=required["industry_en"],
        challenge_ru=required["challenge_ru"],
        challenge_en=required["challenge_en"],
        solution_ru=required["solution_ru"],
        solution_en=required["solution_en"],
        results=metrics,
        roi=payload.get("roi"),
        time_saved=payload.get("time_saved"),
        testimonial_ru=payload.get("testimonial_ru"),
        testimonial_en=payload.get("testimonial_en"),
        featured_image=payload.get("featured_image"),
        status=payload.get("status") or "draft",
        is_featured=bool(payload.get("is_featured")),
        sort_order=int(payload.get("sort_order") or 0),
        published_at=published_at,
    )
    db.add(case)
    await db.commit()
    await db.refresh(case)
    return {"id": case.id, "slug": case.slug, "message": "Case created successfully"}


@router.put("/cases/{case_id}", dependencies=[Depends(require_permission("can_manage_cases"))])
async def update_case(
    case_id: int,
    data: CaseStudyUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    case = await db.get(CaseStudy, case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    payload = _normalize_case_payload(data.model_dump(exclude_unset=True))
    required = _validate_required_bilingual(payload, existing=case)

    if "slug" in payload and payload.get("slug"):
        payload["slug"] = await _unique_slug(db, _slugify(payload["slug"]), exclude_id=case_id)
    elif "title_en" in payload:
        payload["slug"] = await _unique_slug(db, _slugify(required["title_en"]), exclude_id=case_id)

    if payload.get("results") is not None and data.results is not None:
        payload["results"] = _validate_metrics(data.results)

    if payload.get("status") == "published" and case.published_at is None:
        payload["published_at"] = datetime.utcnow()

    payload["title_ru"] = required["title_ru"]
    payload["title_en"] = required["title_en"]
    payload["industry_ru"] = required["industry_ru"]
    payload["industry_en"] = required["industry_en"]
    payload["challenge_ru"] = required["challenge_ru"]
    payload["challenge_en"] = required["challenge_en"]
    payload["solution_ru"] = required["solution_ru"]
    payload["solution_en"] = required["solution_en"]

    for field, value in payload.items():
        setattr(case, field, value)

    await db.commit()
    await db.refresh(case)
    return {"id": case.id, "slug": case.slug, "message": "Case updated successfully"}


@router.delete("/cases/{case_id}", dependencies=[Depends(require_permission("can_manage_cases"))])
async def delete_case(
    case_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    case = await db.get(CaseStudy, case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    await db.delete(case)
    await db.commit()
    return {"id": case_id, "message": "Case deleted"}


@router.patch("/cases/{case_id}/status", dependencies=[Depends(require_permission("can_manage_cases"))])
async def update_case_status(
    case_id: int,
    data: CaseStatusUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    case = await db.get(CaseStudy, case_id)
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")
    case.status = data.status
    if data.status == "published" and case.published_at is None:
        case.published_at = datetime.utcnow()
    await db.commit()
    return {"id": case_id, "status": case.status, "message": "Status updated"}


@router.post("/cases/reorder", dependencies=[Depends(require_permission("can_manage_cases"))])
async def reorder_cases(
    payload: CaseReorderPayload,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if not payload.items:
        return {"message": "No items to reorder"}

    ids = [item.id for item in payload.items]
    rows = await db.execute(select(CaseStudy).where(CaseStudy.id.in_(ids)))
    cases_by_id = {case.id: case for case in rows.scalars().all()}

    for item in payload.items:
        case = cases_by_id.get(item.id)
        if case:
            case.sort_order = item.sort_order

    await db.commit()
    return {"message": "Reordered"}


@router.post("/cases/bulk-delete", dependencies=[Depends(require_permission("can_manage_cases"))])
async def bulk_delete_cases(
    payload: CaseBulkDeletePayload,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    ids = [case_id for case_id in payload.ids if isinstance(case_id, int)]
    if not ids:
        raise HTTPException(status_code=400, detail="ids is required")

    rows = await db.execute(select(CaseStudy).where(CaseStudy.id.in_(ids)))
    cases = rows.scalars().all()
    for case in cases:
        await db.delete(case)
    await db.commit()
    return {"deleted": len(cases), "ids": [case.id for case in cases]}
