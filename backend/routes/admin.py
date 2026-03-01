from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_, delete
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import csv
import io
import json
import secrets
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from database.config import get_async_db
from models.admin import AdminUser, AuditConfiguration, RoleTemplate, SystemSettings
from models.analytics import AnalyticsGoal
from models.audit import Audit, AuditResult, PDFReport
from models.contact import (
    ContactInquiry,
    ContactNote,
    ContactTask,
    ContactActivity,
    EmailTemplate,
)
from models.blog import BlogPost
from models.media import MediaFile
from services.auth_service import AuthService
from services.analytics_service import AnalyticsService
from services.email_service import EmailService

router = APIRouter(tags=["admin"])
security = HTTPBearer()

ROLE_PATTERN = r"^(admin|super_admin|analyst|editor|author|moderator)$"
PERMISSION_FIELDS = [
    "can_manage_audits",
    "can_manage_users",
    "can_view_analytics",
    "can_export_data",
    "can_manage_content",
    "can_read_audits",
    "can_write_audits",
    "can_delete_audits",
    "can_read_contacts",
    "can_write_contacts",
    "can_delete_contacts",
    "can_publish_content",
    "can_manage_cases",
    "skip_email_verification",
]
PERMISSION_FALLBACKS = {
    "can_read_audits": ("can_manage_audits",),
    "can_write_audits": ("can_manage_audits",),
    "can_delete_audits": ("can_manage_audits",),
    "can_read_contacts": ("can_manage_audits",),
    "can_write_contacts": ("can_manage_audits",),
    "can_delete_contacts": ("can_manage_audits",),
    "can_publish_content": ("can_manage_content",),
    "can_manage_cases": ("can_manage_content",),
    # Legacy aliases to keep backward compatibility during rollout
    "can_manage_audits": ("can_read_audits", "can_write_audits", "can_delete_audits"),
    "can_manage_content": ("can_publish_content", "can_manage_cases"),
}


def _default_configuration_payload() -> Dict[str, Any]:
    return {
        "ai_model": "gpt-4",
        "analysis_depth": "standard",
        "include_roi_analysis": True,
        "include_risk_assessment": True,
        "include_implementation_roadmap": True,
        "pdf_template": "default",
        "auto_generate_pdf": True,
        "pdf_generation_enabled": True,
        "auto_send_reports": False,
        "notification_settings": {
            "email_on_completion": True,
            "slack_notifications": False,
            "new_submissions": True,
            "weekly_reports": False,
            "completion_alerts": True
        },
        "custom_prompts": None
    }


def _extract_configuration_metadata(config: AuditConfiguration) -> Dict[str, Any]:
    defaults = _default_configuration_payload()

    if not config.description:
        return defaults

    try:
        metadata = json.loads(config.description)
    except (TypeError, json.JSONDecodeError):
        return defaults

    if not isinstance(metadata, dict):
        return defaults

    merged = defaults.copy()
    merged.update({key: value for key, value in metadata.items() if key in defaults})

    notification_settings = defaults["notification_settings"].copy()
    raw_notification_settings = metadata.get("notification_settings")
    if isinstance(raw_notification_settings, dict):
        notification_settings.update(raw_notification_settings)
    merged["notification_settings"] = notification_settings

    return merged

# Pydantic models for request/response
class AdminLoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)

class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str
    expires_in: int
    user_info: Dict[str, Any]
    user: Optional[Dict[str, Any]] = None  # alias for frontend compat

class AdminUserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: str
    is_active: bool
    last_login: Optional[datetime]
    created_at: datetime

class AuditConfigurationRequest(BaseModel):
    ai_model: str = Field(..., max_length=50)
    analysis_depth: str = Field(..., max_length=20)  # basic, standard, comprehensive
    include_roi_analysis: bool = Field(True)
    include_risk_assessment: bool = Field(True)
    include_implementation_roadmap: bool = Field(True)
    pdf_template: str = Field(..., max_length=50)
    auto_generate_pdf: bool = Field(True)
    notification_settings: Dict[str, bool] = Field(default_factory=dict)
    custom_prompts: Optional[Dict[str, str]] = Field(None)

class DashboardStatsResponse(BaseModel):
    total_audits: int
    audits_this_month: int
    total_contacts: int
    contacts_this_month: int
    total_blog_posts: int
    published_posts: int
    average_audit_score: float
    conversion_rate: float
    recent_activities: List[Dict[str, Any]]

class AuditManagementResponse(BaseModel):
    audit_id: str
    company_name: str
    contact_name: Optional[str]
    email: str
    phone: Optional[str]
    status: str
    maturity_score: Optional[int]
    estimated_roi: Optional[float]
    submitted_at: datetime
    industry: str
    company_size: str

# ── RBAC dependency factory ────────────────────────────────────────────────
def _has_direct_permission(user: AdminUser, permission: str) -> bool:
    return bool(getattr(user, permission, False))


def has_permission(user: AdminUser, permission: str) -> bool:
    if user.role == "super_admin":
        return True
    if _has_direct_permission(user, permission):
        return True
    for alias in PERMISSION_FALLBACKS.get(permission, ()):
        if _has_direct_permission(user, alias):
            return True
    return False


def _assert_permission(user: AdminUser, permission: str) -> None:
    if not has_permission(user, permission):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Permission denied: '{permission}' required",
        )


def require_permission(permission: str):
    """Return a FastAPI dependency that enforces a specific permission."""

    async def _check(
        current_user: AdminUser = Depends(get_current_admin_user)
    ) -> AdminUser:
        _assert_permission(current_user, permission)
        return current_user

    return _check


# ── Authentication dependency ───────────────────────────────────────────────
async def get_current_admin_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_async_db)
) -> AdminUser:
    """
    Verify JWT token and return current admin user
    """
    auth_service = AuthService()
    try:
        payload = auth_service.verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )

        try:
            user_db_id = int(user_id)
        except (TypeError, ValueError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        user = await db.get(AdminUser, user_db_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        return user
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

class RefreshTokenRequest(BaseModel):
    refresh_token: str


@router.post("/refresh")
async def refresh_token(body: RefreshTokenRequest):
    """Generate new access token using refresh token."""
    auth_service = AuthService()
    return await auth_service.refresh_access_token(body.refresh_token)


@router.get("/me")
async def get_me(current_user: AdminUser = Depends(get_current_admin_user)):
    """Return current user info."""
    full_name = " ".join(p for p in [current_user.first_name, current_user.last_name] if p).strip() or current_user.username
    permissions = {field: bool(getattr(current_user, field, False)) for field in PERMISSION_FIELDS}
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": full_name,
        "role": current_user.role,
        **permissions,
        "last_login": current_user.last_login,
    }


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    login_data: AdminLoginRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Admin user login with account lockout after 5 failed attempts.
    """
    try:
        auth_service = AuthService()

        # Find user by username OR email
        query = select(AdminUser).where(
            (AdminUser.username == login_data.username) | (AdminUser.email == login_data.username)
        )
        result = await db.execute(query)
        user = result.scalar_one_or_none()

        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

        if not user.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account is disabled")

        # Check account lockout
        if user.locked_until and user.locked_until > datetime.utcnow():
            locked_until_str = user.locked_until.strftime("%H:%M:%S")
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail=f"Account locked until {locked_until_str} due to too many failed attempts",
            )

        # Verify password
        if not auth_service.verify_password(login_data.password, user.hashed_password):
            user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
            if user.failed_login_attempts >= 5:
                user.locked_until = datetime.utcnow() + timedelta(minutes=30)
                await db.commit()
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Account locked for 30 minutes after 5 failed login attempts",
                )
            await db.commit()
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid username or password ({5 - user.failed_login_attempts} attempts remaining)",
            )

        # Successful login — reset lockout counters
        user.failed_login_attempts = 0
        user.locked_until = None
        user.last_login = datetime.utcnow()
        await db.commit()

        # Generate tokens
        access_token = auth_service.create_access_token(
            data={"sub": user.id, "username": user.username, "role": user.role}
        )
        refresh_token_value = auth_service.create_refresh_token(
            data={"sub": user.id, "username": user.username}
        )

        full_name = " ".join(part for part in [user.first_name, user.last_name] if part).strip() or user.username
        permissions = {field: bool(getattr(user, field, False)) for field in PERMISSION_FIELDS}
        user_payload = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": full_name,
            "role": user.role,
            **permissions,
            "last_login": user.last_login.isoformat() if user.last_login else None,
        }

        return AdminLoginResponse(
            access_token=access_token,
            refresh_token=refresh_token_value,
            token_type="bearer",
            expires_in=3600,
            user_info=user_payload,
            user=user_payload
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/dashboard", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get dashboard statistics
    """
    try:
        analytics_service = AnalyticsService()
        
        # Calculate date ranges
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get audit statistics
        total_audits_query = select(func.count(Audit.id))
        total_audits_result = await db.execute(total_audits_query)
        total_audits = total_audits_result.scalar()
        
        audits_this_month_query = select(func.count(Audit.id)).where(Audit.created_at >= month_start)
        audits_this_month_result = await db.execute(audits_this_month_query)
        audits_this_month = audits_this_month_result.scalar()
        
        # Get contact statistics
        total_contacts_query = select(func.count(ContactInquiry.id))
        total_contacts_result = await db.execute(total_contacts_query)
        total_contacts = total_contacts_result.scalar()
        
        contacts_this_month_query = select(func.count(ContactInquiry.id)).where(ContactInquiry.created_at >= month_start)
        contacts_this_month_result = await db.execute(contacts_this_month_query)
        contacts_this_month = contacts_this_month_result.scalar()
        
        # Get blog statistics
        total_blog_posts_query = select(func.count(BlogPost.id))
        total_blog_posts_result = await db.execute(total_blog_posts_query)
        total_blog_posts = total_blog_posts_result.scalar()
        
        published_posts_query = select(func.count(BlogPost.id)).where(BlogPost.status == "published")
        published_posts_result = await db.execute(published_posts_query)
        published_posts = published_posts_result.scalar()
        
        # Calculate average audit score
        avg_score_query = select(func.avg(AuditResult.maturity_score))
        avg_score_result = await db.execute(avg_score_query)
        average_audit_score = avg_score_result.scalar() or 0
        
        # Calculate conversion rate (audits to contacts)
        conversion_rate = (total_contacts / total_audits * 100) if total_audits > 0 else 0
        
        # Get recent activities
        recent_activities = await analytics_service.get_recent_activities(db, limit=10)
        
        return DashboardStatsResponse(
            total_audits=total_audits,
            audits_this_month=audits_this_month,
            total_contacts=total_contacts,
            contacts_this_month=contacts_this_month,
            total_blog_posts=total_blog_posts,
            published_posts=published_posts,
            average_audit_score=round(average_audit_score, 1),
            conversion_rate=round(conversion_rate, 2),
            recent_activities=recent_activities
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get dashboard stats: {str(e)}"
        )

@router.get("/audits", response_model=List[AuditManagementResponse], dependencies=[Depends(require_permission("can_read_audits"))])
async def get_audits_management(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get audits for management with filtering and search
    """
    try:
        query = select(Audit)
        
        # Apply filters
        if status_filter:
            query = query.where(Audit.status == status_filter)
        
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Audit.company_name.ilike(search_term),
                    Audit.contact_email.ilike(search_term),
                    Audit.industry.ilike(search_term)
                )
            )
        
        query = query.offset(skip).limit(limit).order_by(Audit.created_at.desc())
        
        result = await db.execute(query)
        audits = result.scalars().all()
        
        # Get audit results for maturity scores and estimated savings
        audit_results = {}
        if audits:
            audit_ids = [audit.id for audit in audits]
            results_query = select(AuditResult).where(AuditResult.audit_id.in_(audit_ids))
            results_result = await db.execute(results_query)
            for ar in results_result.scalars().all():
                audit_results[ar.audit_id] = {
                    "maturity_score": ar.maturity_score,
                    "estimated_savings": ar.estimated_savings
                }

        return [
            AuditManagementResponse(
                audit_id=str(audit.id),
                company_name=audit.company_name,
                contact_name=audit.contact_name,
                email=audit.contact_email,
                phone=audit.phone,
                status=audit.status,
                maturity_score=audit_results.get(audit.id, {}).get("maturity_score"),
                estimated_roi=audit_results.get(audit.id, {}).get("estimated_savings"),
                submitted_at=audit.created_at,
                industry=audit.industry,
                company_size=audit.company_size
            )
            for audit in audits
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get audits: {str(e)}"
        )

PIPELINE_STAGES = ["new", "contacted", "qualified", "converted", "closed"]


def _parse_tags(raw_tags: Optional[str]) -> List[str]:
    if not raw_tags:
        return []
    return [t.strip() for t in raw_tags.split(",") if t.strip()]


def _stringify_tags(tags: Optional[List[str]]) -> Optional[str]:
    if tags is None:
        return None
    cleaned = [t.strip() for t in tags if isinstance(t, str) and t.strip()]
    return ",".join(cleaned) if cleaned else None


def _contact_payload(contact: ContactInquiry) -> Dict[str, Any]:
    return {
        "inquiry_id": str(contact.id),
        "id": contact.id,
        "name": contact.name,
        "email": contact.email,
        "company": contact.company,
        "inquiry_type": contact.inquiry_type,
        "subject": contact.subject,
        "source": contact.source,
        "status": contact.status,
        "priority": contact.priority,
        "pipeline_stage": contact.pipeline_stage or "new",
        "score": contact.score or 0,
        "tags": _parse_tags(contact.tags),
        "assigned_to": contact.assigned_to,
        "created_at": contact.created_at.isoformat() if contact.created_at else None,
        "response_sent": contact.status in {"responded", "closed"},
    }


async def _log_contact_activity(
    db: AsyncSession,
    contact_id: int,
    activity_type: str,
    message: str,
    created_by: Optional[str],
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    db.add(
        ContactActivity(
            contact_id=contact_id,
            activity_type=activity_type,
            message=message,
            created_by=created_by,
            metadata_json=metadata or None,
        )
    )


@router.get("/contacts", dependencies=[Depends(require_permission("can_read_contacts"))])
async def get_contacts_management(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    inquiry_type_filter: Optional[str] = Query(None),
    pipeline_stage: Optional[str] = Query(None, pattern="^(new|contacted|qualified|converted|closed)$"),
    date_from: Optional[str] = Query(None, description="ISO date string, e.g. 2026-01-01"),
    date_to: Optional[str] = Query(None, description="ISO date string, e.g. 2026-12-31"),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get contact inquiries for management
    """
    try:
        query = select(ContactInquiry)

        if status_filter:
            query = query.where(ContactInquiry.status == status_filter)

        if inquiry_type_filter:
            query = query.where(ContactInquiry.inquiry_type == inquiry_type_filter)

        if pipeline_stage:
            query = query.where(ContactInquiry.pipeline_stage == pipeline_stage)

        if date_from:
            try:
                dt_from = datetime.fromisoformat(date_from)
                query = query.where(ContactInquiry.created_at >= dt_from)
            except ValueError:
                pass

        if date_to:
            try:
                dt_to = datetime.fromisoformat(date_to)
                query = query.where(ContactInquiry.created_at <= dt_to)
            except ValueError:
                pass

        query = query.offset(skip).limit(limit).order_by(ContactInquiry.created_at.desc())
        
        result = await db.execute(query)
        contacts = result.scalars().all()
        
        return [_contact_payload(contact) for contact in contacts]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get contacts: {str(e)}"
        )


@router.get("/contacts/pipeline", dependencies=[Depends(require_permission("can_read_contacts"))])
async def get_contacts_pipeline(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    rows = await db.execute(
        select(ContactInquiry).order_by(ContactInquiry.score.desc(), ContactInquiry.created_at.desc())
    )
    contacts = rows.scalars().all()
    columns: Dict[str, List[Dict[str, Any]]] = {stage: [] for stage in PIPELINE_STAGES}
    for contact in contacts:
        stage = contact.pipeline_stage if contact.pipeline_stage in columns else "new"
        columns[stage].append(_contact_payload(contact))
    return {
        "stages": PIPELINE_STAGES,
        "columns": [{"stage": stage, "count": len(columns[stage]), "items": columns[stage]} for stage in PIPELINE_STAGES],
    }


@router.get("/contacts/{contact_id}", dependencies=[Depends(require_permission("can_read_contacts"))])
async def get_contact_detail(
    contact_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Get a single contact inquiry with full details."""
    contact = await db.get(ContactInquiry, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    return {
        "id": contact.id,
        "name": contact.name,
        "email": contact.email,
        "phone": contact.phone,
        "company": contact.company,
        "position": contact.position,
        "inquiry_type": contact.inquiry_type,
        "subject": contact.subject,
        "message": contact.message,
        "priority": contact.priority,
        "status": contact.status,
        "pipeline_stage": contact.pipeline_stage or "new",
        "score": contact.score or 0,
        "tags": _parse_tags(contact.tags),
        "assigned_to": contact.assigned_to,
        "source": contact.source,
        "preferred_contact_method": contact.preferred_contact_method,
        "budget_range": contact.budget_range,
        "timeline": contact.timeline,
        "is_newsletter_subscribed": contact.is_newsletter_subscribed,
        "is_gdpr_compliant": contact.is_gdpr_compliant,
        "is_spam": contact.is_spam,
        "utm_source": contact.utm_source,
        "utm_medium": contact.utm_medium,
        "utm_campaign": contact.utm_campaign,
        "created_at": contact.created_at.isoformat() if contact.created_at else None,
        "updated_at": contact.updated_at.isoformat() if contact.updated_at else None,
        "contacted_at": contact.contacted_at.isoformat() if contact.contacted_at else None,
    }


class ContactUpdate(BaseModel):
    status: Optional[str] = Field(None, pattern="^(new|contacted|qualified|converted|closed)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    assigned_to: Optional[str] = None
    is_spam: Optional[bool] = None
    tags: Optional[List[str]] = None
    score: Optional[int] = Field(None, ge=0, le=100)
    pipeline_stage: Optional[str] = Field(None, pattern="^(new|contacted|qualified|converted|closed)$")


@router.patch("/contacts/{contact_id}", dependencies=[Depends(require_permission("can_write_contacts"))])
async def update_contact(
    contact_id: int,
    data: ContactUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Update status/priority/assignment of a contact inquiry."""
    contact = await db.get(ContactInquiry, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")

    update_data = data.model_dump(exclude_unset=True)
    previous = {
        "status": contact.status,
        "priority": contact.priority,
        "assigned_to": contact.assigned_to,
        "score": contact.score,
        "pipeline_stage": contact.pipeline_stage,
        "tags": _parse_tags(contact.tags),
    }

    if "tags" in update_data:
        update_data["tags"] = _stringify_tags(update_data["tags"])

    # When marking as contacted, record timestamp
    if update_data.get("status") == "contacted" and contact.status == "new":
        contact.contacted_at = datetime.utcnow()
    if "status" in update_data and "pipeline_stage" not in update_data:
        update_data["pipeline_stage"] = update_data["status"]

    for field, value in update_data.items():
        setattr(contact, field, value)

    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type="contact_updated",
        message="Contact fields updated",
        created_by=current_user.username,
        metadata={"before": previous, "after": data.model_dump(exclude_unset=True)},
    )
    await db.commit()
    return {"id": contact_id, "message": "Contact updated"}


class ContactBulkIds(BaseModel):
    ids: List[int] = Field(default_factory=list)


class ContactBulkStatus(BaseModel):
    ids: List[int] = Field(default_factory=list)
    status: str = Field(..., pattern="^(new|contacted|qualified|converted|closed)$")


class ContactBulkAssign(BaseModel):
    ids: List[int] = Field(default_factory=list)
    assigned_to: Optional[str] = None


@router.post("/contacts/bulk-delete", dependencies=[Depends(require_permission("can_delete_contacts"))])
async def bulk_delete_contacts(
    payload: ContactBulkIds,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    ids = sorted({contact_id for contact_id in payload.ids if isinstance(contact_id, int)})
    if not ids:
        raise HTTPException(status_code=400, detail="ids is required")

    rows = await db.execute(select(ContactInquiry).where(ContactInquiry.id.in_(ids)))
    contacts = rows.scalars().all()
    for contact in contacts:
        await db.execute(delete(ContactNote).where(ContactNote.contact_id == contact.id))
        await db.execute(delete(ContactTask).where(ContactTask.contact_id == contact.id))
        await db.execute(delete(ContactActivity).where(ContactActivity.contact_id == contact.id))
        await db.delete(contact)
    await db.commit()
    return {"deleted": len(contacts), "ids": [contact.id for contact in contacts]}


@router.post("/contacts/bulk-status", dependencies=[Depends(require_permission("can_write_contacts"))])
async def bulk_update_contact_status(
    payload: ContactBulkStatus,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    ids = sorted({contact_id for contact_id in payload.ids if isinstance(contact_id, int)})
    if not ids:
        raise HTTPException(status_code=400, detail="ids is required")
    rows = await db.execute(select(ContactInquiry).where(ContactInquiry.id.in_(ids)))
    contacts = rows.scalars().all()
    for contact in contacts:
        if payload.status == "contacted" and contact.status == "new":
            contact.contacted_at = datetime.utcnow()
        contact.status = payload.status
        contact.pipeline_stage = payload.status
        await _log_contact_activity(
            db=db,
            contact_id=contact.id,
            activity_type="bulk_status_update",
            message=f"Status changed to {payload.status}",
            created_by=current_user.username,
        )
    await db.commit()
    return {"updated": len(contacts), "status": payload.status}


@router.post("/contacts/bulk-assign", dependencies=[Depends(require_permission("can_write_contacts"))])
async def bulk_assign_contacts(
    payload: ContactBulkAssign,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    ids = sorted({contact_id for contact_id in payload.ids if isinstance(contact_id, int)})
    if not ids:
        raise HTTPException(status_code=400, detail="ids is required")
    rows = await db.execute(select(ContactInquiry).where(ContactInquiry.id.in_(ids)))
    contacts = rows.scalars().all()
    for contact in contacts:
        contact.assigned_to = (payload.assigned_to or "").strip() or None
        await _log_contact_activity(
            db=db,
            contact_id=contact.id,
            activity_type="bulk_assigned",
            message=f"Assigned to {contact.assigned_to or 'nobody'}",
            created_by=current_user.username,
        )
    await db.commit()
    return {"updated": len(contacts), "assigned_to": (payload.assigned_to or "").strip() or None}


@router.delete("/contacts/{contact_id}", status_code=204, dependencies=[Depends(require_permission("can_delete_contacts"))])
async def delete_contact(
    contact_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Permanently delete a contact inquiry."""
    contact = await db.get(ContactInquiry, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    await db.execute(delete(ContactNote).where(ContactNote.contact_id == contact_id))
    await db.execute(delete(ContactTask).where(ContactTask.contact_id == contact_id))
    await db.execute(delete(ContactActivity).where(ContactActivity.contact_id == contact_id))
    await db.delete(contact)
    await db.commit()


class ContactNoteCreate(BaseModel):
    note: str = Field(..., min_length=1)


class ContactNoteUpdate(BaseModel):
    note: str = Field(..., min_length=1)


class ContactTaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: str = Field("todo", pattern="^(todo|in_progress|done)$")
    priority: str = Field("medium", pattern="^(low|medium|high|urgent)$")
    assigned_to: Optional[str] = None


class ContactTaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    status: Optional[str] = Field(None, pattern="^(todo|in_progress|done)$")
    priority: Optional[str] = Field(None, pattern="^(low|medium|high|urgent)$")
    assigned_to: Optional[str] = None


class ContactActivityCreate(BaseModel):
    activity_type: str = Field(..., min_length=1, max_length=50)
    message: str = Field(..., min_length=1)
    metadata: Optional[Dict[str, Any]] = None


@router.get("/contacts/{contact_id}/notes", dependencies=[Depends(require_permission("can_read_contacts"))])
async def list_contact_notes(
    contact_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if not await db.get(ContactInquiry, contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    rows = await db.execute(
        select(ContactNote).where(ContactNote.contact_id == contact_id).order_by(ContactNote.created_at.desc())
    )
    notes = rows.scalars().all()
    return [
        {
            "id": n.id,
            "note": n.note,
            "created_by": n.created_by,
            "created_at": n.created_at.isoformat() if n.created_at else None,
            "updated_at": n.updated_at.isoformat() if n.updated_at else None,
        }
        for n in notes
    ]


@router.post("/contacts/{contact_id}/notes", status_code=201, dependencies=[Depends(require_permission("can_write_contacts"))])
async def create_contact_note(
    contact_id: int,
    payload: ContactNoteCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if not await db.get(ContactInquiry, contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    note = ContactNote(
        contact_id=contact_id,
        note=payload.note.strip(),
        created_by=current_user.username,
    )
    db.add(note)
    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type="note_added",
        message="Added a note",
        created_by=current_user.username,
    )
    await db.commit()
    await db.refresh(note)
    return {"id": note.id, "message": "Note created"}


@router.put("/contacts/{contact_id}/notes/{note_id}", dependencies=[Depends(require_permission("can_write_contacts"))])
async def update_contact_note(
    contact_id: int,
    note_id: int,
    payload: ContactNoteUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    note = await db.get(ContactNote, note_id)
    if not note or note.contact_id != contact_id:
        raise HTTPException(status_code=404, detail="Note not found")
    note.note = payload.note.strip()
    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type="note_updated",
        message="Updated a note",
        created_by=current_user.username,
    )
    await db.commit()
    return {"id": note.id, "message": "Note updated"}


@router.delete("/contacts/{contact_id}/notes/{note_id}", dependencies=[Depends(require_permission("can_write_contacts"))])
async def delete_contact_note(
    contact_id: int,
    note_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    note = await db.get(ContactNote, note_id)
    if not note or note.contact_id != contact_id:
        raise HTTPException(status_code=404, detail="Note not found")
    await db.delete(note)
    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type="note_deleted",
        message="Deleted a note",
        created_by=current_user.username,
    )
    await db.commit()
    return {"id": note_id, "message": "Note deleted"}


@router.get("/contacts/{contact_id}/tasks", dependencies=[Depends(require_permission("can_read_contacts"))])
async def list_contact_tasks(
    contact_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if not await db.get(ContactInquiry, contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    rows = await db.execute(
        select(ContactTask).where(ContactTask.contact_id == contact_id).order_by(ContactTask.created_at.desc())
    )
    tasks = rows.scalars().all()
    return [
        {
            "id": t.id,
            "title": t.title,
            "description": t.description,
            "due_date": t.due_date.isoformat() if t.due_date else None,
            "status": t.status,
            "priority": t.priority,
            "assigned_to": t.assigned_to,
            "completed_at": t.completed_at.isoformat() if t.completed_at else None,
            "created_by": t.created_by,
            "created_at": t.created_at.isoformat() if t.created_at else None,
            "updated_at": t.updated_at.isoformat() if t.updated_at else None,
        }
        for t in tasks
    ]


@router.post("/contacts/{contact_id}/tasks", status_code=201, dependencies=[Depends(require_permission("can_write_contacts"))])
async def create_contact_task(
    contact_id: int,
    payload: ContactTaskCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if not await db.get(ContactInquiry, contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    task = ContactTask(
        contact_id=contact_id,
        title=payload.title.strip(),
        description=(payload.description or "").strip() or None,
        due_date=payload.due_date,
        status=payload.status,
        priority=payload.priority,
        assigned_to=(payload.assigned_to or "").strip() or None,
        created_by=current_user.username,
    )
    if payload.status == "done":
        task.completed_at = datetime.utcnow()
    db.add(task)
    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type="task_added",
        message=f"Added task: {task.title}",
        created_by=current_user.username,
    )
    await db.commit()
    await db.refresh(task)
    return {"id": task.id, "message": "Task created"}


@router.patch("/contacts/{contact_id}/tasks/{task_id}", dependencies=[Depends(require_permission("can_write_contacts"))])
async def update_contact_task(
    contact_id: int,
    task_id: int,
    payload: ContactTaskUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    task = await db.get(ContactTask, task_id)
    if not task or task.contact_id != contact_id:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "title" and isinstance(value, str):
            value = value.strip()
        if field in {"description", "assigned_to"} and isinstance(value, str):
            value = value.strip() or None
        setattr(task, field, value)
    if update_data.get("status") == "done":
        task.completed_at = datetime.utcnow()
    elif "status" in update_data and update_data.get("status") != "done":
        task.completed_at = None
    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type="task_updated",
        message=f"Updated task: {task.title}",
        created_by=current_user.username,
    )
    await db.commit()
    return {"id": task.id, "message": "Task updated"}


@router.delete("/contacts/{contact_id}/tasks/{task_id}", dependencies=[Depends(require_permission("can_write_contacts"))])
async def delete_contact_task(
    contact_id: int,
    task_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    task = await db.get(ContactTask, task_id)
    if not task or task.contact_id != contact_id:
        raise HTTPException(status_code=404, detail="Task not found")
    title = task.title
    await db.delete(task)
    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type="task_deleted",
        message=f"Deleted task: {title}",
        created_by=current_user.username,
    )
    await db.commit()
    return {"id": task_id, "message": "Task deleted"}


@router.get("/contacts/{contact_id}/activities", dependencies=[Depends(require_permission("can_read_contacts"))])
async def list_contact_activities(
    contact_id: int,
    limit: int = Query(50, ge=1, le=200),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if not await db.get(ContactInquiry, contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    rows = await db.execute(
        select(ContactActivity)
        .where(ContactActivity.contact_id == contact_id)
        .order_by(ContactActivity.created_at.desc())
        .limit(limit)
    )
    activities = rows.scalars().all()
    return [
        {
            "id": item.id,
            "activity_type": item.activity_type,
            "message": item.message,
            "metadata": item.metadata_json or {},
            "created_by": item.created_by,
            "created_at": item.created_at.isoformat() if item.created_at else None,
        }
        for item in activities
    ]


@router.post("/contacts/{contact_id}/activities", status_code=201, dependencies=[Depends(require_permission("can_write_contacts"))])
async def create_contact_activity(
    contact_id: int,
    payload: ContactActivityCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if not await db.get(ContactInquiry, contact_id):
        raise HTTPException(status_code=404, detail="Contact not found")
    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type=payload.activity_type.strip(),
        message=payload.message.strip(),
        created_by=current_user.username,
        metadata=payload.metadata or {},
    )
    await db.commit()
    return {"message": "Activity added"}


class EmailTemplateCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=120)
    subject: str = Field(..., min_length=1, max_length=255)
    body: str = Field(..., min_length=1)
    category: str = Field("general", max_length=50)
    is_active: bool = True


class EmailTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=120)
    subject: Optional[str] = Field(None, min_length=1, max_length=255)
    body: Optional[str] = Field(None, min_length=1)
    category: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None


class SendTemplateRequest(BaseModel):
    template_id: int
    extra_context: Optional[Dict[str, str]] = None


def _email_template_payload(template: EmailTemplate) -> Dict[str, Any]:
    return {
        "id": template.id,
        "name": template.name,
        "subject": template.subject,
        "body": template.body,
        "category": template.category,
        "is_active": bool(template.is_active),
        "created_at": template.created_at.isoformat() if template.created_at else None,
        "updated_at": template.updated_at.isoformat() if template.updated_at else None,
    }


def _render_contact_template(text: str, contact: ContactInquiry, extra: Optional[Dict[str, str]] = None) -> str:
    payload = {
        "name": contact.name or "",
        "email": contact.email or "",
        "company": contact.company or "",
        "subject": contact.subject or "",
        "message": contact.message or "",
    }
    if extra:
        payload.update({k: str(v) for k, v in extra.items()})
    rendered = text
    for key, value in payload.items():
        rendered = rendered.replace(f"{{{{{key}}}}}", value)
    return rendered


@router.get("/email-templates", dependencies=[Depends(require_permission("can_write_contacts"))])
async def list_email_templates(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    rows = await db.execute(select(EmailTemplate).order_by(EmailTemplate.created_at.desc()))
    return [_email_template_payload(template) for template in rows.scalars().all()]


@router.post("/email-templates", status_code=201, dependencies=[Depends(require_permission("can_write_contacts"))])
async def create_email_template(
    payload: EmailTemplateCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    normalized_name = payload.name.strip().lower()
    existing = await db.scalar(select(EmailTemplate).where(func.lower(EmailTemplate.name) == normalized_name))
    if existing:
        raise HTTPException(status_code=400, detail="Template with this name already exists")
    template = EmailTemplate(
        name=normalized_name,
        subject=payload.subject.strip(),
        body=payload.body,
        category=payload.category.strip() or "general",
        is_active=payload.is_active,
        created_by=current_user.id,
    )
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return _email_template_payload(template)


@router.put("/email-templates/{template_id}", dependencies=[Depends(require_permission("can_write_contacts"))])
async def update_email_template(
    template_id: int,
    payload: EmailTemplateUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    template = await db.get(EmailTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data:
        normalized_name = (update_data["name"] or "").strip().lower()
        if not normalized_name:
            raise HTTPException(status_code=400, detail="name cannot be empty")
        duplicate = await db.scalar(
            select(EmailTemplate).where(
                and_(func.lower(EmailTemplate.name) == normalized_name, EmailTemplate.id != template_id)
            )
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Template with this name already exists")
        template.name = normalized_name
    if "subject" in update_data and update_data["subject"] is not None:
        template.subject = update_data["subject"].strip()
    if "body" in update_data and update_data["body"] is not None:
        template.body = update_data["body"]
    if "category" in update_data and update_data["category"] is not None:
        template.category = update_data["category"].strip() or "general"
    if "is_active" in update_data and update_data["is_active"] is not None:
        template.is_active = bool(update_data["is_active"])
    await db.commit()
    await db.refresh(template)
    return _email_template_payload(template)


@router.delete("/email-templates/{template_id}", dependencies=[Depends(require_permission("can_write_contacts"))])
async def delete_email_template(
    template_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    template = await db.get(EmailTemplate, template_id)
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    await db.delete(template)
    await db.commit()
    return {"id": template_id, "message": "Template deleted"}


@router.post("/contacts/{contact_id}/send-template", dependencies=[Depends(require_permission("can_write_contacts"))])
async def send_email_template_to_contact(
    contact_id: int,
    payload: SendTemplateRequest,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    contact = await db.get(ContactInquiry, contact_id)
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    template = await db.get(EmailTemplate, payload.template_id)
    if not template or not template.is_active:
        raise HTTPException(status_code=404, detail="Email template not found")

    subject = _render_contact_template(template.subject, contact, payload.extra_context)
    body = _render_contact_template(template.body, contact, payload.extra_context)
    email_service = EmailService()
    sent = await email_service.send_email(to_email=contact.email, subject=subject, html_content=body)
    if not sent:
        raise HTTPException(status_code=500, detail="Failed to send email")

    await _log_contact_activity(
        db=db,
        contact_id=contact_id,
        activity_type="email_sent",
        message=f"Sent template '{template.name}' to {contact.email}",
        created_by=current_user.username,
        metadata={"template_id": template.id, "template_name": template.name},
    )
    await db.commit()
    return {"message": "Email sent"}


@router.get("/configuration")
async def get_audit_configuration(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get current audit configuration
    """
    try:
        query = select(AuditConfiguration).where(AuditConfiguration.is_active == True)
        result = await db.execute(query)
        config = result.scalar_one_or_none()
        
        if not config:
            return _default_configuration_payload()

        metadata = _extract_configuration_metadata(config)

        return {
            "ai_model": config.openai_model or "gpt-4",
            "analysis_depth": metadata["analysis_depth"],
            "include_roi_analysis": bool(config.include_roi_projections),
            "include_risk_assessment": metadata["include_risk_assessment"],
            "include_implementation_roadmap": bool(config.include_implementation_roadmap),
            "pdf_template": metadata["pdf_template"],
            "auto_generate_pdf": metadata["auto_generate_pdf"],
            "pdf_generation_enabled": metadata["pdf_generation_enabled"],
            "auto_send_reports": metadata["auto_send_reports"],
            "notification_settings": metadata["notification_settings"],
            "custom_prompts": metadata["custom_prompts"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get configuration: {str(e)}"
        )

@router.put("/configuration")
async def update_audit_configuration(
    config_data: AuditConfigurationRequest,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update audit configuration
    """
    try:
        # Deactivate current configuration
        deactivate_query = select(AuditConfiguration).where(AuditConfiguration.is_active == True)
        result = await db.execute(deactivate_query)
        current_configs = result.scalars().all()
        
        for config in current_configs:
            config.is_active = False
        
        metadata = {
            "analysis_depth": config_data.analysis_depth,
            "include_risk_assessment": config_data.include_risk_assessment,
            "pdf_template": config_data.pdf_template,
            "auto_generate_pdf": config_data.auto_generate_pdf,
            "pdf_generation_enabled": config_data.auto_generate_pdf,
            "auto_send_reports": False,
            "notification_settings": config_data.notification_settings,
            "custom_prompts": config_data.custom_prompts
        }

        # Create new configuration mapped to existing ORM fields
        new_config = AuditConfiguration(
            name=f"Admin Configuration {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}",
            description=json.dumps(metadata),
            openai_model=config_data.ai_model,
            include_executive_summary=True,
            include_detailed_analysis=config_data.analysis_depth != "basic",
            include_roi_projections=config_data.include_roi_analysis,
            include_implementation_roadmap=config_data.include_implementation_roadmap,
            is_active=True,
            is_default=False,
            created_by=current_user.id
        )
        
        db.add(new_config)
        await db.commit()
        
        return {
            "message": "Configuration updated successfully",
            "config_id": new_config.id
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update configuration: {str(e)}"
        )

@router.get("/submissions", dependencies=[Depends(require_permission("can_read_audits"))])
async def get_submissions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get audit submissions for admin panel
    """
    try:
        query = select(Audit)
        
        # Apply filters
        if status_filter:
            query = query.where(Audit.status == status_filter)
        
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(
                    Audit.company_name.ilike(search_term),
                    Audit.contact_email.ilike(search_term),
                    Audit.industry.ilike(search_term)
                )
            )
        
        query = query.offset(skip).limit(limit).order_by(Audit.created_at.desc())
        
        result = await db.execute(query)
        audits = result.scalars().all()
        
        # Get audit results for maturity scores
        audit_results = {}
        if audits:
            audit_ids = [audit.id for audit in audits]
            results_query = select(AuditResult).where(AuditResult.audit_id.in_(audit_ids))
            results_result = await db.execute(results_query)
            for result in results_result.scalars().all():
                audit_results[result.audit_id] = result
        
        submissions = []
        for audit in audits:
            audit_result = audit_results.get(audit.id)
            submissions.append({
                "id": audit.id,
                "companyName": audit.company_name,
                "contactName": audit.contact_name or "Anonymous",
                "email": audit.contact_email,
                "industry": audit.industry,
                "status": audit.status,
                "maturityScore": audit_result.maturity_score if audit_result else None,
                "estimatedROI": audit_result.estimated_savings if audit_result else None,
                "createdAt": audit.created_at.isoformat(),
                "completedAt": audit_result.created_at.isoformat() if audit_result else None
            })
        
        return {"submissions": submissions}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get submissions: {str(e)}"
        )

_PERIOD_DAYS: Dict[str, int] = {"7d": 7, "30d": 30, "90d": 90, "365d": 365}


@router.get("/analytics/legacy")
async def get_analytics(
    period: str = Query("30d", regex="^(7d|30d|90d|365d)$"),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get analytics data for admin dashboard, filtered by period.
    """
    try:
        now = datetime.utcnow()
        days = _PERIOD_DAYS.get(period, 30)
        period_start = now - timedelta(days=days)

        # Submissions in period
        total_submissions = await db.scalar(
            select(func.count(Audit.id)).where(Audit.created_at >= period_start)
        ) or 0

        # Completed audits in period
        completed_audits = await db.scalar(
            select(func.count(Audit.id)).where(
                and_(Audit.status == "completed", Audit.created_at >= period_start)
            )
        ) or 0

        # Average maturity score (all time — gives more stable baseline)
        avg_maturity_score = await db.scalar(select(func.avg(AuditResult.maturity_score))) or 0

        # Total estimated savings in period
        total_estimated_roi = await db.scalar(
            select(func.sum(AuditResult.estimated_savings)).join(
                Audit, AuditResult.audit_id == Audit.id
            ).where(Audit.created_at >= period_start)
        ) or 0

        # Conversion rate
        conversion_rate = (completed_audits / total_submissions * 100) if total_submissions > 0 else 0

        # Monthly data for charts (12 months regardless of period)
        monthly_submissions = []
        for i in range(12):
            month_date = now.replace(month=((now.month - i - 1) % 12) + 1)
            if month_date.month > now.month:
                month_date = month_date.replace(year=now.year - 1)

            month_end = month_date.replace(day=28) + timedelta(days=4)
            month_end = month_end - timedelta(days=month_end.day)

            count = await db.scalar(
                select(func.count(Audit.id)).where(
                    and_(Audit.created_at >= month_date, Audit.created_at <= month_end)
                )
            ) or 0
            monthly_submissions.append({"month": month_date.strftime("%b %Y"), "submissions": count})

        monthly_submissions.reverse()

        return {
            "period": period,
            "totalSubmissions": total_submissions,
            "completedAudits": completed_audits,
            "averageMaturityScore": round(avg_maturity_score, 1),
            "totalEstimatedROI": int(total_estimated_roi),
            "conversionRate": round(conversion_rate, 1),
            "monthlySubmissions": monthly_submissions,
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )


@router.get("/analytics/blog/legacy")
async def get_blog_analytics(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Blog analytics: top posts and monthly view counts."""
    try:
        top_rows = await db.execute(
            select(BlogPost.id, BlogPost.title, BlogPost.slug, BlogPost.view_count, BlogPost.category)
            .where(BlogPost.status == "published")
            .order_by(BlogPost.view_count.desc())
            .limit(10)
        )
        top_posts = [
            {"id": r.id, "title": r.title, "slug": r.slug, "view_count": r.view_count or 0, "category": r.category}
            for r in top_rows
        ]
        return {"top_posts": top_posts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get blog analytics: {str(e)}")

@router.get("/analytics/overview/legacy")
async def get_analytics_overview(
    days: int = Query(30, ge=1, le=365),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get analytics overview for specified period
    """
    try:
        analytics_service = AnalyticsService()

        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)

        analytics_data = await analytics_service.get_analytics_overview(
            db=db,
            start_date=start_date,
            end_date=end_date
        )

        return analytics_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )


_ANALYTICS_PERIOD_PATTERN = r"^(7d|30d|90d|365d)$"
_GOAL_METRIC_LABELS = {
    "total_submissions": "Total submissions",
    "completed_audits": "Completed audits",
    "average_maturity_score": "Average maturity score",
    "total_estimated_roi": "Total estimated ROI",
    "conversion_rate": "Audit completion rate (%)",
    "total_contacts": "Total contacts",
    "converted_contacts": "Converted contacts",
    "contact_conversion_rate": "Contact conversion rate (%)",
}


class AnalyticsGoalCreate(BaseModel):
    metric: str = Field(..., min_length=2, max_length=100)
    target_value: float = Field(..., gt=0)
    period: str = Field("30d", pattern=_ANALYTICS_PERIOD_PATTERN)
    is_active: bool = True


class AnalyticsGoalUpdate(BaseModel):
    metric: Optional[str] = Field(None, min_length=2, max_length=100)
    target_value: Optional[float] = Field(None, gt=0)
    period: Optional[str] = Field(None, pattern=_ANALYTICS_PERIOD_PATTERN)
    is_active: Optional[bool] = None


class AnalyticsExportPdfRequest(BaseModel):
    period: str = Field("30d", pattern=_ANALYTICS_PERIOD_PATTERN)
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    include_comparison: bool = True


def _window_filter(column: Any, start_date: datetime, end_date: datetime) -> Any:
    return and_(column >= start_date, column < end_date)


def _month_floor(value: datetime) -> datetime:
    return datetime(value.year, value.month, 1)


def _next_month(value: datetime) -> datetime:
    if value.month == 12:
        return datetime(value.year + 1, 1, 1)
    return datetime(value.year, value.month + 1, 1)


def _parse_date(value: str, field_name: str) -> datetime:
    try:
        return datetime.strptime(value, "%Y-%m-%d")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} must be YYYY-MM-DD") from exc


def _resolve_analytics_window(
    period: str,
    start_date: Optional[str],
    end_date: Optional[str],
) -> Tuple[datetime, datetime, str]:
    now = datetime.utcnow().replace(microsecond=0)

    if (start_date and not end_date) or (end_date and not start_date):
        raise HTTPException(status_code=400, detail="Provide both start_date and end_date")

    if start_date and end_date:
        start_dt = _parse_date(start_date, "start_date")
        end_dt = _parse_date(end_date, "end_date") + timedelta(days=1)
        if end_dt <= start_dt:
            raise HTTPException(status_code=400, detail="end_date must be after start_date")
        return start_dt, end_dt, "custom"

    days = _PERIOD_DAYS.get(period, 30)
    start_dt = now - timedelta(days=days)
    return start_dt, now, period


async def _get_analytics_snapshot(db: AsyncSession, start_date: datetime, end_date: datetime) -> Dict[str, float]:
    total_submissions = await db.scalar(
        select(func.count(Audit.id)).where(_window_filter(Audit.created_at, start_date, end_date))
    ) or 0

    completed_audits = await db.scalar(
        select(func.count(Audit.id)).where(
            and_(Audit.status == "completed", _window_filter(Audit.created_at, start_date, end_date))
        )
    ) or 0

    avg_maturity_score = await db.scalar(
        select(func.avg(AuditResult.maturity_score))
        .select_from(AuditResult)
        .join(Audit, AuditResult.audit_id == Audit.id)
        .where(_window_filter(Audit.created_at, start_date, end_date))
    ) or 0

    total_estimated_roi = await db.scalar(
        select(func.sum(AuditResult.estimated_savings))
        .select_from(AuditResult)
        .join(Audit, AuditResult.audit_id == Audit.id)
        .where(_window_filter(Audit.created_at, start_date, end_date))
    ) or 0

    total_contacts = await db.scalar(
        select(func.count(ContactInquiry.id)).where(_window_filter(ContactInquiry.created_at, start_date, end_date))
    ) or 0

    converted_contacts = await db.scalar(
        select(func.count(ContactInquiry.id)).where(
            and_(
                ContactInquiry.status == "converted",
                _window_filter(ContactInquiry.created_at, start_date, end_date),
            )
        )
    ) or 0

    conversion_rate = (completed_audits / total_submissions * 100) if total_submissions else 0
    contact_conversion_rate = (converted_contacts / total_contacts * 100) if total_contacts else 0

    return {
        "total_submissions": int(total_submissions),
        "completed_audits": int(completed_audits),
        "average_maturity_score": round(float(avg_maturity_score), 1),
        "total_estimated_roi": float(total_estimated_roi),
        "conversion_rate": round(float(conversion_rate), 1),
        "total_contacts": int(total_contacts),
        "converted_contacts": int(converted_contacts),
        "contact_conversion_rate": round(float(contact_conversion_rate), 1),
    }


def _snapshot_to_response(snapshot: Dict[str, float], period_label: str) -> Dict[str, Any]:
    return {
        "period": period_label,
        "totalSubmissions": snapshot["total_submissions"],
        "completedAudits": snapshot["completed_audits"],
        "averageMaturityScore": snapshot["average_maturity_score"],
        "totalEstimatedROI": int(snapshot["total_estimated_roi"]),
        "conversionRate": snapshot["conversion_rate"],
        "totalContacts": snapshot["total_contacts"],
        "convertedContacts": snapshot["converted_contacts"],
        "contactConversionRate": snapshot["contact_conversion_rate"],
    }


def _goal_metric_value(metric: str, snapshot: Dict[str, float]) -> Optional[float]:
    return snapshot.get(metric)


async def _goal_progress_rows(db: AsyncSession, goals: List[AnalyticsGoal]) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    now = datetime.utcnow().replace(microsecond=0)
    snapshots: Dict[str, Dict[str, float]] = {}

    for goal in goals:
        if goal.period not in snapshots:
            days = _PERIOD_DAYS.get(goal.period, 30)
            snapshots[goal.period] = await _get_analytics_snapshot(db, now - timedelta(days=days), now)

        current_value = _goal_metric_value(goal.metric, snapshots[goal.period])
        progress = 0.0
        if current_value is not None and goal.target_value > 0:
            progress = round((current_value / goal.target_value) * 100, 1)

        rows.append(
            {
                "id": goal.id,
                "metric": goal.metric,
                "metric_label": _GOAL_METRIC_LABELS.get(goal.metric, goal.metric),
                "target_value": goal.target_value,
                "current_value": current_value,
                "period": goal.period,
                "is_active": goal.is_active,
                "progress_percent": progress,
                "is_reached": bool(current_value is not None and current_value >= goal.target_value),
                "created_at": goal.created_at.isoformat() if goal.created_at else None,
                "updated_at": goal.updated_at.isoformat() if goal.updated_at else None,
            }
        )

    return rows


async def _get_monthly_submissions(
    db: AsyncSession,
    start_date: datetime,
    end_date: datetime,
) -> List[Dict[str, Any]]:
    buckets: Dict[str, Dict[str, Any]] = {}
    cursor = _month_floor(start_date)
    while cursor < end_date:
        key = cursor.strftime("%Y-%m")
        buckets[key] = {"month": cursor.strftime("%b %Y"), "submissions": 0, "conversions": 0}
        cursor = _next_month(cursor)

    rows = await db.execute(
        select(Audit.created_at, Audit.status).where(_window_filter(Audit.created_at, start_date, end_date))
    )
    for created_at, status_value in rows.all():
        if not created_at:
            continue
        key = created_at.strftime("%Y-%m")
        bucket = buckets.get(key)
        if not bucket:
            continue
        bucket["submissions"] += 1
        if status_value == "completed":
            bucket["conversions"] += 1

    return [buckets[key] for key in sorted(buckets.keys())]


async def _get_company_size_breakdown(
    db: AsyncSession,
    start_date: datetime,
    end_date: datetime,
) -> List[Dict[str, Any]]:
    rows = await db.execute(
        select(Audit.company_size, func.count(Audit.id))
        .where(_window_filter(Audit.created_at, start_date, end_date))
        .group_by(Audit.company_size)
    )
    return [{"size": size or "unknown", "count": int(count or 0)} for size, count in rows.all()]


async def _get_maturity_distribution(
    db: AsyncSession,
    start_date: datetime,
    end_date: datetime,
) -> List[Dict[str, Any]]:
    ranges = [
        {"range": "0-20", "count": 0},
        {"range": "21-40", "count": 0},
        {"range": "41-60", "count": 0},
        {"range": "61-80", "count": 0},
        {"range": "81-100", "count": 0},
    ]

    rows = await db.execute(
        select(AuditResult.maturity_score)
        .select_from(AuditResult)
        .join(Audit, AuditResult.audit_id == Audit.id)
        .where(_window_filter(Audit.created_at, start_date, end_date))
    )

    for (score,) in rows.all():
        if score is None:
            continue
        numeric_score = max(0, min(100, int(score)))
        if numeric_score <= 20:
            ranges[0]["count"] += 1
        elif numeric_score <= 40:
            ranges[1]["count"] += 1
        elif numeric_score <= 60:
            ranges[2]["count"] += 1
        elif numeric_score <= 80:
            ranges[3]["count"] += 1
        else:
            ranges[4]["count"] += 1

    return ranges


async def _get_industry_breakdown(
    db: AsyncSession,
    start_date: datetime,
    end_date: datetime,
    total_submissions: int,
) -> List[Dict[str, Any]]:
    rows = await db.execute(
        select(Audit.industry, func.count(Audit.id))
        .where(_window_filter(Audit.created_at, start_date, end_date))
        .group_by(Audit.industry)
    )

    result: List[Dict[str, Any]] = []
    for industry, count in rows.all():
        numeric_count = int(count or 0)
        percentage = round((numeric_count / total_submissions * 100), 1) if total_submissions > 0 else 0.0
        result.append({"industry": industry or "unknown", "count": numeric_count, "percentage": percentage})

    result.sort(key=lambda item: item["count"], reverse=True)
    return result


@router.get("/analytics", dependencies=[Depends(require_permission("can_view_analytics"))])
async def get_analytics_v2(
    period: str = Query("30d", pattern=_ANALYTICS_PERIOD_PATTERN),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    start_dt, end_dt, resolved_period = _resolve_analytics_window(period, start_date, end_date)
    snapshot = await _get_analytics_snapshot(db, start_dt, end_dt)

    monthly_submissions = await _get_monthly_submissions(db, start_dt, end_dt)
    company_size_breakdown = await _get_company_size_breakdown(db, start_dt, end_dt)
    maturity_distribution = await _get_maturity_distribution(db, start_dt, end_dt)
    industry_breakdown = await _get_industry_breakdown(db, start_dt, end_dt, int(snapshot["total_submissions"]))

    response = _snapshot_to_response(snapshot, resolved_period)
    response.update(
        {
            "startDate": start_dt.date().isoformat(),
            "endDate": (end_dt - timedelta(days=1)).date().isoformat(),
            "monthlySubmissions": monthly_submissions,
            "companySizeBreakdown": company_size_breakdown,
            "maturityScoreDistribution": maturity_distribution,
            "industryBreakdown": industry_breakdown,
        }
    )
    return response


@router.get("/analytics/comparison", dependencies=[Depends(require_permission("can_view_analytics"))])
async def get_analytics_comparison(
    period: str = Query("30d", pattern=_ANALYTICS_PERIOD_PATTERN),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    start_dt, end_dt, resolved_period = _resolve_analytics_window(period, start_date, end_date)
    current_snapshot = await _get_analytics_snapshot(db, start_dt, end_dt)

    duration = end_dt - start_dt
    previous_end = start_dt
    previous_start = previous_end - duration
    previous_snapshot = await _get_analytics_snapshot(db, previous_start, previous_end)

    delta: Dict[str, Dict[str, Optional[float]]] = {}
    for metric in current_snapshot.keys():
        current_value = float(current_snapshot[metric])
        previous_value = float(previous_snapshot.get(metric, 0))
        diff = current_value - previous_value
        percent = None
        if previous_value != 0:
            percent = round((diff / previous_value) * 100, 1)
        delta[metric] = {"value": round(diff, 2), "percent": percent}

    return {
        "period": resolved_period,
        "startDate": start_dt.date().isoformat(),
        "endDate": (end_dt - timedelta(days=1)).date().isoformat(),
        "current": _snapshot_to_response(current_snapshot, resolved_period),
        "previous": _snapshot_to_response(previous_snapshot, "previous"),
        "delta": delta,
    }


@router.get("/analytics/funnel", dependencies=[Depends(require_permission("can_view_analytics"))])
async def get_analytics_funnel(
    period: str = Query("30d", pattern=_ANALYTICS_PERIOD_PATTERN),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    start_dt, end_dt, resolved_period = _resolve_analytics_window(period, start_date, end_date)

    contacts_count = await db.scalar(
        select(func.count(ContactInquiry.id)).where(_window_filter(ContactInquiry.created_at, start_dt, end_dt))
    ) or 0
    audits_count = await db.scalar(
        select(func.count(Audit.id)).where(_window_filter(Audit.created_at, start_dt, end_dt))
    ) or 0
    converted_count = await db.scalar(
        select(func.count(ContactInquiry.id)).where(
            and_(
                ContactInquiry.status == "converted",
                _window_filter(ContactInquiry.created_at, start_dt, end_dt),
            )
        )
    ) or 0

    contacts_to_audits = round((audits_count / contacts_count * 100), 1) if contacts_count else 0.0
    audits_to_converted = round((converted_count / audits_count * 100), 1) if audits_count else 0.0
    contacts_to_converted = round((converted_count / contacts_count * 100), 1) if contacts_count else 0.0

    return {
        "period": resolved_period,
        "startDate": start_dt.date().isoformat(),
        "endDate": (end_dt - timedelta(days=1)).date().isoformat(),
        "stages": [
            {"name": "Contacts", "value": int(contacts_count)},
            {"name": "Audits", "value": int(audits_count)},
            {"name": "Converted", "value": int(converted_count)},
        ],
        "conversion": {
            "contacts_to_audits": contacts_to_audits,
            "audits_to_converted": audits_to_converted,
            "contacts_to_converted": contacts_to_converted,
        },
    }


@router.get("/analytics/cohort", dependencies=[Depends(require_permission("can_view_analytics"))])
async def get_analytics_cohort(
    period: str = Query("365d", pattern=_ANALYTICS_PERIOD_PATTERN),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    start_dt, end_dt, resolved_period = _resolve_analytics_window(period, start_date, end_date)

    buckets: Dict[str, Dict[str, Any]] = {}
    cursor = _month_floor(start_dt)
    while cursor < end_dt:
        key = cursor.strftime("%Y-%m")
        buckets[key] = {
            "month": cursor.strftime("%b %Y"),
            "contacts": 0,
            "converted": 0,
            "audits": 0,
            "completed_audits": 0,
        }
        cursor = _next_month(cursor)

    contact_rows = await db.execute(
        select(ContactInquiry.created_at, ContactInquiry.status).where(
            _window_filter(ContactInquiry.created_at, start_dt, end_dt)
        )
    )
    for created_at, status_value in contact_rows.all():
        if not created_at:
            continue
        key = created_at.strftime("%Y-%m")
        bucket = buckets.get(key)
        if not bucket:
            continue
        bucket["contacts"] += 1
        if status_value == "converted":
            bucket["converted"] += 1

    audit_rows = await db.execute(
        select(Audit.created_at, Audit.status).where(_window_filter(Audit.created_at, start_dt, end_dt))
    )
    for created_at, status_value in audit_rows.all():
        if not created_at:
            continue
        key = created_at.strftime("%Y-%m")
        bucket = buckets.get(key)
        if not bucket:
            continue
        bucket["audits"] += 1
        if status_value == "completed":
            bucket["completed_audits"] += 1

    cohort_rows: List[Dict[str, Any]] = []
    for key in sorted(buckets.keys()):
        item = buckets[key]
        contacts_count = item["contacts"]
        converted_count = item["converted"]
        item["conversion_rate"] = round((converted_count / contacts_count * 100), 1) if contacts_count else 0.0
        cohort_rows.append(item)

    return {
        "period": resolved_period,
        "startDate": start_dt.date().isoformat(),
        "endDate": (end_dt - timedelta(days=1)).date().isoformat(),
        "rows": cohort_rows,
    }


@router.get("/analytics/goals", dependencies=[Depends(require_permission("can_view_analytics"))])
async def list_analytics_goals(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    rows = await db.execute(select(AnalyticsGoal).order_by(AnalyticsGoal.created_at.desc()))
    goals = rows.scalars().all()
    return {
        "items": [
            {
                "id": goal.id,
                "metric": goal.metric,
                "metric_label": _GOAL_METRIC_LABELS.get(goal.metric, goal.metric),
                "target_value": goal.target_value,
                "period": goal.period,
                "is_active": goal.is_active,
                "created_at": goal.created_at.isoformat() if goal.created_at else None,
                "updated_at": goal.updated_at.isoformat() if goal.updated_at else None,
            }
            for goal in goals
        ],
        "available_metrics": [{"value": key, "label": label} for key, label in _GOAL_METRIC_LABELS.items()],
    }


@router.get("/analytics/goals/progress", dependencies=[Depends(require_permission("can_view_analytics"))])
async def get_analytics_goal_progress(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    rows = await db.execute(select(AnalyticsGoal).order_by(AnalyticsGoal.created_at.desc()))
    goals = rows.scalars().all()
    return {"items": await _goal_progress_rows(db, goals)}


@router.post("/analytics/goals", status_code=201, dependencies=[Depends(require_permission("can_view_analytics"))])
async def create_analytics_goal(
    data: AnalyticsGoalCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    goal = AnalyticsGoal(
        metric=data.metric.strip(),
        target_value=data.target_value,
        period=data.period,
        is_active=data.is_active,
    )
    db.add(goal)
    await db.commit()
    await db.refresh(goal)
    return {
        "id": goal.id,
        "metric": goal.metric,
        "target_value": goal.target_value,
        "period": goal.period,
        "is_active": goal.is_active,
    }


@router.put("/analytics/goals/{goal_id}", dependencies=[Depends(require_permission("can_view_analytics"))])
async def update_analytics_goal(
    goal_id: int,
    data: AnalyticsGoalUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    goal = await db.get(AnalyticsGoal, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")

    payload = data.model_dump(exclude_unset=True)
    for field, value in payload.items():
        if field == "metric" and isinstance(value, str):
            value = value.strip()
        setattr(goal, field, value)

    await db.commit()
    await db.refresh(goal)
    return {
        "id": goal.id,
        "metric": goal.metric,
        "target_value": goal.target_value,
        "period": goal.period,
        "is_active": goal.is_active,
    }


@router.delete("/analytics/goals/{goal_id}", dependencies=[Depends(require_permission("can_view_analytics"))])
async def delete_analytics_goal(
    goal_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    goal = await db.get(AnalyticsGoal, goal_id)
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    await db.delete(goal)
    await db.commit()
    return {"message": "Goal deleted", "id": goal_id}


@router.post("/analytics/export-pdf", dependencies=[Depends(require_permission("can_view_analytics"))])
async def export_analytics_pdf(
    data: AnalyticsExportPdfRequest,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    start_dt, end_dt, resolved_period = _resolve_analytics_window(data.period, data.start_date, data.end_date)
    snapshot = await _get_analytics_snapshot(db, start_dt, end_dt)

    previous_snapshot: Optional[Dict[str, float]] = None
    if data.include_comparison:
        duration = end_dt - start_dt
        previous_snapshot = await _get_analytics_snapshot(db, start_dt - duration, start_dt)

    rows = await db.execute(select(AnalyticsGoal).where(AnalyticsGoal.is_active == True))
    goals = rows.scalars().all()
    goals_progress = await _goal_progress_rows(db, goals)

    buffer = io.BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    _, height = A4
    y = height - 50

    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawString(40, y, "XTeam Admin Analytics Report")
    y -= 24
    pdf.setFont("Helvetica", 10)
    pdf.drawString(40, y, f"Generated at: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC")
    y -= 16
    pdf.drawString(
        40,
        y,
        f"Period: {resolved_period} ({start_dt.date().isoformat()} - {(end_dt - timedelta(days=1)).date().isoformat()})",
    )
    y -= 24

    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(40, y, "KPIs")
    y -= 18
    pdf.setFont("Helvetica", 10)
    for metric, label in _GOAL_METRIC_LABELS.items():
        value = snapshot.get(metric)
        if value is None:
            continue
        value_text = f"{value:.1f}" if isinstance(value, float) and not float(value).is_integer() else str(int(value))
        pdf.drawString(50, y, f"{label}: {value_text}")
        y -= 14
        if y < 100:
            pdf.showPage()
            y = height - 50
            pdf.setFont("Helvetica", 10)

    if previous_snapshot:
        y -= 8
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(40, y, "Comparison vs Previous Period")
        y -= 18
        pdf.setFont("Helvetica", 10)
        for metric, label in _GOAL_METRIC_LABELS.items():
            current_val = float(snapshot.get(metric, 0))
            previous_val = float(previous_snapshot.get(metric, 0))
            diff = current_val - previous_val
            pdf.drawString(50, y, f"{label}: {current_val:.1f} (delta {diff:+.1f})")
            y -= 14
            if y < 100:
                pdf.showPage()
                y = height - 50
                pdf.setFont("Helvetica", 10)

    if goals_progress:
        y -= 8
        pdf.setFont("Helvetica-Bold", 12)
        pdf.drawString(40, y, "Goal Progress")
        y -= 18
        pdf.setFont("Helvetica", 10)
        for goal in goals_progress:
            current_value = goal.get("current_value")
            target_value = float(goal.get("target_value") or 0)
            current_text = "n/a" if current_value is None else f"{float(current_value):.1f}"
            pdf.drawString(
                50,
                y,
                f"{goal.get('metric_label')}: {current_text}/{target_value:.1f} ({goal.get('progress_percent', 0):.1f}%)",
            )
            y -= 14
            if y < 100:
                pdf.showPage()
                y = height - 50
                pdf.setFont("Helvetica", 10)

    pdf.save()
    buffer.seek(0)

    filename = f"analytics_report_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/analytics/blog", dependencies=[Depends(require_permission("can_view_analytics"))])
async def get_blog_analytics_v2(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    top_rows = await db.execute(
        select(BlogPost.id, BlogPost.title, BlogPost.slug, BlogPost.view_count, BlogPost.category)
        .where(BlogPost.status == "published")
        .order_by(BlogPost.view_count.desc())
        .limit(10)
    )
    top_posts = [
        {"id": row.id, "title": row.title, "slug": row.slug, "view_count": row.view_count or 0, "category": row.category}
        for row in top_rows
    ]
    return {"top_posts": top_posts}


@router.get("/analytics/overview", dependencies=[Depends(require_permission("can_view_analytics"))])
async def get_analytics_overview_v2(
    days: int = Query(30, ge=1, le=365),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    analytics_service = AnalyticsService()
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    return await analytics_service.get_analytics_overview(
        db=db,
        start_date=start_date,
        end_date=end_date,
    )


@router.get("/notifications")
async def get_admin_notifications(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    now = datetime.utcnow()
    groups: List[Dict[str, Any]] = []
    total = 0

    if has_permission(current_user, "can_read_contacts"):
        new_contacts_count = await db.scalar(
            select(func.count(ContactInquiry.id)).where(ContactInquiry.status == "new")
        ) or 0
        new_contacts_rows = await db.execute(
            select(ContactInquiry.id, ContactInquiry.name, ContactInquiry.company, ContactInquiry.created_at)
            .where(ContactInquiry.status == "new")
            .order_by(ContactInquiry.created_at.desc())
            .limit(5)
        )
        groups.append(
            {
                "key": "new_contacts",
                "label": "New contacts",
                "count": int(new_contacts_count),
                "items": [
                    {
                        "id": str(row.id),
                        "title": row.name or "New contact",
                        "subtitle": row.company or None,
                        "timestamp": row.created_at.isoformat() if row.created_at else None,
                        "href": f"/admin/contacts/{row.id}",
                    }
                    for row in new_contacts_rows
                ],
            }
        )
        total += int(new_contacts_count)

        overdue_tasks_count = await db.scalar(
            select(func.count(ContactTask.id)).where(
                and_(
                    ContactTask.due_date.isnot(None),
                    ContactTask.due_date < now,
                    ContactTask.status != "done",
                )
            )
        ) or 0
        overdue_tasks_rows = await db.execute(
            select(
                ContactTask.id,
                ContactTask.title,
                ContactTask.due_date,
                ContactTask.contact_id,
                ContactInquiry.name,
            )
            .join(ContactInquiry, ContactInquiry.id == ContactTask.contact_id)
            .where(
                and_(
                    ContactTask.due_date.isnot(None),
                    ContactTask.due_date < now,
                    ContactTask.status != "done",
                )
            )
            .order_by(ContactTask.due_date.asc())
            .limit(5)
        )
        groups.append(
            {
                "key": "overdue_tasks",
                "label": "Overdue tasks",
                "count": int(overdue_tasks_count),
                "items": [
                    {
                        "id": str(row.id),
                        "title": row.title,
                        "subtitle": f"{row.name or 'Contact'} | Due {row.due_date.date().isoformat()}" if row.due_date else row.name,
                        "timestamp": row.due_date.isoformat() if row.due_date else None,
                        "href": f"/admin/contacts/{row.contact_id}",
                    }
                    for row in overdue_tasks_rows
                ],
            }
        )
        total += int(overdue_tasks_count)

    if has_permission(current_user, "can_read_audits"):
        failed_audits_count = await db.scalar(
            select(func.count(Audit.id)).where(Audit.status == "failed")
        ) or 0
        failed_audits_rows = await db.execute(
            select(Audit.id, Audit.company_name, Audit.contact_email, Audit.created_at)
            .where(Audit.status == "failed")
            .order_by(Audit.created_at.desc())
            .limit(5)
        )
        groups.append(
            {
                "key": "failed_audits",
                "label": "Failed audits",
                "count": int(failed_audits_count),
                "items": [
                    {
                        "id": str(row.id),
                        "title": row.company_name or f"Audit #{row.id}",
                        "subtitle": row.contact_email or None,
                        "timestamp": row.created_at.isoformat() if row.created_at else None,
                        "href": f"/admin/audits/{row.id}",
                    }
                    for row in failed_audits_rows
                ],
            }
        )
        total += int(failed_audits_count)

    return {
        "total": total,
        "generated_at": now.isoformat(),
        "groups": groups,
    }


@router.delete("/submissions/{submission_id}", dependencies=[Depends(require_permission("can_delete_audits"))])
async def delete_submission(
    submission_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Delete an audit submission and associated results
    """
    audit = await db.get(Audit, submission_id)
    if not audit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Submission not found"
        )

    result_query = select(AuditResult).where(AuditResult.audit_id == submission_id)
    result_rows = await db.execute(result_query)
    audit_result = result_rows.scalar_one_or_none()
    if audit_result:
        await db.delete(audit_result)

    await db.delete(audit)
    await db.commit()

    return {"message": "Submission deleted successfully", "id": submission_id}


@router.get("/export", dependencies=[Depends(require_permission("can_export_data"))])
async def export_data(
    format: str = Query("csv", pattern="^(csv)$"),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Export audit submissions as CSV
    """
    query = (
        select(Audit, AuditResult)
        .outerjoin(AuditResult, Audit.id == AuditResult.audit_id)
        .order_by(Audit.created_at.desc())
    )
    rows = await db.execute(query)
    records = rows.all()

    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "ID", "Company Name", "Industry", "Company Size",
        "Contact Email", "Contact Name", "Contact Phone",
        "Status", "Maturity Score", "ROI Projection",
        "Estimated Savings", "Implementation Cost", "Payback Period",
        "Created At"
    ])

    for audit, result in records:
        writer.writerow([
            audit.id,
            audit.company_name or "",
            audit.industry or "",
            audit.company_size or "",
            audit.contact_email or "",
            audit.contact_name or "",
            audit.phone or "",
            audit.status or "",
            result.maturity_score if result else "",
            result.roi_projection if result else "",
            result.estimated_savings if result else "",
            result.implementation_cost if result else "",
            result.payback_period if result else "",
            audit.created_at.isoformat() if audit.created_at else "",
        ])

    output.seek(0)
    filename = f"submissions_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


# ─────────────────────────────────────────────────────────────────────────────
# Blog management
# ─────────────────────────────────────────────────────────────────────────────

import re
import math


def _slugify(text: str) -> str:
    """Convert title to URL-safe slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    text = re.sub(r"^-+|-+$", "", text)
    return text


def _calc_reading_time(content: str) -> int:
    """Estimate reading time in minutes (avg 200 wpm)."""
    words = len(content.split())
    return max(1, math.ceil(words / 200))


class BlogPostCreate(BaseModel):
    title_ru: str = Field(..., min_length=1, max_length=255)
    title_en: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    excerpt_ru: str = Field(..., min_length=1)
    excerpt_en: str = Field(..., min_length=1)
    content_ru: str = Field(..., min_length=1)
    content_en: str = Field(..., min_length=1)
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = None
    keywords: Optional[str] = Field(None, max_length=500)
    featured_image: Optional[str] = Field(None, max_length=500)
    featured_image_alt: Optional[str] = Field(None, max_length=255)
    category: str = Field(..., min_length=1, max_length=100)
    tags: Optional[str] = Field(None, max_length=500)
    author_name: str = Field(..., min_length=1, max_length=255)
    author_email: Optional[str] = Field(None, max_length=255)
    author_bio: Optional[str] = None
    status: str = Field("draft", pattern="^(draft|published|archived)$")
    is_featured: bool = False
    allow_comments: bool = True
    is_seo_optimized: bool = False


class BlogPostUpdate(BaseModel):
    title_ru: Optional[str] = Field(None, min_length=1, max_length=255)
    title_en: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    excerpt_ru: Optional[str] = None
    excerpt_en: Optional[str] = None
    content_ru: Optional[str] = None
    content_en: Optional[str] = None
    meta_title: Optional[str] = Field(None, max_length=255)
    meta_description: Optional[str] = None
    keywords: Optional[str] = Field(None, max_length=500)
    featured_image: Optional[str] = Field(None, max_length=500)
    featured_image_alt: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    tags: Optional[str] = Field(None, max_length=500)
    author_name: Optional[str] = Field(None, max_length=255)
    author_email: Optional[str] = Field(None, max_length=255)
    author_bio: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(draft|published|archived)$")
    is_featured: Optional[bool] = None
    allow_comments: Optional[bool] = None
    is_seo_optimized: Optional[bool] = None


class BlogPostStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|published|archived)$")


async def _unique_slug(db: AsyncSession, base_slug: str, exclude_id: Optional[int] = None) -> str:
    """Return a slug that is unique in blog_posts table."""
    slug = base_slug
    counter = 1
    while True:
        query = select(BlogPost).where(BlogPost.slug == slug)
        if exclude_id:
            query = query.where(BlogPost.id != exclude_id)
        existing = await db.scalar(query)
        if not existing:
            return slug
        slug = f"{base_slug}-{counter}"
        counter += 1


@router.get("/blog")
async def list_blog_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(draft|published|archived)$"),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """List blog posts with optional filtering."""
    query = select(BlogPost)

    conditions = []
    if status:
        conditions.append(BlogPost.status == status)
    if category:
        conditions.append(BlogPost.category == category)
    if search:
        term = f"%{search}%"
        conditions.append(
            or_(
                BlogPost.title.ilike(term),
                BlogPost.excerpt.ilike(term),
                BlogPost.title_ru.ilike(term),
                BlogPost.title_en.ilike(term),
                BlogPost.excerpt_ru.ilike(term),
                BlogPost.excerpt_en.ilike(term),
                BlogPost.author_name.ilike(term),
            )
        )
    if conditions:
        query = query.where(and_(*conditions))

    total_q = select(func.count()).select_from(query.subquery())
    total = await db.scalar(total_q)

    rows = await db.execute(query.order_by(BlogPost.created_at.desc()).offset(skip).limit(limit))
    posts = rows.scalars().all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "id": p.id,
                "title": p.title_en or p.title or p.title_ru or "",
                "title_ru": p.title_ru or "",
                "title_en": p.title_en or "",
                "slug": p.slug,
                "excerpt": p.excerpt_en or p.excerpt or p.excerpt_ru or "",
                "excerpt_ru": p.excerpt_ru or "",
                "excerpt_en": p.excerpt_en or "",
                "category": p.category,
                "tags": p.tags,
                "author_name": p.author_name,
                "status": p.status,
                "is_featured": p.is_featured,
                "view_count": p.view_count,
                "reading_time": p.reading_time,
                "word_count": p.word_count,
                "published_at": p.published_at.isoformat() if p.published_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None,
                "updated_at": p.updated_at.isoformat() if p.updated_at else None,
                "featured_image": p.featured_image,
            }
            for p in posts
        ],
    }


@router.get("/blog/{post_id}")
async def get_blog_post(
    post_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Get full blog post by ID."""
    post = await db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    return {
        "id": post.id,
        "title": post.title_en or post.title or post.title_ru or "",
        "title_ru": post.title_ru or "",
        "title_en": post.title_en or "",
        "slug": post.slug,
        "excerpt": post.excerpt_en or post.excerpt or post.excerpt_ru or "",
        "excerpt_ru": post.excerpt_ru or "",
        "excerpt_en": post.excerpt_en or "",
        "content": post.content_en or post.content or post.content_ru or "",
        "content_ru": post.content_ru or "",
        "content_en": post.content_en or "",
        "meta_title": post.meta_title,
        "meta_description": post.meta_description,
        "keywords": post.keywords,
        "featured_image": post.featured_image,
        "featured_image_alt": post.featured_image_alt,
        "category": post.category,
        "tags": post.tags,
        "author_name": post.author_name,
        "author_email": post.author_email,
        "author_bio": post.author_bio,
        "status": post.status,
        "is_featured": post.is_featured,
        "allow_comments": post.allow_comments,
        "is_seo_optimized": post.is_seo_optimized,
        "view_count": post.view_count,
        "like_count": post.like_count,
        "share_count": post.share_count,
        "reading_time": post.reading_time,
        "word_count": post.word_count,
        "published_at": post.published_at.isoformat() if post.published_at else None,
        "created_at": post.created_at.isoformat() if post.created_at else None,
        "updated_at": post.updated_at.isoformat() if post.updated_at else None,
    }


@router.post("/blog", status_code=201, dependencies=[Depends(require_permission("can_manage_content"))])
async def create_blog_post(
    data: BlogPostCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Create a new blog post."""
    title_ru = data.title_ru.strip()
    title_en = data.title_en.strip()
    excerpt_ru = data.excerpt_ru.strip()
    excerpt_en = data.excerpt_en.strip()
    content_ru = data.content_ru.strip()
    content_en = data.content_en.strip()

    if not title_ru or not title_en:
        raise HTTPException(status_code=400, detail="Both title_ru and title_en are required")
    if not excerpt_ru or not excerpt_en:
        raise HTTPException(status_code=400, detail="Both excerpt_ru and excerpt_en are required")
    if not content_ru or not content_en:
        raise HTTPException(status_code=400, detail="Both content_ru and content_en are required")
    if data.status == "published":
        _assert_permission(current_user, "can_publish_content")

    base_slug = data.slug if data.slug else _slugify(title_en)
    slug = await _unique_slug(db, base_slug)

    word_count = len(content_en.split())
    reading_time = _calc_reading_time(content_en)

    published_at = datetime.utcnow() if data.status == "published" else None

    post = BlogPost(
        title=title_en,
        title_ru=title_ru,
        title_en=title_en,
        slug=slug,
        excerpt=excerpt_en,
        excerpt_ru=excerpt_ru,
        excerpt_en=excerpt_en,
        content=content_en,
        content_ru=content_ru,
        content_en=content_en,
        meta_title=data.meta_title,
        meta_description=data.meta_description,
        keywords=data.keywords,
        featured_image=data.featured_image,
        featured_image_alt=data.featured_image_alt,
        category=data.category,
        tags=data.tags,
        author_name=data.author_name,
        author_email=data.author_email,
        author_bio=data.author_bio,
        status=data.status,
        is_featured=data.is_featured,
        allow_comments=data.allow_comments,
        is_seo_optimized=data.is_seo_optimized,
        word_count=word_count,
        reading_time=reading_time,
        published_at=published_at,
    )

    db.add(post)
    await db.commit()
    await db.refresh(post)

    return {"id": post.id, "slug": post.slug, "message": "Post created successfully"}


@router.put("/blog/{post_id}", dependencies=[Depends(require_permission("can_manage_content"))])
async def update_blog_post(
    post_id: int,
    data: BlogPostUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Update an existing blog post."""
    post = await db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    if post.status == "published" and not has_permission(current_user, "can_publish_content"):
        raise HTTPException(status_code=403, detail="Permission denied: 'can_publish_content' required")

    update_data = data.model_dump(exclude_unset=True)
    incoming_fields = set(update_data.keys())

    # Merge with existing values and enforce bilingual content completeness.
    title_ru = (update_data.get("title_ru", post.title_ru) or "").strip()
    title_en = (update_data.get("title_en", post.title_en or post.title) or "").strip()
    excerpt_ru = (update_data.get("excerpt_ru", post.excerpt_ru) or "").strip()
    excerpt_en = (update_data.get("excerpt_en", post.excerpt_en or post.excerpt) or "").strip()
    content_ru = (update_data.get("content_ru", post.content_ru) or "").strip()
    content_en = (update_data.get("content_en", post.content_en or post.content) or "").strip()

    if not title_ru or not title_en:
        raise HTTPException(status_code=400, detail="Both title_ru and title_en are required")
    if not excerpt_ru or not excerpt_en:
        raise HTTPException(status_code=400, detail="Both excerpt_ru and excerpt_en are required")
    if not content_ru or not content_en:
        raise HTTPException(status_code=400, detail="Both content_ru and content_en are required")

    update_data["title_ru"] = title_ru
    update_data["title_en"] = title_en
    update_data["excerpt_ru"] = excerpt_ru
    update_data["excerpt_en"] = excerpt_en
    update_data["content_ru"] = content_ru
    update_data["content_en"] = content_en
    # Keep legacy fields for backwards compatibility.
    update_data["title"] = title_en
    update_data["excerpt"] = excerpt_en
    update_data["content"] = content_en

    # Regenerate slug if title_en changed and no explicit slug given
    if "title_en" in incoming_fields and "slug" not in incoming_fields:
        update_data["slug"] = await _unique_slug(db, _slugify(update_data["title_en"]), exclude_id=post_id)
    elif "slug" in incoming_fields and update_data.get("slug"):
        update_data["slug"] = await _unique_slug(db, _slugify(update_data["slug"]), exclude_id=post_id)

    # Recalculate word count / reading time by English content.
    update_data["word_count"] = len(content_en.split())
    update_data["reading_time"] = _calc_reading_time(content_en)

    # Set published_at when transitioning to published
    if "status" in update_data and update_data["status"] == "published" and post.published_at is None:
        _assert_permission(current_user, "can_publish_content")
        update_data["published_at"] = datetime.utcnow()

    for field, value in update_data.items():
        setattr(post, field, value)

    await db.commit()
    await db.refresh(post)

    return {"id": post.id, "slug": post.slug, "message": "Post updated successfully"}


@router.delete("/blog/{post_id}", dependencies=[Depends(require_permission("can_manage_content"))])
async def delete_blog_post(
    post_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Delete a blog post."""
    post = await db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    await db.delete(post)
    await db.commit()

    return {"message": "Post deleted successfully", "id": post_id}


@router.post("/blog/{post_id}/duplicate", status_code=201, dependencies=[Depends(require_permission("can_manage_content"))])
async def duplicate_blog_post(
    post_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Duplicate a post as a new draft."""
    original = await db.get(BlogPost, post_id)
    if not original:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    new_slug = await _unique_slug(db, f"{original.slug}-copy")
    copied_title_en = (original.title_en or original.title or "").strip()
    copied_title_ru = (original.title_ru or copied_title_en or "").strip()
    copied_excerpt_en = (original.excerpt_en or original.excerpt or "").strip()
    copied_excerpt_ru = (original.excerpt_ru or copied_excerpt_en or "").strip()
    copied_content_en = (original.content_en or original.content or "").strip()
    copied_content_ru = (original.content_ru or copied_content_en or "").strip()

    if not copied_title_en:
        copied_title_en = "Copy"
    if not copied_title_ru:
        copied_title_ru = copied_title_en
    if not copied_excerpt_en:
        copied_excerpt_en = copied_title_en
    if not copied_excerpt_ru:
        copied_excerpt_ru = copied_excerpt_en
    if not copied_content_en:
        copied_content_en = "<p>Copy</p>"
    if not copied_content_ru:
        copied_content_ru = copied_content_en

    copy = BlogPost(
        title=f"{copied_title_en} (Copy)" if copied_title_en else "Copy",
        title_ru=f"{copied_title_ru} (Copy)" if copied_title_ru else "Copy",
        title_en=f"{copied_title_en} (Copy)" if copied_title_en else "Copy",
        slug=new_slug,
        excerpt=copied_excerpt_en,
        excerpt_ru=copied_excerpt_ru,
        excerpt_en=copied_excerpt_en,
        content=copied_content_en,
        content_ru=copied_content_ru,
        content_en=copied_content_en,
        meta_title=original.meta_title,
        meta_description=original.meta_description,
        keywords=original.keywords,
        featured_image=original.featured_image,
        featured_image_alt=original.featured_image_alt,
        category=original.category,
        tags=original.tags,
        author_name=original.author_name,
        author_email=original.author_email,
        author_bio=original.author_bio,
        status="draft",
        is_featured=False,
        allow_comments=original.allow_comments,
        is_seo_optimized=False,
        word_count=len(copied_content_en.split()),
        reading_time=_calc_reading_time(copied_content_en),
    )

    db.add(copy)
    await db.commit()
    await db.refresh(copy)

    return {"id": copy.id, "slug": copy.slug, "message": "Post duplicated as draft"}


@router.patch("/blog/{post_id}/status", dependencies=[Depends(require_permission("can_publish_content"))])
async def update_blog_post_status(
    post_id: int,
    data: BlogPostStatusUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Quick status change for a blog post."""
    post = await db.get(BlogPost, post_id)
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")

    post.status = data.status
    if data.status == "published" and post.published_at is None:
        post.published_at = datetime.utcnow()

    await db.commit()

    return {"id": post_id, "status": data.status, "message": "Status updated"}


# ─────────────────────────────────────────────────────────────────────────────
# Contacts export
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/export/contacts", dependencies=[Depends(require_permission("can_export_data"))])
async def export_contacts(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Export contact inquiries as CSV."""
    rows = await db.execute(
        select(ContactInquiry).order_by(ContactInquiry.created_at.desc())
    )
    contacts = rows.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Name", "Email", "Phone", "Company", "Position",
        "Inquiry Type", "Subject", "Message", "Priority",
        "Status", "Newsletter", "Created At",
    ])
    for c in contacts:
        writer.writerow([
            c.id,
            c.name or "",
            c.email or "",
            c.phone or "",
            c.company or "",
            c.position or "",
            c.inquiry_type or "",
            c.subject or "",
            c.message or "",
            c.priority or "",
            getattr(c, "status", ""),
            "Yes" if c.is_newsletter_subscribed else "No",
            c.created_at.isoformat() if c.created_at else "",
        ])

    output.seek(0)
    filename = f"contacts_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8-sig")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# ─────────────────────────────────────────────────────────────────────────────
# Media library
# ─────────────────────────────────────────────────────────────────────────────

import uuid
import os
import mimetypes
from fastapi import UploadFile, File, Form

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
ALLOWED_MIME_PREFIXES = ("image/", "video/", "application/pdf")
MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB


def _mime_allowed(mime: str) -> bool:
    return any(mime.startswith(p) for p in ALLOWED_MIME_PREFIXES)


@router.post("/media", status_code=201, dependencies=[Depends(require_permission("can_manage_content"))])
async def upload_media(
    file: UploadFile = File(...),
    folder: str = Form("uploads"),
    alt_text: str = Form(""),
    title: str = Form(""),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Upload a file to the media library."""
    mime = file.content_type or mimetypes.guess_type(file.filename or "")[0] or "application/octet-stream"
    if not _mime_allowed(mime):
        raise HTTPException(status_code=400, detail=f"File type '{mime}' not allowed")

    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 20 MB limit")

    ext = os.path.splitext(file.filename or "file")[1].lower()
    stored_name = f"{uuid.uuid4().hex}{ext}"
    folder_path = os.path.join(UPLOAD_DIR, folder)
    os.makedirs(folder_path, exist_ok=True)

    dest = os.path.join(folder_path, stored_name)
    with open(dest, "wb") as f:
        f.write(contents)

    file_url = f"/uploads/{folder}/{stored_name}"
    relative_path = f"{folder}/{stored_name}"

    media = MediaFile(
        filename=stored_name,
        original_filename=file.filename or stored_name,
        file_path=relative_path,
        file_url=file_url,
        file_size=len(contents),
        mime_type=mime,
        extension=ext.lstrip("."),
        alt_text=alt_text or None,
        title=title or None,
        folder=folder,
        uploaded_by=current_user.username,
    )
    db.add(media)
    await db.commit()
    await db.refresh(media)

    return {
        "id": media.id,
        "url": media.file_url,
        "filename": media.original_filename,
        "size": media.file_size,
        "mime_type": media.mime_type,
        "message": "File uploaded successfully",
    }


@router.get("/media")
async def list_media(
    skip: int = Query(0, ge=0),
    limit: int = Query(30, ge=1, le=100),
    folder: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    mime_prefix: Optional[str] = Query(None, description="Filter by mime prefix, e.g. 'image/'"),
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """List uploaded media files."""
    query = select(MediaFile)
    conditions = []
    if folder:
        conditions.append(MediaFile.folder == folder)
    if search:
        conditions.append(
            or_(MediaFile.original_filename.ilike(f"%{search}%"), MediaFile.title.ilike(f"%{search}%"))
        )
    if mime_prefix:
        conditions.append(MediaFile.mime_type.ilike(f"{mime_prefix}%"))
    if conditions:
        query = query.where(and_(*conditions))

    total = await db.scalar(select(func.count()).select_from(query.subquery()))
    rows = await db.execute(query.order_by(MediaFile.created_at.desc()).offset(skip).limit(limit))
    files = rows.scalars().all()

    return {
        "total": total,
        "skip": skip,
        "limit": limit,
        "items": [
            {
                "id": f.id,
                "url": f.file_url,
                "filename": f.original_filename,
                "title": f.title,
                "alt_text": f.alt_text,
                "folder": f.folder,
                "mime_type": f.mime_type,
                "extension": f.extension,
                "file_size": f.file_size,
                "width": f.width,
                "height": f.height,
                "created_at": f.created_at.isoformat() if f.created_at else None,
            }
            for f in files
        ],
    }


@router.patch("/media/{media_id}", dependencies=[Depends(require_permission("can_manage_content"))])
async def update_media_meta(
    media_id: int,
    alt_text: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    tags: Optional[str] = None,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Update metadata of a media file."""
    media = await db.get(MediaFile, media_id)
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    if alt_text is not None:
        media.alt_text = alt_text
    if title is not None:
        media.title = title
    if description is not None:
        media.description = description
    if tags is not None:
        media.tags = tags

    await db.commit()
    return {"id": media_id, "message": "Updated"}


@router.delete("/media/{media_id}", dependencies=[Depends(require_permission("can_manage_content"))])
async def delete_media(
    media_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Delete a media file (removes from disk and database)."""
    media = await db.get(MediaFile, media_id)
    if not media:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Media not found")

    # Remove from disk
    disk_path = os.path.join(UPLOAD_DIR, media.file_path)
    if os.path.exists(disk_path):
        os.remove(disk_path)

    await db.delete(media)
    await db.commit()
    return {"id": media_id, "message": "Deleted"}


# ─────────────────────────────────────────────────────────────────────────────
# User management (super_admin only)
# ─────────────────────────────────────────────────────────────────────────────

def _user_dict(u: AdminUser) -> Dict[str, Any]:
    permissions = {field: bool(getattr(u, field, False)) for field in PERMISSION_FIELDS}
    return {
        "id": u.id,
        "username": u.username,
        "email": u.email,
        "first_name": u.first_name,
        "last_name": u.last_name,
        "full_name": f"{u.first_name} {u.last_name}".strip(),
        "role": u.role,
        "is_active": u.is_active,
        "is_verified": u.is_verified,
        **permissions,
        "last_login": u.last_login.isoformat() if u.last_login else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "failed_login_attempts": u.failed_login_attempts,
        "locked_until": u.locked_until.isoformat() if u.locked_until else None,
    }


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., min_length=5)
    password: str = Field(..., min_length=8)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field("admin", pattern=ROLE_PATTERN)
    applied_role_template_id: Optional[int] = None
    can_manage_audits: bool = True
    can_manage_users: bool = False
    can_view_analytics: bool = True
    can_export_data: bool = True
    can_manage_content: bool = False
    can_read_audits: bool = True
    can_write_audits: bool = True
    can_delete_audits: bool = False
    can_read_contacts: bool = True
    can_write_contacts: bool = True
    can_delete_contacts: bool = False
    can_publish_content: bool = False
    can_manage_cases: bool = False
    skip_email_verification: bool = False


class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = Field(None, pattern=ROLE_PATTERN)
    applied_role_template_id: Optional[int] = None
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    can_manage_audits: Optional[bool] = None
    can_manage_users: Optional[bool] = None
    can_view_analytics: Optional[bool] = None
    can_export_data: Optional[bool] = None
    can_manage_content: Optional[bool] = None
    can_read_audits: Optional[bool] = None
    can_write_audits: Optional[bool] = None
    can_delete_audits: Optional[bool] = None
    can_read_contacts: Optional[bool] = None
    can_write_contacts: Optional[bool] = None
    can_delete_contacts: Optional[bool] = None
    can_publish_content: Optional[bool] = None
    can_manage_cases: Optional[bool] = None
    skip_email_verification: Optional[bool] = None


class RoleTemplateCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = None
    role: str = Field("admin", pattern=ROLE_PATTERN)
    is_system: bool = False
    can_manage_audits: bool = True
    can_manage_users: bool = False
    can_view_analytics: bool = True
    can_export_data: bool = True
    can_manage_content: bool = False
    can_read_audits: bool = True
    can_write_audits: bool = True
    can_delete_audits: bool = False
    can_read_contacts: bool = True
    can_write_contacts: bool = True
    can_delete_contacts: bool = False
    can_publish_content: bool = False
    can_manage_cases: bool = False
    skip_email_verification: bool = False


class RoleTemplateUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    role: Optional[str] = Field(None, pattern=ROLE_PATTERN)
    is_system: Optional[bool] = None
    can_manage_audits: Optional[bool] = None
    can_manage_users: Optional[bool] = None
    can_view_analytics: Optional[bool] = None
    can_export_data: Optional[bool] = None
    can_manage_content: Optional[bool] = None
    can_read_audits: Optional[bool] = None
    can_write_audits: Optional[bool] = None
    can_delete_audits: Optional[bool] = None
    can_read_contacts: Optional[bool] = None
    can_write_contacts: Optional[bool] = None
    can_delete_contacts: Optional[bool] = None
    can_publish_content: Optional[bool] = None
    can_manage_cases: Optional[bool] = None
    skip_email_verification: Optional[bool] = None


def _role_template_dict(template: RoleTemplate) -> Dict[str, Any]:
    permissions = {field: bool(getattr(template, field, False)) for field in PERMISSION_FIELDS}
    return {
        "id": template.id,
        "name": template.name,
        "description": template.description,
        "role": template.role,
        "is_system": bool(template.is_system),
        **permissions,
        "created_at": template.created_at.isoformat() if template.created_at else None,
        "updated_at": template.updated_at.isoformat() if template.updated_at else None,
    }


def _apply_permissions(target: Any, source: Any) -> None:
    for field in PERMISSION_FIELDS:
        value = getattr(source, field, None)
        if value is not None:
            setattr(target, field, bool(value))


async def _get_role_template_or_404(db: AsyncSession, template_id: int) -> RoleTemplate:
    template = await db.get(RoleTemplate, template_id)
    if not template:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Role template not found")
    return template


class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8)


@router.get("/roles", dependencies=[Depends(require_permission("can_manage_users"))])
async def list_role_templates(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    rows = await db.execute(select(RoleTemplate).order_by(RoleTemplate.is_system.desc(), RoleTemplate.name.asc()))
    return [_role_template_dict(template) for template in rows.scalars().all()]


@router.post("/roles", status_code=201, dependencies=[Depends(require_permission("can_manage_users"))])
async def create_role_template(
    data: RoleTemplateCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    name = data.name.strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Role name is required")

    existing = await db.scalar(select(RoleTemplate).where(func.lower(RoleTemplate.name) == name))
    if existing:
        raise HTTPException(status_code=400, detail="Role template with this name already exists")

    template = RoleTemplate(
        name=name,
        description=(data.description or "").strip() or None,
        role=data.role,
        is_system=bool(data.is_system),
        created_by=current_user.id,
    )
    _apply_permissions(template, data)
    db.add(template)
    await db.commit()
    await db.refresh(template)
    return _role_template_dict(template)


@router.put("/roles/{role_id}", dependencies=[Depends(require_permission("can_manage_users"))])
async def update_role_template(
    role_id: int,
    data: RoleTemplateUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    template = await _get_role_template_or_404(db, role_id)
    update_data = data.model_dump(exclude_unset=True)

    if "name" in update_data:
        normalized_name = (update_data["name"] or "").strip().lower()
        if not normalized_name:
            raise HTTPException(status_code=400, detail="Role name is required")
        exists = await db.scalar(
            select(RoleTemplate).where(
                and_(func.lower(RoleTemplate.name) == normalized_name, RoleTemplate.id != role_id)
            )
        )
        if exists:
            raise HTTPException(status_code=400, detail="Role template with this name already exists")
        template.name = normalized_name

    if "description" in update_data:
        template.description = (update_data.get("description") or "").strip() or None
    if "role" in update_data and update_data["role"] is not None:
        template.role = update_data["role"]
    if "is_system" in update_data and update_data["is_system"] is not None:
        template.is_system = bool(update_data["is_system"])

    for field in PERMISSION_FIELDS:
        if field in update_data and update_data[field] is not None:
            setattr(template, field, bool(update_data[field]))

    await db.commit()
    await db.refresh(template)
    return _role_template_dict(template)


@router.delete("/roles/{role_id}", dependencies=[Depends(require_permission("can_manage_users"))])
async def delete_role_template(
    role_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    template = await _get_role_template_or_404(db, role_id)
    if template.is_system:
        raise HTTPException(status_code=400, detail="System role templates cannot be deleted")

    await db.delete(template)
    await db.commit()
    return {"id": role_id, "message": "Role template deleted"}


@router.post("/roles/{role_id}/apply/{user_id}", dependencies=[Depends(require_permission("can_manage_users"))])
async def apply_role_template(
    role_id: int,
    user_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    template = await _get_role_template_or_404(db, role_id)
    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.role = template.role
    _apply_permissions(user, template)
    if user.skip_email_verification:
        user.is_verified = True

    await db.commit()
    await db.refresh(user)
    return {"message": "Role template applied", "role_template": _role_template_dict(template), "user": _user_dict(user)}


@router.get("/users", dependencies=[Depends(require_permission("can_manage_users"))])
async def list_admin_users(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """List all admin users."""
    rows = await db.execute(select(AdminUser).order_by(AdminUser.created_at.asc()))
    users = rows.scalars().all()
    return [_user_dict(u) for u in users]


@router.get("/users/{user_id}", dependencies=[Depends(require_permission("can_manage_users"))])
async def get_admin_user(
    user_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Get single admin user."""
    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return _user_dict(user)


@router.post("/users", status_code=201)
async def create_admin_user(
    data: UserCreate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Create a new admin user (super_admin only)."""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    username = data.username.strip()
    email = data.email.strip().lower()
    first_name = data.first_name.strip()
    last_name = data.last_name.strip()
    if not username or not email or not first_name or not last_name:
        raise HTTPException(status_code=400, detail="username, email, first_name and last_name are required")

    existing = await db.scalar(select(AdminUser).where(or_(AdminUser.username == username, AdminUser.email == email)))
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already in use")

    role_template: Optional[RoleTemplate] = None
    if data.applied_role_template_id is not None:
        role_template = await _get_role_template_or_404(db, data.applied_role_template_id)

    auth_svc = AuthService()
    new_user = AdminUser(
        username=username,
        email=email,
        hashed_password=auth_svc.get_password_hash(data.password),
        first_name=first_name,
        last_name=last_name,
        role=role_template.role if role_template else data.role,
        is_active=True,
        is_verified=True,
        created_by=current_user.id,
    )
    if role_template:
        _apply_permissions(new_user, role_template)
    else:
        _apply_permissions(new_user, data)

    if new_user.skip_email_verification:
        new_user.is_verified = True
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Send invitation email (non-blocking — log errors but don't fail the request)
    email_svc = EmailService()
    if email_svc.is_configured() and not new_user.skip_email_verification:
        try:
            await email_svc.send_admin_invitation(
                email=email,
                username=username,
                temp_password=data.password,
            )
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning(f"Invitation email failed: {exc}")

    return {"id": new_user.id, "message": "User created successfully"}


@router.put("/users/{user_id}")
async def update_admin_user(
    user_id: int,
    data: UserUpdate,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Update an admin user (super_admin or self)."""
    if current_user.role != "super_admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    permission_fields = set(PERMISSION_FIELDS)
    privileged_fields = permission_fields | {"role", "is_active", "is_verified", "applied_role_template_id"}

    # Non-super-admin can only edit basic profile fields for themselves.
    if current_user.role != "super_admin":
        forbidden = [
            field
            for field, value in update_data.items()
            if field in privileged_fields and getattr(user, field, None) != value
        ]
        if forbidden:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot modify privileged fields: {', '.join(forbidden)}",
            )

    role_template_id = update_data.pop("applied_role_template_id", None)
    if role_template_id is not None:
        if current_user.role != "super_admin":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")
        role_template = await _get_role_template_or_404(db, role_template_id)
        user.role = role_template.role
        _apply_permissions(user, role_template)

    if "email" in update_data and update_data["email"] is not None:
        normalized_email = update_data["email"].strip().lower()
        duplicate = await db.scalar(
            select(AdminUser).where(and_(AdminUser.email == normalized_email, AdminUser.id != user_id))
        )
        if duplicate:
            raise HTTPException(status_code=400, detail="Email already in use")
        update_data["email"] = normalized_email

    if "first_name" in update_data and update_data["first_name"] is not None:
        update_data["first_name"] = update_data["first_name"].strip()
    if "last_name" in update_data and update_data["last_name"] is not None:
        update_data["last_name"] = update_data["last_name"].strip()

    for field, value in update_data.items():
        setattr(user, field, value)

    if user.skip_email_verification:
        user.is_verified = True

    await db.commit()
    await db.refresh(user)
    return {"id": user_id, "message": "User updated"}


@router.delete("/users/{user_id}")
async def delete_admin_user(
    user_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Delete an admin user (super_admin only, cannot delete self)."""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    # Prevent deleting the last super_admin
    if user.role == "super_admin":
        count = await db.scalar(
            select(func.count(AdminUser.id)).where(AdminUser.role == "super_admin")
        )
        if (count or 0) <= 1:
            raise HTTPException(
                status_code=400,
                detail="Cannot delete the last super_admin account",
            )

    await db.delete(user)
    await db.commit()
    return {"id": user_id, "message": "User deleted"}


@router.patch("/users/{user_id}/password")
async def reset_user_password(
    user_id: int,
    data: PasswordReset,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Reset a user's password (super_admin or self)."""
    if current_user.role != "super_admin" and current_user.id != user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")

    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    auth_svc = AuthService()
    user.hashed_password = auth_svc.get_password_hash(data.new_password)
    user.failed_login_attempts = 0
    user.locked_until = None
    await db.commit()
    return {"id": user_id, "message": "Password updated"}


@router.patch("/users/{user_id}/unlock")
async def unlock_user(
    user_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Unlock a locked user account."""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    user.locked_until = None
    user.failed_login_attempts = 0
    await db.commit()
    return {"id": user_id, "message": "Account unlocked"}


@router.post("/users/{user_id}/send-reset-email")
async def send_password_reset_email(
    user_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Send a password reset email to a user (super_admin only)."""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    user = await db.get(AdminUser, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    reset_token = secrets.token_urlsafe(32)
    # Store token in the user's password_reset_token field if model supports it,
    # otherwise just send the email (token validation handled separately).
    if hasattr(user, "password_reset_token"):
        user.password_reset_token = reset_token
        await db.commit()

    email_svc = EmailService()
    sent = await email_svc.send_password_reset(
        email=user.email,
        username=user.username,
        reset_token=reset_token,
    )
    if not sent:
        raise HTTPException(status_code=503, detail="Failed to send reset email. Check SMTP configuration.")

    return {"message": "Password reset email sent"}


# ── Audit Detail + Actions ──────────────────────────────────────────────────

@router.get("/audits/{audit_id}", dependencies=[Depends(require_permission("can_read_audits"))])
async def get_audit_detail(
    audit_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Return full audit data with AI result and PDF reports."""
    audit = await db.scalar(
        select(Audit)
        .where(Audit.id == audit_id)
        .options(selectinload(Audit.pdf_reports))
    )
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")

    # Fetch latest result (there may be multiple after reprocessing)
    result_row = await db.scalar(
        select(AuditResult)
        .where(AuditResult.audit_id == audit_id)
        .order_by(AuditResult.created_at.desc())
    )

    result_data: Optional[Dict[str, Any]] = None
    if result_row:
        result_data = {
            "maturity_score": result_row.maturity_score,
            "automation_potential": result_row.automation_potential,
            "roi_projection": result_row.roi_projection,
            "implementation_timeline": result_row.implementation_timeline,
            "strengths": result_row.strengths,
            "weaknesses": result_row.weaknesses,
            "opportunities": result_row.opportunities,
            "recommendations": result_row.recommendations,
            "process_scores": result_row.process_scores,
            "priority_areas": result_row.priority_areas,
            "estimated_savings": result_row.estimated_savings,
            "implementation_cost": result_row.implementation_cost,
            "payback_period": result_row.payback_period,
            "created_at": result_row.created_at.isoformat() if result_row.created_at else None,
        }

    return {
        "id": audit.id,
        "company_name": audit.company_name,
        "industry": audit.industry,
        "company_size": audit.company_size,
        "current_challenges": audit.current_challenges,
        "business_processes": audit.business_processes,
        "automation_goals": audit.automation_goals,
        "budget_range": audit.budget_range,
        "timeline": audit.timeline,
        "contact_email": audit.contact_email,
        "contact_name": audit.contact_name,
        "phone": audit.phone,
        "status": audit.status,
        "created_at": audit.created_at.isoformat() if audit.created_at else None,
        "updated_at": audit.updated_at.isoformat() if audit.updated_at else None,
        "result": result_data,
        "pdf_reports": [
            {
                "id": r.id,
                "filename": r.filename,
                "file_size": r.file_size,
                "report_type": r.report_type,
                "generated_at": r.generated_at.isoformat() if r.generated_at else None,
                "download_url": f"/reports/{r.filename}",
                "download_count": r.download_count,
            }
            for r in (audit.pdf_reports or [])
        ],
    }


@router.post("/audits/{audit_id}/reprocess", status_code=202, dependencies=[Depends(require_permission("can_write_audits"))])
async def reprocess_audit(
    audit_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Delete existing result, reset status to pending, and trigger background AI processing."""
    audit = await db.get(Audit, audit_id)
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")

    # Delete old results so they don't pollute the new run
    old_results = await db.execute(
        select(AuditResult).where(AuditResult.audit_id == audit_id)
    )
    for r in old_results.scalars().all():
        await db.delete(r)

    audit.status = "pending"
    await db.commit()

    # Build the same audit_data dict that the original submission creates
    audit_data = {
        "company_name": audit.company_name,
        "industry": audit.industry,
        "company_size": audit.company_size,
        "current_challenges": audit.current_challenges,
        "business_processes": audit.business_processes,
        "automation_goals": audit.automation_goals,
        "budget_range": audit.budget_range,
        "timeline": audit.timeline,
        "contact_email": audit.contact_email,
        "contact_name": audit.contact_name,
        "phone": audit.phone,
    }

    from services.ai_service import AIService
    ai_service = AIService()
    await ai_service.process_audit_async(str(audit_id), audit_data)

    return {"id": audit_id, "status": "pending", "message": "Audit reprocessing started"}


@router.post("/audits/{audit_id}/send-email", status_code=200, dependencies=[Depends(require_permission("can_write_audits"))])
async def send_audit_report_email(
    audit_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Send the audit report completion email to the client."""
    audit = await db.get(Audit, audit_id)
    if not audit:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Audit not found")

    if audit.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audit must be completed before sending the report email",
        )

    result_row = await db.scalar(
        select(AuditResult)
        .where(AuditResult.audit_id == audit_id)
        .order_by(AuditResult.created_at.desc())
    )
    if not result_row:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No audit result found to send",
        )

    analysis_result = {
        "maturity_score": result_row.maturity_score,
        "roi_projection": result_row.roi_projection,
        "timeline_estimate": result_row.implementation_timeline,
        "confidence_score": 0.85,
        "automation_opportunities": result_row.opportunities or [],
        "recommendations": result_row.recommendations or [],
    }

    base_url = os.getenv("FRONTEND_URL", "https://xteam.pro")
    report_url = f"{base_url}/audit/results/{audit_id}"

    email_service = EmailService()
    sent = await email_service.send_audit_completion_notification(
        contact_email=audit.contact_email,
        contact_name=audit.contact_name or "Client",
        company_name=audit.company_name,
        analysis_result=analysis_result,
        report_url=report_url,
    )

    if not sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send email. Check SMTP configuration.",
        )

    return {"id": audit_id, "message": f"Report email sent to {audit.contact_email}"}


# ── System Settings ─────────────────────────────────────────────────────────

# The SMTP category keys stored in system_settings table
_SMTP_KEYS = {"smtp_server", "smtp_port", "smtp_username", "smtp_password", "from_email", "from_name"}
_GENERAL_KEYS = {"site_name", "site_url", "support_email", "admin_email", "maintenance_mode"}


async def _get_settings_dict(db: AsyncSession, category: Optional[str] = None) -> Dict[str, Any]:
    """Load settings rows into a flat dict, masking sensitive values."""
    q = select(SystemSettings)
    if category:
        q = q.where(SystemSettings.category == category)
    rows = (await db.execute(q)).scalars().all()
    result: Dict[str, Any] = {}
    for row in rows:
        val = row.value_json if row.value_json is not None else row.value
        result[row.key] = "***" if row.is_sensitive else val
    return result


async def _upsert_setting(
    db: AsyncSession,
    key: str,
    value: Any,
    category: str,
    description: str = "",
    is_sensitive: bool = False,
    updated_by: Optional[int] = None,
) -> None:
    row = await db.scalar(select(SystemSettings).where(SystemSettings.key == key))
    if row is None:
        row = SystemSettings(key=key, category=category, description=description, is_sensitive=is_sensitive)
        db.add(row)
    if isinstance(value, (dict, list)):
        row.value_json = value
        row.value = None
    else:
        row.value = str(value) if value is not None else None
        row.value_json = None
    row.updated_by = updated_by


@router.get("/settings")
async def get_system_settings(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Return all system settings grouped by category."""
    smtp = await _get_settings_dict(db, "smtp")
    general = await _get_settings_dict(db, "general")
    return {"smtp": smtp, "general": general}


class SmtpSettingsBody(BaseModel):
    smtp_server: str = Field("smtp.gmail.com", max_length=255)
    smtp_port: int = Field(587, ge=1, le=65535)
    smtp_username: str = Field("", max_length=255)
    smtp_password: str = Field("", max_length=255)
    from_email: str = Field("", max_length=255)
    from_name: str = Field("XTeam.Pro", max_length=100)


class GeneralSettingsBody(BaseModel):
    site_name: str = Field("XTeam.Pro", max_length=100)
    site_url: str = Field("https://xteam.pro", max_length=255)
    support_email: str = Field("", max_length=255)
    admin_email: str = Field("", max_length=255)
    maintenance_mode: bool = Field(False)


class SystemSettingsBody(BaseModel):
    smtp: SmtpSettingsBody = Field(default_factory=SmtpSettingsBody)
    general: GeneralSettingsBody = Field(default_factory=GeneralSettingsBody)


@router.put("/settings")
async def update_system_settings(
    body: SystemSettingsBody,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Save all system settings. Requires super_admin."""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    smtp_data = body.smtp.model_dump()
    for key, val in smtp_data.items():
        await _upsert_setting(
            db, key, val, "smtp",
            is_sensitive=(key == "smtp_password"),
            updated_by=current_user.id,
        )

    general_data = body.general.model_dump()
    for key, val in general_data.items():
        await _upsert_setting(db, key, val, "general", updated_by=current_user.id)

    await db.commit()
    return {"message": "Settings saved"}


@router.post("/settings/test-smtp")
async def test_smtp_connection(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Test SMTP connection using stored credentials. Returns success or error detail."""
    if current_user.role != "super_admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Super admin required")

    rows = (await db.execute(
        select(SystemSettings).where(SystemSettings.category == "smtp")
    )).scalars().all()
    cfg: Dict[str, str] = {r.key: (r.value or "") for r in rows}

    server = cfg.get("smtp_server", "smtp.gmail.com")
    port = int(cfg.get("smtp_port", "587") or "587")
    username = cfg.get("smtp_username", "")
    password = cfg.get("smtp_password", "")

    import smtplib
    try:
        with smtplib.SMTP(server, port, timeout=10) as s:
            s.starttls()
            if username and password:
                s.login(username, password)
        return {"ok": True, "message": "SMTP connection successful"}
    except Exception as exc:
        return {"ok": False, "message": str(exc)}
