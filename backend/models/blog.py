from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.sql import func
from database.config import Base


class BlogPost(Base):
    __tablename__ = "blog_posts"
    
    id = Column(Integer, primary_key=True, index=True)
    
    # Content
    title = Column(String(255), nullable=False)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    excerpt = Column(Text, nullable=True)
    content = Column(Text, nullable=False)

    # Bilingual content (required by admin flows, nullable for legacy rows)
    title_ru = Column(String(255), nullable=True)
    title_en = Column(String(255), nullable=True)
    excerpt_ru = Column(Text, nullable=True)
    excerpt_en = Column(Text, nullable=True)
    content_ru = Column(Text, nullable=True)
    content_en = Column(Text, nullable=True)
    
    # SEO
    meta_title = Column(String(255), nullable=True)
    meta_description = Column(Text, nullable=True)
    keywords = Column(String(500), nullable=True)
    
    # Media
    featured_image = Column(String(500), nullable=True)
    featured_image_alt = Column(String(255), nullable=True)
    
    # Categorization
    category = Column(String(100), nullable=False)  # AI, Automation, Case Studies, Industry Insights
    tags = Column(String(500), nullable=True)  # Comma-separated tags
    
    # Author information
    author_name = Column(String(255), nullable=False)
    author_email = Column(String(255), nullable=True)
    author_bio = Column(Text, nullable=True)
    
    # Publishing
    status = Column(String(20), default="draft")  # draft, published, archived
    published_at = Column(DateTime(timezone=True), nullable=True)
    
    # Engagement metrics
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    share_count = Column(Integer, default=0)
    
    # SEO metrics
    reading_time = Column(Integer, nullable=True)  # Estimated reading time in minutes
    word_count = Column(Integer, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Flags
    is_featured = Column(Boolean, default=False)
    allow_comments = Column(Boolean, default=True)
    is_seo_optimized = Column(Boolean, default=False)
