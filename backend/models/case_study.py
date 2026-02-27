from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, JSON
from sqlalchemy.sql import func

from database.config import Base


class CaseStudy(Base):
    __tablename__ = "case_studies"

    id = Column(Integer, primary_key=True, index=True)

    # Identity
    slug = Column(String(255), unique=True, nullable=False, index=True)

    # Bilingual content
    title_ru = Column(String(255), nullable=False)
    title_en = Column(String(255), nullable=False)
    industry_ru = Column(String(255), nullable=False)
    industry_en = Column(String(255), nullable=False)
    challenge_ru = Column(Text, nullable=False)
    challenge_en = Column(Text, nullable=False)
    solution_ru = Column(Text, nullable=False)
    solution_en = Column(Text, nullable=False)
    testimonial_ru = Column(Text, nullable=True)
    testimonial_en = Column(Text, nullable=True)

    # Business metadata
    client_company = Column(String(255), nullable=True)
    results = Column(JSON, nullable=False, default=list)
    roi = Column(String(100), nullable=True)
    time_saved = Column(String(100), nullable=True)
    featured_image = Column(String(500), nullable=True)

    # Publishing
    status = Column(String(20), default="draft", index=True)  # draft, published, archived
    is_featured = Column(Boolean, default=False)
    sort_order = Column(Integer, default=0)
    published_at = Column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
