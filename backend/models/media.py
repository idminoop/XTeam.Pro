from sqlalchemy import Column, Integer, String, BigInteger, DateTime, Boolean, Text
from sqlalchemy.sql import func
from database.config import Base


class MediaFile(Base):
    __tablename__ = "media_files"

    id = Column(Integer, primary_key=True, index=True)

    # File info
    filename = Column(String(255), nullable=False)          # stored name on disk
    original_filename = Column(String(255), nullable=False)  # user-uploaded name
    file_path = Column(String(500), nullable=False)          # relative path inside /uploads
    file_url = Column(String(500), nullable=False)           # public URL
    file_size = Column(BigInteger, default=0)                # bytes
    mime_type = Column(String(100), nullable=False)
    extension = Column(String(20), nullable=False)

    # Image-specific
    width = Column(Integer, nullable=True)
    height = Column(Integer, nullable=True)
    alt_text = Column(String(255), nullable=True)

    # Organisation
    folder = Column(String(255), default="uploads")
    tags = Column(String(500), nullable=True)
    title = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)

    # Metadata
    uploaded_by = Column(String(255), nullable=True)  # admin username
    is_public = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
