from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import csv
import io
import json

from database.config import get_async_db
from models.admin import AdminUser, AuditConfiguration
from models.audit import Audit, AuditResult
from models.contact import ContactInquiry
from models.blog import BlogPost
from services.auth_service import AuthService
from services.analytics_service import AnalyticsService

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
    token_type: str
    expires_in: int
    user_info: Dict[str, Any]

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

# Authentication dependency
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

@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(
    login_data: AdminLoginRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Admin user login
    """
    try:
        auth_service = AuthService()
        
        # Find user by username
        query = select(AdminUser).where(AdminUser.username == login_data.username)
        result = await db.execute(query)
        user = result.scalar_one_or_none()
        
        if not user or not auth_service.verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )
        
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is disabled"
            )
        
        # Update last login
        user.last_login = datetime.utcnow()
        await db.commit()
        
        # Generate JWT token
        access_token = auth_service.create_access_token(
            data={"sub": user.id, "username": user.username, "role": user.role}
        )
        
        full_name = " ".join(part for part in [user.first_name, user.last_name] if part).strip() or user.username

        return AdminLoginResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=3600,  # 1 hour
            user_info={
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "full_name": full_name,
                "role": user.role
            }
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

@router.get("/analytics")
async def get_analytics(
    current_user: AdminUser = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get analytics data for admin dashboard
    """
    try:
        # Calculate date ranges
        now = datetime.utcnow()
        month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Get total submissions
        total_submissions_query = select(func.count(Audit.id))
        total_submissions_result = await db.execute(total_submissions_query)
        total_submissions = total_submissions_result.scalar()
        
        # Get completed audits
        completed_audits_query = select(func.count(Audit.id)).where(Audit.status == "completed")
        completed_audits_result = await db.execute(completed_audits_query)
        completed_audits = completed_audits_result.scalar()
        
        # Get average maturity score
        avg_score_query = select(func.avg(AuditResult.maturity_score))
        avg_score_result = await db.execute(avg_score_query)
        avg_maturity_score = avg_score_result.scalar() or 0
        
        # Get total estimated savings (ROI proxy)
        total_roi_query = select(func.sum(AuditResult.estimated_savings))
        total_roi_result = await db.execute(total_roi_query)
        total_estimated_roi = total_roi_result.scalar() or 0
        
        # Calculate conversion rate
        conversion_rate = (completed_audits / total_submissions * 100) if total_submissions > 0 else 0
        
        # Get monthly data for charts
        monthly_submissions = []
        for i in range(12):
            month_date = now.replace(month=((now.month - i - 1) % 12) + 1)
            if month_date.month > now.month:
                month_date = month_date.replace(year=now.year - 1)
            
            month_end = month_date.replace(day=28) + timedelta(days=4)
            month_end = month_end - timedelta(days=month_end.day)
            
            month_query = select(func.count(Audit.id)).where(
                and_(Audit.created_at >= month_date, Audit.created_at <= month_end)
            )
            month_result = await db.execute(month_query)
            count = month_result.scalar()
            
            monthly_submissions.append({
                "month": month_date.strftime("%b %Y"),
                "submissions": count
            })
        
        monthly_submissions.reverse()
        
        return {
            "totalSubmissions": total_submissions,
            "completedAudits": completed_audits,
            "averageMaturityScore": round(avg_maturity_score, 1),
            "totalEstimatedROI": int(total_estimated_roi),
            "conversionRate": round(conversion_rate, 1),
            "monthlySubmissions": monthly_submissions
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get analytics: {str(e)}"
        )

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


@router.delete("/submissions/{submission_id}")
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


@router.get("/export")
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
