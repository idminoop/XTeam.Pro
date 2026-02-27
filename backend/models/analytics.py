from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String
from sqlalchemy.sql import func

from database.config import Base


class AnalyticsGoal(Base):
    __tablename__ = "analytics_goals"

    id = Column(Integer, primary_key=True, index=True)
    metric = Column(String(100), nullable=False, index=True)
    target_value = Column(Float, nullable=False)
    period = Column(String(20), nullable=False, default="30d")
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

