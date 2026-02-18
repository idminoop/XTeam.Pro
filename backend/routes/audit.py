from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime

from database.config import get_db, get_async_db
from models.audit import Audit, AuditResult, PDFReport
from services.ai_service import AIService
from services.pdf_service import PDFService

router = APIRouter(tags=["audit"])


def _parse_audit_id(audit_id: str) -> int:
    try:
        return int(audit_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid audit id"
        )

# Pydantic models for request/response
class AuditSubmissionRequest(BaseModel):
    company_name: str = Field(..., min_length=1, max_length=200)
    industry: str = Field(..., min_length=1, max_length=100)
    company_size: str = Field(..., min_length=1, max_length=50)
    current_processes: List[str] = Field(..., min_items=1)
    pain_points: List[str] = Field(..., min_items=1)
    automation_goals: List[str] = Field(..., min_items=1)
    budget_range: Optional[str] = Field(None, max_length=50)
    timeline: Optional[str] = Field(None, max_length=50)
    contact_email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    contact_name: str = Field(..., min_length=1, max_length=100)
    contact_phone: Optional[str] = Field(None, max_length=20)

class AuditResponse(BaseModel):
    audit_id: str
    status: str
    message: str
    estimated_completion: Optional[datetime] = None

class AuditResultResponse(BaseModel):
    audit_id: str
    company_name: str
    maturity_score: int
    automation_potential: int
    roi_projection: float
    implementation_timeline: str
    strengths: List[str]
    weaknesses: List[str]
    opportunities: List[str]
    recommendations: List[str]
    process_scores: dict
    priority_areas: List[str]
    estimated_savings: Optional[float] = None
    implementation_cost: Optional[float] = None
    payback_period: Optional[float] = None
    pdf_report_url: Optional[str] = None
    created_at: datetime
    status: str

@router.post("/submit", response_model=AuditResponse)
async def submit_audit(
    audit_data: AuditSubmissionRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Submit a new audit request for AI analysis
    """
    try:
        # Create audit record
        audit = Audit(
            company_name=audit_data.company_name,
            industry=audit_data.industry,
            company_size=audit_data.company_size,
            current_challenges=audit_data.pain_points,  # Already a list
            business_processes=audit_data.current_processes,  # Already a list
            automation_goals=audit_data.automation_goals,  # Already a list
            budget_range=audit_data.budget_range or "Not specified",
            timeline=audit_data.timeline or "Not specified",
            contact_email=audit_data.contact_email,
            contact_name=audit_data.contact_name,
            phone=audit_data.contact_phone,
            status="processing"
        )
        
        db.add(audit)
        await db.commit()
        await db.refresh(audit)
        
        # Get the generated audit ID
        audit_id = str(audit.id)
        
        # Process audit with AI service (async)
        ai_service = AIService()
        await ai_service.process_audit_async(audit_id, audit_data.model_dump())
        
        return AuditResponse(
            audit_id=audit_id,
            status="processing",
            message="Audit submitted successfully. AI analysis in progress.",
            estimated_completion=datetime.utcnow().replace(microsecond=0)
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit audit: {str(e)}"
        )

@router.get("/results/{audit_id}", response_model=AuditResultResponse)
async def get_audit_results(
    audit_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get audit results by audit ID
    """
    try:
        audit_db_id = _parse_audit_id(audit_id)

        # Get audit
        audit = await db.get(Audit, audit_db_id)
        if not audit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audit not found"
            )
        
        # Get audit results
        result_query = select(AuditResult).where(AuditResult.audit_id == audit_db_id)
        result_rows = await db.execute(result_query)
        audit_result = result_rows.scalar_one_or_none()
        if not audit_result:
            if audit.status == "processing":
                raise HTTPException(
                    status_code=status.HTTP_202_ACCEPTED,
                    detail="Audit is still processing. Please try again later."
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Audit results not found"
                )
        
        # Get PDF report URL if available
        pdf_query = select(PDFReport).where(PDFReport.audit_id == audit_db_id)
        pdf_rows = await db.execute(pdf_query)
        pdf_report = pdf_rows.scalar_one_or_none()
        pdf_url = pdf_report.file_path if pdf_report else None
        
        return AuditResultResponse(
            audit_id=audit_id,
            company_name=audit.company_name,
            maturity_score=audit_result.maturity_score,
            automation_potential=audit_result.automation_potential,
            roi_projection=audit_result.roi_projection,
            implementation_timeline=audit_result.implementation_timeline,
            strengths=audit_result.strengths,
            weaknesses=audit_result.weaknesses,
            opportunities=audit_result.opportunities,
            recommendations=audit_result.recommendations,
            process_scores=audit_result.process_scores,
            priority_areas=audit_result.priority_areas,
            estimated_savings=audit_result.estimated_savings,
            implementation_cost=audit_result.implementation_cost,
            payback_period=audit_result.payback_period,
            pdf_report_url=pdf_url,
            created_at=audit.created_at,
            status=audit.status
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get audit results: {str(e)}"
        )

@router.get("/status/{audit_id}")
async def get_audit_status(
    audit_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get audit processing status
    """
    try:
        audit_db_id = _parse_audit_id(audit_id)
        audit = await db.get(Audit, audit_db_id)
        if not audit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audit not found"
            )
        
        return {
            "audit_id": audit_id,
            "status": audit.status,
            "created_at": audit.created_at,
            "updated_at": audit.updated_at
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get audit status: {str(e)}"
        )

@router.get("/download/{audit_id}")
async def download_audit_report(
    audit_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Download PDF audit report
    """
    try:
        audit_db_id = _parse_audit_id(audit_id)

        # Check if audit exists
        audit = await db.get(Audit, audit_db_id)
        if not audit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audit not found"
            )
        
        # Get PDF report
        pdf_query = select(PDFReport).where(PDFReport.audit_id == audit_db_id)
        pdf_rows = await db.execute(pdf_query)
        pdf_report = pdf_rows.scalar_one_or_none()
        if not pdf_report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF report not found"
            )
        
        # Return file response
        from fastapi.responses import FileResponse
        return FileResponse(
            path=pdf_report.file_path,
            filename=f"audit_report_{audit.company_name}_{audit_id[:8]}.pdf",
            media_type="application/pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to download report: {str(e)}"
        )
