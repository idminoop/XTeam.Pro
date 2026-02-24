from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import csv
import io
import json
import secrets

from database.config import get_async_db
from models.admin import AdminUser, AuditConfiguration, SystemSettings
from models.audit import Audit, AuditResult, PDFReport
from models.contact import ContactInquiry
from models.blog import BlogPost
from models.media import MediaFile
from services.auth_service import AuthService
from services.analytics_service import AnalyticsService
from services.email_service import EmailService

router = APIRouter(tags=["admin"])
security = HTTPBearer()


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
def require_permission(permission: str):
    """Return a FastAPI dependency that enforces a specific permission."""
    async def _check(current_user: AdminUser = Depends(lambda c=Depends(security), db=Depends(get_async_db): get_current_admin_user(c, db))) -> AdminUser:
        if current_user.role == "super_admin":
            return current_user
        if not getattr(current_user, permission, False):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: '{permission}' required",
            )
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
    return {
        "id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "full_name": full_name,
        "role": current_user.role,
        "can_manage_audits": current_user.can_manage_audits,
        "can_manage_users": current_user.can_manage_users,
        "can_view_analytics": current_user.can_view_analytics,
        "can_export_data": current_user.can_export_data,
        "can_manage_content": current_user.can_manage_content,
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
        user_payload = {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": full_name,
            "role": user.role,
            "can_manage_audits": user.can_manage_audits,
            "can_manage_users": user.can_manage_users,
            "can_view_analytics": user.can_view_analytics,
            "can_export_data": user.can_export_data,
            "can_manage_content": user.can_manage_content,
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

@router.get("/audits", response_model=List[AuditManagementResponse])
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

@router.get("/contacts")
async def get_contacts_management(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status_filter: Optional[str] = Query(None),
    inquiry_type_filter: Optional[str] = Query(None),
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
        
        return [
            {
                "inquiry_id": str(contact.id),
                "name": contact.name,
                "email": contact.email,
                "company": contact.company,
                "inquiry_type": contact.inquiry_type,
                "subject": contact.subject,
                "status": contact.status,
                "priority": contact.priority,
                "created_at": contact.created_at,
                "response_sent": contact.status in {"responded", "closed"}
            }
            for contact in contacts
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get contacts: {str(e)}"
        )

@router.get("/contacts/{contact_id}")
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


@router.patch("/contacts/{contact_id}")
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
    # When marking as contacted, record timestamp
    if update_data.get("status") == "contacted" and contact.status == "new":
        contact.contacted_at = datetime.utcnow()

    for field, value in update_data.items():
        setattr(contact, field, value)

    await db.commit()
    return {"id": contact_id, "message": "Contact updated"}


@router.delete("/contacts/{contact_id}", status_code=204, dependencies=[Depends(require_permission("can_manage_audits"))])
async def delete_contact(
    contact_id: int,
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db),
):
    """Permanently delete a contact inquiry."""
    contact = await db.get(ContactInquiry, contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    await db.delete(contact)
    await db.commit()


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

@router.get("/submissions")
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


@router.get("/analytics")
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


@router.get("/analytics/blog")
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

@router.get("/analytics/overview")
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


@router.delete("/submissions/{submission_id}", dependencies=[Depends(require_permission("can_manage_audits"))])
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
    title: str = Field(..., min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    excerpt: Optional[str] = None
    content: str = Field(..., min_length=1)
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
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, max_length=255)
    excerpt: Optional[str] = None
    content: Optional[str] = None
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
                "title": p.title,
                "slug": p.slug,
                "excerpt": p.excerpt,
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
        "title": post.title,
        "slug": post.slug,
        "excerpt": post.excerpt,
        "content": post.content,
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
    base_slug = data.slug if data.slug else _slugify(data.title)
    slug = await _unique_slug(db, base_slug)

    word_count = len(data.content.split())
    reading_time = _calc_reading_time(data.content)

    published_at = datetime.utcnow() if data.status == "published" else None

    post = BlogPost(
        title=data.title,
        slug=slug,
        excerpt=data.excerpt,
        content=data.content,
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

    update_data = data.model_dump(exclude_unset=True)

    # Regenerate slug if title changed and no explicit slug given
    if "title" in update_data and "slug" not in update_data:
        update_data["slug"] = await _unique_slug(db, _slugify(update_data["title"]), exclude_id=post_id)
    elif "slug" in update_data and update_data["slug"]:
        update_data["slug"] = await _unique_slug(db, _slugify(update_data["slug"]), exclude_id=post_id)

    # Recalculate word count / reading time if content changed
    if "content" in update_data:
        update_data["word_count"] = len(update_data["content"].split())
        update_data["reading_time"] = _calc_reading_time(update_data["content"])

    # Set published_at when transitioning to published
    if "status" in update_data and update_data["status"] == "published" and post.published_at is None:
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

    copy = BlogPost(
        title=f"{original.title} (Copy)",
        slug=new_slug,
        excerpt=original.excerpt,
        content=original.content,
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
        word_count=original.word_count,
        reading_time=original.reading_time,
    )

    db.add(copy)
    await db.commit()
    await db.refresh(copy)

    return {"id": copy.id, "slug": copy.slug, "message": "Post duplicated as draft"}


@router.patch("/blog/{post_id}/status", dependencies=[Depends(require_permission("can_manage_content"))])
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
        "can_manage_audits": u.can_manage_audits,
        "can_manage_users": u.can_manage_users,
        "can_view_analytics": u.can_view_analytics,
        "can_export_data": u.can_export_data,
        "can_manage_content": u.can_manage_content,
        "last_login": u.last_login.isoformat() if u.last_login else None,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "failed_login_attempts": u.failed_login_attempts,
        "locked_until": u.locked_until.isoformat() if u.locked_until else None,
    }


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=100)
    email: str = Field(..., min_length=5)
    password: Optional[str] = Field(None, min_length=8)  # auto-generated if omitted
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    role: str = Field("admin", pattern="^(admin|super_admin|analyst)$")
    can_manage_audits: bool = True
    can_manage_users: bool = False
    can_view_analytics: bool = True
    can_export_data: bool = True
    can_manage_content: bool = False


class UserUpdate(BaseModel):
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = Field(None, pattern="^(admin|super_admin|analyst)$")
    is_active: Optional[bool] = None
    is_verified: Optional[bool] = None
    can_manage_audits: Optional[bool] = None
    can_manage_users: Optional[bool] = None
    can_view_analytics: Optional[bool] = None
    can_export_data: Optional[bool] = None
    can_manage_content: Optional[bool] = None


class PasswordReset(BaseModel):
    new_password: str = Field(..., min_length=8)


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

    # Check uniqueness
    existing = await db.scalar(
        select(AdminUser).where(
            or_(AdminUser.username == data.username, AdminUser.email == data.email)
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Username or email already in use")

    # Generate temporary password if not provided
    temp_password = data.password or secrets.token_urlsafe(9)

    auth_svc = AuthService()
    new_user = AdminUser(
        username=data.username,
        email=data.email,
        hashed_password=auth_svc.get_password_hash(temp_password),
        first_name=data.first_name,
        last_name=data.last_name,
        role=data.role,
        can_manage_audits=data.can_manage_audits,
        can_manage_users=data.can_manage_users,
        can_view_analytics=data.can_view_analytics,
        can_export_data=data.can_export_data,
        can_manage_content=data.can_manage_content,
        is_active=True,
        is_verified=True,
        created_by=current_user.id,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Send invitation email (non-blocking — log errors but don't fail the request)
    email_svc = EmailService()
    if email_svc.is_configured():
        try:
            await email_svc.send_admin_invitation(
                email=data.email,
                username=data.username,
                temp_password=temp_password,
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

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(user, field, value)

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

@router.get("/audits/{audit_id}")
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


@router.post("/audits/{audit_id}/reprocess", status_code=202)
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


@router.post("/audits/{audit_id}/send-email", status_code=200)
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
