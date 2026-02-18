import os
import io
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, black, white, grey
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from reportlab.graphics import renderPDF
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database.config import get_async_db
from models.audit import Audit, AuditResult, PDFReport

class PDFService:
    def __init__(self):
        self.reports_dir = "reports"
        self.ensure_reports_directory()
        
        # Define color scheme
        self.colors = {
            'primary': HexColor('#2563eb'),
            'secondary': HexColor('#64748b'),
            'success': HexColor('#10b981'),
            'warning': HexColor('#f59e0b'),
            'danger': HexColor('#ef4444'),
            'light': HexColor('#f8fafc'),
            'dark': HexColor('#1e293b')
        }
        
        # Setup styles
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()

    def _to_int_id(self, raw_id: Any) -> Any:
        try:
            return int(raw_id)
        except (TypeError, ValueError):
            return raw_id
    
    def ensure_reports_directory(self):
        """Ensure reports directory exists"""
        if not os.path.exists(self.reports_dir):
            os.makedirs(self.reports_dir)
    
    def _setup_custom_styles(self):
        """Setup custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            spaceAfter=30,
            textColor=self.colors['primary'],
            alignment=TA_CENTER
        ))
        
        # Heading style
        self.styles.add(ParagraphStyle(
            name='CustomHeading',
            parent=self.styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            spaceBefore=20,
            textColor=self.colors['dark'],
            borderWidth=0,
            borderColor=self.colors['primary'],
            borderPadding=5
        ))
        
        # Subheading style
        self.styles.add(ParagraphStyle(
            name='CustomSubheading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=8,
            spaceBefore=12,
            textColor=self.colors['secondary']
        ))
        
        # Body text style
        self.styles.add(ParagraphStyle(
            name='CustomBody',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            alignment=TA_JUSTIFY,
            textColor=black
        ))
        
        # Bullet point style
        self.styles.add(ParagraphStyle(
            name='BulletPoint',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=4,
            leftIndent=20,
            bulletIndent=10,
            textColor=black
        ))
    
    async def generate_audit_report(
        self, 
        audit_id: str, 
        analysis_result: Dict[str, Any]
    ) -> str:
        """
        Generate comprehensive audit report PDF
        """
        try:
            audit_db_id = self._to_int_id(audit_id)
            async for db in get_async_db():
                # Get audit data
                audit = await db.get(Audit, audit_db_id)
                if not audit:
                    raise ValueError(f"Audit {audit_id} not found")
                
                # Generate filename
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"audit_report_{audit_id}_{timestamp}.pdf"
                filepath = os.path.join(self.reports_dir, filename)
                
                # Create PDF document
                doc = SimpleDocTemplate(
                    filepath,
                    pagesize=A4,
                    rightMargin=72,
                    leftMargin=72,
                    topMargin=72,
                    bottomMargin=18
                )
                
                # Build content
                story = []
                
                # Title page
                story.extend(self._build_title_page(audit, analysis_result))
                story.append(PageBreak())
                
                # Executive summary
                story.extend(self._build_executive_summary(analysis_result))
                story.append(PageBreak())
                
                # Detailed analysis
                story.extend(self._build_detailed_analysis(audit, analysis_result))
                story.append(PageBreak())
                
                # Recommendations
                story.extend(self._build_recommendations(analysis_result))
                story.append(PageBreak())
                
                # Implementation roadmap
                story.extend(self._build_implementation_roadmap(analysis_result))
                story.append(PageBreak())
                
                # Appendices
                story.extend(self._build_appendices(audit, analysis_result))
                
                # Build PDF
                doc.build(story)
                
                # Save PDF record to database
                pdf_report = PDFReport(
                    audit_id=audit_db_id,
                    filename=filename,
                    file_path=filepath,
                    file_size=os.path.getsize(filepath),
                    report_type="audit_analysis"
                )
                
                db.add(pdf_report)
                await db.commit()
                
                return filepath
                
        except Exception as e:
            logger.error(f"Error generating PDF report: {str(e)}")
            raise
    
    def _build_title_page(self, audit: Audit, analysis_result: Dict[str, Any]) -> List:
        """Build title page content"""
        content = []
        
        # Main title
        content.append(Spacer(1, 2*inch))
        content.append(Paragraph(
            "Business Process Automation Assessment",
            self.styles['CustomTitle']
        ))
        
        content.append(Spacer(1, 0.5*inch))
        
        # Company information
        company_info = f"""
        <b>Company:</b> {audit.company_name}<br/>
        <b>Industry:</b> {audit.industry}<br/>
        <b>Assessment Date:</b> {audit.created_at.strftime('%B %d, %Y')}<br/>
        <b>Report Generated:</b> {datetime.now().strftime('%B %d, %Y')}
        """
        
        content.append(Paragraph(company_info, self.styles['CustomBody']))
        content.append(Spacer(1, 1*inch))
        
        # Key metrics box
        metrics_data = [
            ['Metric', 'Score'],
            ['Digital Maturity Score', f"{analysis_result['maturity_score']}/100"],
            ['ROI Projection', f"{analysis_result['roi_projection']:.1f}%"],
            ['Confidence Level', f"{analysis_result['confidence_score']*100:.0f}%"]
        ]
        
        metrics_table = Table(metrics_data, colWidths=[3*inch, 2*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), self.colors['light']),
            ('GRID', (0, 0), (-1, -1), 1, self.colors['secondary'])
        ]))
        
        content.append(metrics_table)
        
        return content
    
    def _build_executive_summary(self, analysis_result: Dict[str, Any]) -> List:
        """Build executive summary section"""
        content = []
        
        content.append(Paragraph("Executive Summary", self.styles['CustomTitle']))
        content.append(Spacer(1, 0.3*inch))
        
        # Maturity assessment
        maturity_text = f"""
        Based on our comprehensive analysis, your organization demonstrates a digital maturity score of 
        <b>{analysis_result['maturity_score']}/100</b>. This assessment evaluates your current state across 
        key dimensions including process digitization, data integration, automation readiness, and 
        organizational change capacity.
        """
        
        content.append(Paragraph(maturity_text, self.styles['CustomBody']))
        content.append(Spacer(1, 0.2*inch))
        
        # ROI projection
        roi_text = f"""
        Our analysis projects a potential return on investment of <b>{analysis_result['roi_projection']:.1f}%</b> 
        through strategic automation initiatives. This projection is based on identified efficiency gains, 
        cost reduction opportunities, and revenue enhancement potential specific to your industry and 
        organizational context.
        """
        
        content.append(Paragraph(roi_text, self.styles['CustomBody']))
        content.append(Spacer(1, 0.2*inch))
        
        # Key opportunities
        content.append(Paragraph("Key Automation Opportunities", self.styles['CustomHeading']))
        
        for i, opportunity in enumerate(analysis_result['automation_opportunities'][:5], 1):
            content.append(Paragraph(
                f"{i}. {opportunity}",
                self.styles['BulletPoint']
            ))
        
        return content
    
    def _build_detailed_analysis(self, audit: Audit, analysis_result: Dict[str, Any]) -> List:
        """Build detailed analysis section"""
        content = []
        
        content.append(Paragraph("Detailed Analysis", self.styles['CustomTitle']))
        content.append(Spacer(1, 0.3*inch))
        
        # Current state assessment
        content.append(Paragraph("Current State Assessment", self.styles['CustomHeading']))
        
        processes_text = ', '.join(audit.business_processes) if isinstance(audit.business_processes, list) else str(audit.business_processes)
        challenges_text = ', '.join(audit.current_challenges) if isinstance(audit.current_challenges, list) else str(audit.current_challenges)
        goals_text = ', '.join(audit.automation_goals) if isinstance(audit.automation_goals, list) else str(audit.automation_goals)

        current_state_text = f"""
        <b>Company Profile:</b><br/>
        • Industry: {audit.industry}<br/>
        • Size: {audit.company_size}<br/>
        • Current Processes: {processes_text}<br/><br/>

        <b>Identified Challenges:</b><br/>
        {challenges_text}<br/><br/>

        <b>Automation Goals:</b><br/>
        {goals_text}
        """
        
        content.append(Paragraph(current_state_text, self.styles['CustomBody']))
        content.append(Spacer(1, 0.3*inch))
        
        # Risk assessment
        content.append(Paragraph("Risk Assessment", self.styles['CustomHeading']))
        content.append(Paragraph(analysis_result['risk_assessment'], self.styles['CustomBody']))
        content.append(Spacer(1, 0.3*inch))
        
        # Cost analysis
        content.append(Paragraph("Financial Analysis", self.styles['CustomHeading']))
        
        cost_analysis = analysis_result['cost_analysis']
        financial_data = [
            ['Financial Metric', 'Amount'],
            ['Estimated Investment', f"${cost_analysis['estimated_investment']:,.0f}"],
            ['Annual Savings', f"${cost_analysis['annual_savings']:,.0f}"],
            ['Payback Period', f"{cost_analysis['payback_period_months']} months"]
        ]
        
        financial_table = Table(financial_data, colWidths=[3*inch, 2*inch])
        financial_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), self.colors['primary']),
            ('TEXTCOLOR', (0, 0), (-1, 0), white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 11),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), self.colors['light']),
            ('GRID', (0, 0), (-1, -1), 1, self.colors['secondary'])
        ]))
        
        content.append(financial_table)
        
        return content
    
    def _build_recommendations(self, analysis_result: Dict[str, Any]) -> List:
        """Build recommendations section"""
        content = []
        
        content.append(Paragraph("Strategic Recommendations", self.styles['CustomTitle']))
        content.append(Spacer(1, 0.3*inch))
        
        content.append(Paragraph(
            "Based on our analysis, we recommend the following strategic initiatives:",
            self.styles['CustomBody']
        ))
        content.append(Spacer(1, 0.2*inch))
        
        for i, recommendation in enumerate(analysis_result['recommendations'], 1):
            content.append(Paragraph(
                f"<b>{i}. {recommendation}</b>",
                self.styles['CustomSubheading']
            ))
            content.append(Spacer(1, 0.1*inch))
        
        return content
    
    def _build_implementation_roadmap(self, analysis_result: Dict[str, Any]) -> List:
        """Build implementation roadmap section"""
        content = []
        
        content.append(Paragraph("Implementation Roadmap", self.styles['CustomTitle']))
        content.append(Spacer(1, 0.3*inch))
        
        content.append(Paragraph(
            f"<b>Estimated Timeline:</b> {analysis_result['timeline_estimate']}",
            self.styles['CustomBody']
        ))
        content.append(Spacer(1, 0.2*inch))
        
        content.append(Paragraph("Implementation Phases", self.styles['CustomHeading']))
        
        for i, phase in enumerate(analysis_result['implementation_roadmap'], 1):
            content.append(Paragraph(
                f"<b>Phase {i}:</b> {phase}",
                self.styles['BulletPoint']
            ))
        
        return content
    
    def _build_appendices(self, audit: Audit, analysis_result: Dict[str, Any]) -> List:
        """Build appendices section"""
        content = []
        
        content.append(Paragraph("Appendices", self.styles['CustomTitle']))
        content.append(Spacer(1, 0.3*inch))
        
        # Methodology
        content.append(Paragraph("Appendix A: Methodology", self.styles['CustomHeading']))
        methodology_text = """
        This assessment was conducted using advanced AI analysis combined with industry best practices 
        and benchmarking data. The evaluation framework considers multiple dimensions including:
        
        • Process complexity and automation potential
        • Technology readiness and integration requirements
        • Organizational change management capacity
        • Financial impact and ROI projections
        • Risk factors and mitigation strategies
        
        The confidence score reflects the reliability of our analysis based on data completeness 
        and industry-specific factors.
        """
        
        content.append(Paragraph(methodology_text, self.styles['CustomBody']))
        content.append(Spacer(1, 0.3*inch))
        
        # Contact information
        content.append(Paragraph("Appendix B: Next Steps", self.styles['CustomHeading']))
        next_steps_text = """
        To proceed with implementing these recommendations:
        
        1. Schedule a detailed consultation to discuss findings
        2. Conduct technical feasibility assessment
        3. Develop detailed project plan and timeline
        4. Begin pilot implementation with selected processes
        
        For questions about this assessment or to discuss implementation, 
        please contact our automation consulting team.
        """
        
        content.append(Paragraph(next_steps_text, self.styles['CustomBody']))
        
        return content
    
    def create_maturity_radar_chart(self, scores: Dict[str, int]) -> str:
        """
        Create radar chart for maturity assessment
        """
        try:
            # Create figure
            fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(projection='polar'))
            
            # Data for radar chart
            categories = list(scores.keys())
            values = list(scores.values())
            
            # Add first value at end to close the circle
            values += values[:1]
            
            # Calculate angles for each category
            angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
            angles += angles[:1]
            
            # Plot
            ax.plot(angles, values, 'o-', linewidth=2, color='#2563eb')
            ax.fill(angles, values, alpha=0.25, color='#2563eb')
            
            # Customize
            ax.set_xticks(angles[:-1])
            ax.set_xticklabels(categories)
            ax.set_ylim(0, 100)
            ax.set_yticks([20, 40, 60, 80, 100])
            ax.set_yticklabels(['20', '40', '60', '80', '100'])
            ax.grid(True)
            
            plt.title('Digital Maturity Assessment', size=16, weight='bold', pad=20)
            
            # Save chart
            chart_path = os.path.join(self.reports_dir, 'maturity_radar.png')
            plt.savefig(chart_path, dpi=300, bbox_inches='tight')
            plt.close()
            
            return chart_path
            
        except Exception as e:
            logger.error(f"Error creating radar chart: {str(e)}")
            return None
    
    async def get_report_by_id(self, report_id: str) -> Optional[PDFReport]:
        """
        Get PDF report by ID
        """
        async for db in get_async_db():
            report_db_id = self._to_int_id(report_id)
            return await db.get(PDFReport, report_db_id)
    
    async def list_reports_by_audit(self, audit_id: str) -> List[PDFReport]:
        """
        List all PDF reports for an audit
        """
        async for db in get_async_db():
            audit_db_id = self._to_int_id(audit_id)
            query = select(PDFReport).where(PDFReport.audit_id == audit_db_id)
            result = await db.execute(query)
            return result.scalars().all()
    
    def get_report_file_path(self, filename: str) -> str:
        """
        Get full file path for a report
        """
        return os.path.join(self.reports_dir, filename)
