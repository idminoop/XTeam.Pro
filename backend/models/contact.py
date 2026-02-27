from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.sql import func
from database.config import Base


class ContactInquiry(Base):
    __tablename__ = "contact_inquiries"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Contact information
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)
    position = Column(String(100), nullable=True)
    
    # Inquiry details
    subject = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    inquiry_type = Column(String(50), nullable=False)  # consultation, support, partnership, other
    
    # Preferences
    preferred_contact_method = Column(String(50), default="email")  # email, phone, both
    budget_range = Column(String(50), nullable=True)
    timeline = Column(String(50), nullable=True)
    
    # Status tracking
    status = Column(String(50), default="new")  # new, contacted, qualified, converted, closed
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    assigned_to = Column(String(255), nullable=True)  # Staff member assigned
    tags = Column(String(500), nullable=True)  # comma separated
    score = Column(Integer, default=0)
    pipeline_stage = Column(String(50), default="new")  # new, contacted, qualified, converted, closed
    
    # Metadata
    source = Column(String(100), default="website")  # website, referral, social, etc.
    utm_source = Column(String(100), nullable=True)
    utm_medium = Column(String(100), nullable=True)
    utm_campaign = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Flags
    is_newsletter_subscribed = Column(Boolean, default=False)
    is_gdpr_compliant = Column(Boolean, default=True)
    is_spam = Column(Boolean, default=False)


class ContactNote(Base):
    __tablename__ = "contact_notes"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contact_inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    note = Column(Text, nullable=False)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ContactTask(Base):
    __tablename__ = "contact_tasks"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contact_inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(30), default="todo")  # todo, in_progress, done
    priority = Column(String(20), default="medium")  # low, medium, high, urgent
    assigned_to = Column(String(255), nullable=True)
    created_by = Column(String(100), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class ContactActivity(Base):
    __tablename__ = "contact_activities"

    id = Column(Integer, primary_key=True, index=True)
    contact_id = Column(Integer, ForeignKey("contact_inquiries.id", ondelete="CASCADE"), nullable=False, index=True)
    activity_type = Column(String(50), nullable=False)  # status_change, note_added, task_updated, email_sent, system
    message = Column(Text, nullable=False)
    metadata_json = Column("metadata", JSON, nullable=True)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), unique=True, nullable=False, index=True)
    subject = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    category = Column(String(50), default="general")
    is_active = Column(Boolean, default=True)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
