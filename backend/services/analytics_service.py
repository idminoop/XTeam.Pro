import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
from sqlalchemy import func, select, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from database.config import get_async_db
from models.audit import Audit, AuditResult, PDFReport
from models.contact import ContactInquiry
from models.blog import BlogPost
from models.admin import AdminUser

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self):
        pass
    
    async def get_dashboard_stats(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Get comprehensive dashboard statistics
        """
        try:
            # Time periods
            now = datetime.utcnow()
            last_30_days = now - timedelta(days=30)
            last_7_days = now - timedelta(days=7)
            last_24_hours = now - timedelta(hours=24)
            
            # Audit statistics
            audit_stats = await self._get_audit_statistics(db, now, last_30_days, last_7_days)
            
            # Contact statistics
            contact_stats = await self._get_contact_statistics(db, now, last_30_days, last_7_days)
            
            # Content statistics
            content_stats = await self._get_content_statistics(db)
            
            # Performance metrics
            performance_stats = await self._get_performance_metrics(db, last_30_days)
            
            # Trend analysis
            trends = await self._get_trend_analysis(db, last_30_days)
            
            return {
                "overview": {
                    "total_audits": audit_stats["total"],
                    "total_contacts": contact_stats["total"],
                    "total_reports": audit_stats["total_reports"],
                    "active_users": content_stats["active_admins"]
                },
                "recent_activity": {
                    "audits_last_24h": audit_stats["last_24h"],
                    "contacts_last_24h": contact_stats["last_24h"],
                    "audits_last_7d": audit_stats["last_7d"],
                    "contacts_last_7d": contact_stats["last_7d"]
                },
                "monthly_stats": {
                    "audits_this_month": audit_stats["this_month"],
                    "contacts_this_month": contact_stats["this_month"],
                    "completion_rate": audit_stats["completion_rate"],
                    "response_rate": contact_stats["response_rate"]
                },
                "performance": performance_stats,
                "trends": trends,
                "content": content_stats
            }
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {str(e)}")
            return self._get_default_stats()
    
    async def _get_audit_statistics(self, db: AsyncSession, now: datetime, last_30_days: datetime, last_7_days: datetime) -> Dict[str, Any]:
        """
        Get audit-related statistics
        """
        try:
            # Total audits
            total_audits = await db.scalar(select(func.count(Audit.id)))

            # Audits in different time periods
            audits_last_24h = await db.scalar(
                select(func.count(Audit.id)).where(
                    Audit.created_at >= now - timedelta(hours=24)
                )
            )

            audits_last_7d = await db.scalar(
                select(func.count(Audit.id)).where(
                    Audit.created_at >= last_7_days
                )
            )

            audits_this_month = await db.scalar(
                select(func.count(Audit.id)).where(
                    Audit.created_at >= last_30_days
                )
            )

            # Completed audits
            completed_audits = await db.scalar(
                select(func.count(Audit.id)).where(Audit.status == 'completed')
            )

            # Total reports generated
            total_reports = await db.scalar(select(func.count(PDFReport.id)))

            # Completion rate
            completion_rate = (completed_audits / total_audits * 100) if total_audits > 0 else 0

            # Average maturity score
            avg_maturity = await db.scalar(
                select(func.avg(AuditResult.maturity_score)).where(
                    AuditResult.created_at >= last_30_days
                )
            ) or 0
            
            return {
                "total": total_audits or 0,
                "last_24h": audits_last_24h or 0,
                "last_7d": audits_last_7d or 0,
                "this_month": audits_this_month or 0,
                "completed": completed_audits or 0,
                "total_reports": total_reports or 0,
                "completion_rate": round(completion_rate, 2),
                "avg_maturity_score": round(float(avg_maturity), 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting audit statistics: {str(e)}")
            return {
                "total": 0, "last_24h": 0, "last_7d": 0, "this_month": 0,
                "completed": 0, "total_reports": 0, "completion_rate": 0,
                "avg_maturity_score": 0
            }
    
    async def _get_contact_statistics(self, db: AsyncSession, now: datetime, last_30_days: datetime, last_7_days: datetime) -> Dict[str, Any]:
        """
        Get contact-related statistics
        """
        try:
            # Total contacts
            total_contacts = await db.scalar(select(func.count(ContactInquiry.id)))

            # Contacts in different time periods
            contacts_last_24h = await db.scalar(
                select(func.count(ContactInquiry.id)).where(
                    ContactInquiry.created_at >= now - timedelta(hours=24)
                )
            )

            contacts_last_7d = await db.scalar(
                select(func.count(ContactInquiry.id)).where(
                    ContactInquiry.created_at >= last_7_days
                )
            )

            contacts_this_month = await db.scalar(
                select(func.count(ContactInquiry.id)).where(
                    ContactInquiry.created_at >= last_30_days
                )
            )

            # Responded contacts
            responded_contacts = await db.scalar(
                select(func.count(ContactInquiry.id)).where(
                    ContactInquiry.status.in_(['responded', 'resolved'])
                )
            )

            # Response rate
            response_rate = (responded_contacts / total_contacts * 100) if total_contacts > 0 else 0

            # Urgent inquiries (priority == 'urgent' and status == 'new')
            urgent_inquiries = await db.scalar(
                select(func.count(ContactInquiry.id)).where(
                    and_(
                        ContactInquiry.priority == 'urgent',
                        ContactInquiry.status == 'new'
                    )
                )
            )
            
            return {
                "total": total_contacts or 0,
                "last_24h": contacts_last_24h or 0,
                "last_7d": contacts_last_7d or 0,
                "this_month": contacts_this_month or 0,
                "responded": responded_contacts or 0,
                "response_rate": round(response_rate, 2),
                "urgent_pending": urgent_inquiries or 0
            }
            
        except Exception as e:
            logger.error(f"Error getting contact statistics: {str(e)}")
            return {
                "total": 0, "last_24h": 0, "last_7d": 0, "this_month": 0,
                "responded": 0, "response_rate": 0, "urgent_pending": 0
            }
    
    async def _get_content_statistics(self, db: AsyncSession) -> Dict[str, Any]:
        """
        Get content-related statistics
        """
        try:
            # Blog posts
            total_posts = await db.scalar(select(func.count(BlogPost.id)))

            published_posts = await db.scalar(
                select(func.count(BlogPost.id)).where(BlogPost.status == 'published')
            )

            draft_posts = await db.scalar(
                select(func.count(BlogPost.id)).where(BlogPost.status == 'draft')
            )

            # Active admins
            active_admins = await db.scalar(
                select(func.count(AdminUser.id)).where(AdminUser.is_active == True)
            )
            
            return {
                "total_posts": total_posts or 0,
                "published_posts": published_posts or 0,
                "draft_posts": draft_posts or 0,
                "active_admins": active_admins or 0
            }
            
        except Exception as e:
            logger.error(f"Error getting content statistics: {str(e)}")
            return {
                "total_posts": 0, "published_posts": 0,
                "draft_posts": 0, "active_admins": 0
            }
    
    async def _get_performance_metrics(self, db: AsyncSession, since_date: datetime) -> Dict[str, Any]:
        """
        Get performance metrics
        """
        try:
            # Average processing time for audits (join AuditResult to get completion time)
            avg_processing_time = await db.scalar(
                select(
                    func.avg(
                        func.extract('epoch', AuditResult.created_at - Audit.created_at)
                    )
                )
                .select_from(Audit)
                .join(AuditResult, AuditResult.audit_id == Audit.id)
                .where(
                    and_(
                        Audit.status == 'completed',
                        Audit.created_at >= since_date
                    )
                )
            )

            # Convert to minutes
            avg_processing_minutes = (avg_processing_time / 60) if avg_processing_time else 0

            # Success rate
            total_attempts = await db.scalar(
                select(func.count(Audit.id)).where(Audit.created_at >= since_date)
            )

            successful_attempts = await db.scalar(
                select(func.count(Audit.id)).where(
                    and_(
                        Audit.status == 'completed',
                        Audit.created_at >= since_date
                    )
                )
            )

            success_rate = (successful_attempts / total_attempts * 100) if total_attempts > 0 else 0

            # Error rate
            failed_attempts = await db.scalar(
                select(func.count(Audit.id)).where(
                    and_(
                        Audit.status == 'failed',
                        Audit.created_at >= since_date
                    )
                )
            )

            error_rate = (failed_attempts / total_attempts * 100) if total_attempts > 0 else 0
            
            return {
                "avg_processing_time_minutes": round(avg_processing_minutes, 2),
                "success_rate": round(success_rate, 2),
                "error_rate": round(error_rate, 2),
                "total_attempts": total_attempts or 0,
                "successful_attempts": successful_attempts or 0,
                "failed_attempts": failed_attempts or 0
            }
            
        except Exception as e:
            logger.error(f"Error getting performance metrics: {str(e)}")
            return {
                "avg_processing_time_minutes": 0,
                "success_rate": 0,
                "error_rate": 0,
                "total_attempts": 0,
                "successful_attempts": 0,
                "failed_attempts": 0
            }
    
    async def _get_trend_analysis(self, db: AsyncSession, since_date: datetime) -> Dict[str, Any]:
        """
        Get trend analysis data
        """
        try:
            # Daily audit submissions for the last 30 days
            daily_audits_result = await db.execute(
                select(
                    func.date_trunc('day', Audit.created_at).label('date'),
                    func.count(Audit.id).label('count')
                )
                .where(Audit.created_at >= since_date)
                .group_by(func.date_trunc('day', Audit.created_at))
                .order_by(func.date_trunc('day', Audit.created_at))
            )

            # Daily contact submissions
            daily_contacts_result = await db.execute(
                select(
                    func.date_trunc('day', ContactInquiry.created_at).label('date'),
                    func.count(ContactInquiry.id).label('count')
                )
                .where(ContactInquiry.created_at >= since_date)
                .group_by(func.date_trunc('day', ContactInquiry.created_at))
                .order_by(func.date_trunc('day', ContactInquiry.created_at))
            )

            # Industry distribution from Audit table (has industry column)
            industry_distribution_result = await db.execute(
                select(
                    Audit.industry.label('industry'),
                    func.count(Audit.id).label('count')
                )
                .where(Audit.created_at >= since_date)
                .group_by(Audit.industry)
                .order_by(desc(func.count(Audit.id)))
                .limit(10)
            )

            # Inquiry type distribution from ContactInquiry
            inquiry_type_distribution_result = await db.execute(
                select(
                    ContactInquiry.inquiry_type.label('type'),
                    func.count(ContactInquiry.id).label('count')
                )
                .where(ContactInquiry.created_at >= since_date)
                .group_by(ContactInquiry.inquiry_type)
                .order_by(desc(func.count(ContactInquiry.id)))
            )

            return {
                "daily_audits": [
                    {"date": row.date.isoformat(), "count": row.count}
                    for row in daily_audits_result.fetchall()
                ],
                "daily_contacts": [
                    {"date": row.date.isoformat(), "count": row.count}
                    for row in daily_contacts_result.fetchall()
                ],
                "industry_distribution": [
                    {"industry": row.industry, "count": row.count}
                    for row in industry_distribution_result.fetchall()
                ],
                "inquiry_type_distribution": [
                    {"type": row.type, "count": row.count}
                    for row in inquiry_type_distribution_result.fetchall()
                ]
            }

        except Exception as e:
            logger.error(f"Error getting trend analysis: {str(e)}")
            return {
                "daily_audits": [],
                "daily_contacts": [],
                "industry_distribution": [],
                "company_size_distribution": []
            }
    
    async def get_audit_analytics(self, db: AsyncSession, days: int = 30) -> Dict[str, Any]:
        """
        Get detailed audit analytics
        """
        try:
            since_date = datetime.utcnow() - timedelta(days=days)

            roi_case = func.case(
                (AuditResult.roi_projection < 100, '0-100%'),
                (AuditResult.roi_projection < 200, '100-200%'),
                (AuditResult.roi_projection < 300, '200-300%'),
                (AuditResult.roi_projection < 500, '300-500%'),
                else_='500%+'
            )

            # Maturity score distribution
            maturity_result = await db.execute(
                select(
                    func.floor(AuditResult.maturity_score / 10).label('score_range'),
                    func.count(AuditResult.id).label('count')
                )
                .where(AuditResult.created_at >= since_date)
                .group_by(func.floor(AuditResult.maturity_score / 10))
                .order_by(func.floor(AuditResult.maturity_score / 10))
            )

            # ROI projection distribution
            roi_result = await db.execute(
                select(
                    roi_case.label('roi_range'),
                    func.count(AuditResult.id).label('count')
                )
                .where(AuditResult.created_at >= since_date)
                .group_by(roi_case)
            )

            # Average maturity scores by industry (join Audit which has industry column)
            industry_result = await db.execute(
                select(
                    Audit.industry.label('industry'),
                    func.avg(AuditResult.maturity_score).label('avg_score'),
                    func.count(AuditResult.id).label('count')
                )
                .select_from(Audit)
                .join(AuditResult, Audit.id == AuditResult.audit_id)
                .where(AuditResult.created_at >= since_date)
                .group_by(Audit.industry)
                .order_by(desc(func.avg(AuditResult.maturity_score)))
            )

            return {
                "maturity_distribution": [
                    {
                        "range": f"{int(row.score_range * 10)}-{int(row.score_range * 10 + 9)}",
                        "count": row.count
                    }
                    for row in maturity_result.fetchall()
                ],
                "roi_distribution": [
                    {"range": row.roi_range, "count": row.count}
                    for row in roi_result.fetchall()
                ],
                "industry_performance": [
                    {
                        "industry": row.industry,
                        "avg_score": round(float(row.avg_score), 2),
                        "count": row.count
                    }
                    for row in industry_result.fetchall()
                ]
            }

        except Exception as e:
            logger.error(f"Error getting audit analytics: {str(e)}")
            return {
                "maturity_distribution": [],
                "roi_distribution": [],
                "industry_performance": []
            }

    async def get_recent_activities(self, db: AsyncSession, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get a unified recent activity feed for admin dashboard
        """
        try:
            audits_result = await db.execute(
                select(Audit.id, Audit.company_name, Audit.status, Audit.created_at)
                .order_by(Audit.created_at.desc())
                .limit(limit)
            )
            contacts_result = await db.execute(
                select(ContactInquiry.id, ContactInquiry.name, ContactInquiry.inquiry_type, ContactInquiry.created_at)
                .order_by(ContactInquiry.created_at.desc())
                .limit(limit)
            )
            blog_result = await db.execute(
                select(BlogPost.id, BlogPost.title, BlogPost.status, BlogPost.created_at)
                .order_by(BlogPost.created_at.desc())
                .limit(limit)
            )

            activities: List[Dict[str, Any]] = []

            for row in audits_result.fetchall():
                activities.append({
                    "type": "audit",
                    "description": f"Audit #{row.id} ({row.company_name}) is {row.status}",
                    "timestamp": row.created_at.isoformat() if row.created_at else None,
                })

            for row in contacts_result.fetchall():
                activities.append({
                    "type": "contact",
                    "description": f"New {row.inquiry_type} inquiry from {row.name}",
                    "timestamp": row.created_at.isoformat() if row.created_at else None,
                })

            for row in blog_result.fetchall():
                activities.append({
                    "type": "blog",
                    "description": f"Blog post '{row.title}' is {row.status}",
                    "timestamp": row.created_at.isoformat() if row.created_at else None,
                })

            activities.sort(key=lambda item: item.get("timestamp") or "", reverse=True)
            return activities[:limit]

        except Exception as e:
            logger.error(f"Error getting recent activities: {str(e)}")
            return []

    async def get_analytics_overview(
        self,
        db: AsyncSession,
        start_date: datetime,
        end_date: datetime
    ) -> Dict[str, Any]:
        """
        Get analytics summary for a custom time window
        """
        try:
            total_audits = await db.scalar(
                select(func.count(Audit.id)).where(
                    and_(Audit.created_at >= start_date, Audit.created_at <= end_date)
                )
            ) or 0

            completed_audits = await db.scalar(
                select(func.count(Audit.id)).where(
                    and_(
                        Audit.created_at >= start_date,
                        Audit.created_at <= end_date,
                        Audit.status == "completed"
                    )
                )
            ) or 0

            total_contacts = await db.scalar(
                select(func.count(ContactInquiry.id)).where(
                    and_(ContactInquiry.created_at >= start_date, ContactInquiry.created_at <= end_date)
                )
            ) or 0

            average_maturity_score = await db.scalar(
                select(func.avg(AuditResult.maturity_score))
                .select_from(AuditResult)
                .join(Audit, Audit.id == AuditResult.audit_id)
                .where(and_(Audit.created_at >= start_date, Audit.created_at <= end_date))
            ) or 0

            total_estimated_savings = await db.scalar(
                select(func.sum(AuditResult.estimated_savings))
                .select_from(AuditResult)
                .join(Audit, Audit.id == AuditResult.audit_id)
                .where(and_(Audit.created_at >= start_date, Audit.created_at <= end_date))
            ) or 0

            conversion_rate = (completed_audits / total_audits * 100) if total_audits > 0 else 0

            return {
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "days": (end_date - start_date).days
                },
                "totals": {
                    "audits": total_audits,
                    "completed_audits": completed_audits,
                    "contacts": total_contacts
                },
                "average_maturity_score": round(float(average_maturity_score), 1),
                "total_estimated_savings": float(total_estimated_savings),
                "conversion_rate": round(conversion_rate, 2)
            }

        except Exception as e:
            logger.error(f"Error getting analytics overview: {str(e)}")
            return {
                "period": {
                    "start_date": start_date.isoformat(),
                    "end_date": end_date.isoformat(),
                    "days": (end_date - start_date).days
                },
                "totals": {
                    "audits": 0,
                    "completed_audits": 0,
                    "contacts": 0
                },
                "average_maturity_score": 0.0,
                "total_estimated_savings": 0.0,
                "conversion_rate": 0.0
            }
    
    def _get_default_stats(self) -> Dict[str, Any]:
        """
        Return default statistics when database query fails
        """
        return {
            "overview": {
                "total_audits": 0,
                "total_contacts": 0,
                "total_reports": 0,
                "active_users": 0
            },
            "recent_activity": {
                "audits_last_24h": 0,
                "contacts_last_24h": 0,
                "audits_last_7d": 0,
                "contacts_last_7d": 0
            },
            "monthly_stats": {
                "audits_this_month": 0,
                "contacts_this_month": 0,
                "completion_rate": 0,
                "response_rate": 0
            },
            "performance": {
                "avg_processing_time_minutes": 0,
                "success_rate": 0,
                "error_rate": 0,
                "total_attempts": 0,
                "successful_attempts": 0,
                "failed_attempts": 0
            },
            "trends": {
                "daily_audits": [],
                "daily_contacts": [],
                "industry_distribution": [],
                "inquiry_type_distribution": []
            },
            "content": {
                "total_posts": 0,
                "published_posts": 0,
                "draft_posts": 0,
                "active_admins": 0
            }
        }
