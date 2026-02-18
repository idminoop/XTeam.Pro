from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

from database.config import get_async_db
from models.contact import ContactInquiry
from services.email_service import EmailService

router = APIRouter(tags=["contact"])

# Pydantic models for request/response
class ContactSubmissionRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., pattern=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    phone: Optional[str] = Field(None, max_length=20)
    company: Optional[str] = Field(None, max_length=200)
    position: Optional[str] = Field(None, max_length=100)
    inquiry_type: str = Field(..., max_length=50)  # consultation, demo, partnership, support, other
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=10, max_length=2000)
    budget_range: Optional[str] = Field(None, max_length=50)
    timeline: Optional[str] = Field(None, max_length=50)
    preferred_contact_method: Optional[str] = Field("email", max_length=20)  # email, phone, both
    marketing_consent: bool = Field(False)
    source: Optional[str] = Field(None, max_length=100)  # website, referral, social, etc.

class ContactResponse(BaseModel):
    inquiry_id: str
    status: str
    message: str
    estimated_response_time: str

class ContactInquiryResponse(BaseModel):
    inquiry_id: str
    name: str
    email: str
    company: Optional[str]
    inquiry_type: str
    subject: str
    status: str
    created_at: datetime
    response_sent: bool


def _response_sent(status_value: str) -> bool:
    return status_value in {"responded", "closed"}


def _parse_inquiry_id(inquiry_id: str) -> int:
    try:
        return int(inquiry_id)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid inquiry id"
        )

@router.post("/contact-submit", response_model=ContactResponse)
async def submit_contact_inquiry(
    contact_data: ContactSubmissionRequest,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Submit a new contact inquiry
    """
    try:
        # Create contact inquiry record
        contact_inquiry = ContactInquiry(
            name=contact_data.name,
            email=contact_data.email,
            phone=contact_data.phone,
            company=contact_data.company,
            position=contact_data.position,
            inquiry_type=contact_data.inquiry_type,
            subject=contact_data.subject,
            message=contact_data.message,
            budget_range=contact_data.budget_range,
            timeline=contact_data.timeline,
            preferred_contact_method=contact_data.preferred_contact_method,
            is_newsletter_subscribed=contact_data.marketing_consent,
            source=contact_data.source,
            status="new",
            priority="medium"
        )
        
        db.add(contact_inquiry)
        await db.commit()
        await db.refresh(contact_inquiry)
        
        # Send notification email to admin
        email_service = EmailService()
        await email_service.send_contact_notification(contact_inquiry)
        
        # Send confirmation email to user
        await email_service.send_contact_confirmation(contact_inquiry)
        
        # Determine estimated response time based on inquiry type
        response_times = {
            "consultation": "24 hours",
            "demo": "4-6 hours",
            "partnership": "48 hours",
            "support": "2-4 hours",
            "other": "24-48 hours"
        }
        
        estimated_time = response_times.get(contact_data.inquiry_type, "24-48 hours")
        
        return ContactResponse(
            inquiry_id=str(contact_inquiry.id),
            status="received",
            message="Your inquiry has been received successfully. We will get back to you soon.",
            estimated_response_time=estimated_time
        )
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to submit contact inquiry: {str(e)}"
        )

@router.get("/inquiry/{inquiry_id}", response_model=ContactInquiryResponse)
async def get_contact_inquiry(
    inquiry_id: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get contact inquiry details by ID
    """
    try:
        inquiry_db_id = _parse_inquiry_id(inquiry_id)
        inquiry = await db.get(ContactInquiry, inquiry_db_id)
        if not inquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact inquiry not found"
            )
        
        return ContactInquiryResponse(
            inquiry_id=str(inquiry.id),
            name=inquiry.name,
            email=inquiry.email,
            company=inquiry.company,
            inquiry_type=inquiry.inquiry_type,
            subject=inquiry.subject,
            status=inquiry.status,
            created_at=inquiry.created_at,
            response_sent=_response_sent(inquiry.status)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get contact inquiry: {str(e)}"
        )

@router.get("/inquiries", response_model=List[ContactInquiryResponse])
async def get_contact_inquiries(
    skip: int = 0,
    limit: int = 50,
    status_filter: Optional[str] = None,
    inquiry_type_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Get list of contact inquiries with optional filtering
    """
    try:
        from sqlalchemy import select
        
        query = select(ContactInquiry)
        
        if status_filter:
            query = query.where(ContactInquiry.status == status_filter)
        
        if inquiry_type_filter:
            query = query.where(ContactInquiry.inquiry_type == inquiry_type_filter)
        
        query = query.offset(skip).limit(limit).order_by(ContactInquiry.created_at.desc())
        
        result = await db.execute(query)
        inquiries = result.scalars().all()
        
        return [
            ContactInquiryResponse(
                inquiry_id=str(inquiry.id),
                name=inquiry.name,
                email=inquiry.email,
                company=inquiry.company,
                inquiry_type=inquiry.inquiry_type,
                subject=inquiry.subject,
                status=inquiry.status,
                created_at=inquiry.created_at,
                response_sent=_response_sent(inquiry.status)
            )
            for inquiry in inquiries
        ]
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get contact inquiries: {str(e)}"
        )

@router.patch("/inquiry/{inquiry_id}/status")
async def update_inquiry_status(
    inquiry_id: str,
    new_status: str,
    db: AsyncSession = Depends(get_async_db)
):
    """
    Update contact inquiry status
    """
    try:
        inquiry_db_id = _parse_inquiry_id(inquiry_id)
        inquiry = await db.get(ContactInquiry, inquiry_db_id)
        if not inquiry:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact inquiry not found"
            )
        
        valid_statuses = ["new", "in_progress", "responded", "closed", "spam"]
        if new_status not in valid_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}"
            )
        
        inquiry.status = new_status
        inquiry.updated_at = datetime.utcnow()
        
        await db.commit()
        
        return {
            "inquiry_id": inquiry_id,
            "status": new_status,
            "message": "Status updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update inquiry status: {str(e)}"
        )
