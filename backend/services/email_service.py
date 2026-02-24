import os
import smtplib
import asyncio
import logging
import concurrent.futures
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from typing import List, Optional, Dict, Any
from datetime import datetime
from jinja2 import Environment, FileSystemLoader, Template
from sqlalchemy.ext.asyncio import AsyncSession

from database.config import get_async_db
from models.contact import ContactInquiry

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_username)
        self.from_name = os.getenv("FROM_NAME", "XTeam.Pro")
        
        # Email templates directory
        self.templates_dir = "email_templates"
        self.ensure_templates_directory()
        
        # Setup Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=True
        )
        
        # Create default templates if they don't exist
        self.create_default_templates()
    
    def ensure_templates_directory(self):
        """Ensure email templates directory exists"""
        if not os.path.exists(self.templates_dir):
            os.makedirs(self.templates_dir)
    
    def create_default_templates(self):
        """Create default email templates"""
        templates = {
            "contact_confirmation.html": self._get_contact_confirmation_template(),
            "contact_notification.html": self._get_contact_notification_template(),
            "audit_completed.html": self._get_audit_completed_template(),
            "welcome.html": self._get_welcome_template(),
            "admin_invitation.html": self._get_admin_invitation_template(),
            "password_reset.html": self._get_password_reset_template(),
        }

        for filename, content in templates.items():
            filepath = os.path.join(self.templates_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(content)
    
    def _get_contact_confirmation_template(self) -> str:
        """Get contact form confirmation email template"""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Thank you for contacting XTeam.Pro</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .footer { padding: 20px; text-align: center; color: #666; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Thank You for Contacting Us!</h1>
        </div>
        <div class="content">
            <p>Dear {{ contact_name }},</p>
            
            <p>Thank you for reaching out to XTeam.Pro. We have received your inquiry and our team will review it shortly.</p>
            
            <h3>Your Inquiry Details:</h3>
            <ul>
                <li><strong>Company:</strong> {{ company }}</li>
                <li><strong>Inquiry Type:</strong> {{ inquiry_type }}</li>
                <li><strong>Submitted:</strong> {{ submitted_at }}</li>
            </ul>
            
            <p><strong>Your Message:</strong></p>
            <p style="background: white; padding: 15px; border-left: 4px solid #2563eb;">{{ message }}</p>
            
            <p>We typically respond within 24 hours during business days. If your inquiry is urgent, please don't hesitate to call us directly.</p>
            
            <p>In the meantime, you might be interested in:</p>
            <ul>
                <li><a href="https://xteam.pro/solutions">Our Solutions</a></li>
                <li><a href="https://xteam.pro/case-studies">Case Studies</a></li>
                <li><a href="https://xteam.pro/blog">Latest Blog Posts</a></li>
            </ul>
        </div>
        <div class="footer">
            <p>Best regards,<br>The XTeam.Pro Team</p>
            <p><a href="https://xteam.pro">www.xteam.pro</a> | <a href="mailto:info@xteam.pro">info@xteam.pro</a></p>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_contact_notification_template(self) -> str:
        """Get internal contact notification template"""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Contact Inquiry - XTeam.Pro</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .info-box { background: white; padding: 15px; margin: 10px 0; border-left: 4px solid #2563eb; }
        .urgent { border-left-color: #ef4444; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚨 New Contact Inquiry</h1>
        </div>
        <div class="content">
            <div class="info-box">
                <h3>Contact Information</h3>
                <p><strong>Name:</strong> {{ name }}</p>
                <p><strong>Email:</strong> {{ email }}</p>
                <p><strong>Phone:</strong> {{ phone or 'Not provided' }}</p>
                <p><strong>Company:</strong> {{ company or 'Not specified' }}</p>
            </div>

            <div class="info-box">
                <h3>Inquiry Details</h3>
                <p><strong>Type:</strong> {{ inquiry_type }}</p>
                <p><strong>Priority:</strong> {{ priority }}</p>
                <p><strong>Budget Range:</strong> {{ budget_range or 'Not specified' }}</p>
                <p><strong>Timeline:</strong> {{ timeline or 'Not specified' }}</p>
                <p><strong>Preferred Contact:</strong> {{ preferred_contact_method }}</p>
            </div>

            <div class="info-box {% if priority == 'urgent' %}urgent{% endif %}">
                <h3>Message</h3>
                <p>{{ message }}</p>
            </div>

            <div class="info-box">
                <h3>Submission Details</h3>
                <p><strong>Submitted:</strong> {{ submitted_at }}</p>
                <p><strong>Source:</strong> {{ source or 'Website contact form' }}</p>
                <p><strong>Newsletter Subscription:</strong> {{ 'Yes' if is_newsletter_subscribed else 'No' }}</p>
            </div>
            
            <p><strong>Action Required:</strong> Please follow up with this inquiry within 24 hours.</p>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_audit_completed_template(self) -> str:
        """Get audit completion notification template"""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Your Business Automation Assessment is Ready</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .results-box { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .score { font-size: 2em; font-weight: bold; color: #2563eb; text-align: center; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Your Assessment is Complete!</h1>
        </div>
        <div class="content">
            <p>Dear {{ contact_name }},</p>
            
            <p>Great news! We've completed the comprehensive business automation assessment for {{ company_name }}.</p>
            
            <div class="results-box">
                <h3>Key Results Summary</h3>
                <div class="score">{{ maturity_score }}/100</div>
                <p style="text-align: center;"><strong>Digital Maturity Score</strong></p>
                
                <p><strong>ROI Projection:</strong> {{ roi_projection }}%</p>
                <p><strong>Estimated Timeline:</strong> {{ timeline_estimate }}</p>
                <p><strong>Confidence Level:</strong> {{ (confidence_score * 100)|round }}%</p>
            </div>
            
            <div class="results-box">
                <h3>Top Automation Opportunities</h3>
                <ul>
                {% for opportunity in automation_opportunities[:3] %}
                    <li>{{ opportunity }}</li>
                {% endfor %}
                </ul>
            </div>
            
            <p>Your detailed assessment report includes:</p>
            <ul>
                <li>✅ Comprehensive maturity analysis</li>
                <li>✅ ROI projections and financial impact</li>
                <li>✅ Strategic recommendations</li>
                <li>✅ Implementation roadmap</li>
                <li>✅ Risk assessment and mitigation strategies</li>
            </ul>
            
            <p style="text-align: center;">
                <a href="{{ report_url }}" class="button">View Full Report</a>
            </p>
            
            <p>Ready to discuss these findings? Our automation experts are standing by to help you implement these recommendations.</p>
            
            <p style="text-align: center;">
                <a href="{{ consultation_url }}" class="button">Schedule Consultation</a>
            </p>
        </div>
        <div style="padding: 20px; text-align: center; color: #666;">
            <p>Best regards,<br>The XTeam.Pro Automation Team</p>
        </div>
    </div>
</body>
</html>
        """
    
    def _get_welcome_template(self) -> str:
        """Get welcome email template"""
        return """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to XTeam.Pro</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to XTeam.Pro!</h1>
        </div>
        <div class="content">
            <p>Dear {{ name }},</p>
            
            <p>Welcome to XTeam.Pro! We're excited to help you transform your business through intelligent automation.</p>
            
            <p>Here's what you can expect:</p>
            <ul>
                <li>🚀 Cutting-edge automation solutions</li>
                <li>📊 Data-driven insights and analytics</li>
                <li>🎯 Personalized recommendations</li>
                <li>💡 Expert guidance and support</li>
            </ul>
            
            <p>Get started by exploring our solutions:</p>
            <p style="text-align: center;">
                <a href="https://xteam.pro/solutions" class="button">Explore Solutions</a>
            </p>
        </div>
    </div>
</body>
</html>
        """
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        attachments: Optional[List[str]] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        Send email using SMTP
        """
        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            if cc:
                msg['Cc'] = ', '.join(cc)
            
            # Add text content
            if text_content:
                text_part = MIMEText(text_content, 'plain', 'utf-8')
                msg.attach(text_part)
            
            # Add HTML content
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)
            
            # Add attachments
            if attachments:
                for file_path in attachments:
                    if os.path.exists(file_path):
                        with open(file_path, 'rb') as attachment:
                            part = MIMEBase('application', 'octet-stream')
                            part.set_payload(attachment.read())
                        
                        encoders.encode_base64(part)
                        part.add_header(
                            'Content-Disposition',
                            f'attachment; filename= {os.path.basename(file_path)}'
                        )
                        msg.attach(part)
            
            recipients = [to_email]
            if cc:
                recipients.extend(cc)
            if bcc:
                recipients.extend(bcc)

            # Send via thread executor to avoid blocking the async event loop
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                await loop.run_in_executor(
                    executor,
                    self._send_smtp,
                    msg,
                    recipients
                )

            return True

        except Exception as e:
            logger.error(f"Error sending email: {str(e)}")
            return False

    def _send_smtp(self, msg: MIMEMultipart, recipients: list) -> None:
        """Synchronous SMTP send — runs in a thread executor."""
        with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
            server.starttls()
            if self.smtp_username and self.smtp_password:
                server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg, to_addrs=recipients)
    
    async def send_contact_confirmation(self, contact_inquiry: ContactInquiry) -> bool:
        """
        Send confirmation email to contact form submitter
        """
        try:
            template = self.jinja_env.get_template('contact_confirmation.html')
            
            html_content = template.render(
                name=contact_inquiry.name,
                company=contact_inquiry.company,
                inquiry_type=contact_inquiry.inquiry_type,
                message=contact_inquiry.message,
                submitted_at=contact_inquiry.created_at.strftime('%B %d, %Y at %I:%M %p')
            )

            subject = "Thank you for contacting XTeam.Pro - We'll be in touch soon!"

            return await self.send_email(
                to_email=contact_inquiry.email,
                subject=subject,
                html_content=html_content
            )

        except Exception as e:
            logger.error(f"Error sending contact confirmation: {str(e)}")
            return False
    
    async def send_contact_notification(self, contact_inquiry: ContactInquiry) -> bool:
        """
        Send notification email to admin about new contact inquiry
        """
        try:
            template = self.jinja_env.get_template('contact_notification.html')
            
            html_content = template.render(
                name=contact_inquiry.name,
                email=contact_inquiry.email,
                phone=contact_inquiry.phone,
                company=contact_inquiry.company,
                inquiry_type=contact_inquiry.inquiry_type,
                priority=contact_inquiry.priority,
                budget_range=contact_inquiry.budget_range,
                timeline=contact_inquiry.timeline,
                preferred_contact_method=contact_inquiry.preferred_contact_method,
                message=contact_inquiry.message,
                submitted_at=contact_inquiry.created_at.strftime('%B %d, %Y at %I:%M %p'),
                source=contact_inquiry.source,
                is_newsletter_subscribed=contact_inquiry.is_newsletter_subscribed
            )

            subject = f"New Contact Inquiry from {contact_inquiry.company or contact_inquiry.name}"
            
            # Send to admin email
            admin_email = os.getenv("ADMIN_EMAIL", "admin@xteam.pro")
            
            return await self.send_email(
                to_email=admin_email,
                subject=subject,
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending contact notification: {str(e)}")
            return False
    
    async def send_audit_completion_notification(
        self, 
        contact_email: str, 
        contact_name: str,
        company_name: str,
        analysis_result: Dict[str, Any],
        report_url: str
    ) -> bool:
        """
        Send audit completion notification
        """
        try:
            template = self.jinja_env.get_template('audit_completed.html')
            
            html_content = template.render(
                contact_name=contact_name,
                company_name=company_name,
                maturity_score=analysis_result['maturity_score'],
                roi_projection=analysis_result['roi_projection'],
                timeline_estimate=analysis_result['timeline_estimate'],
                confidence_score=analysis_result['confidence_score'],
                automation_opportunities=analysis_result['automation_opportunities'],
                report_url=report_url,
                consultation_url="https://xteam.pro/contact?type=consultation"
            )
            
            subject = f"🎉 Your Business Automation Assessment is Ready - {analysis_result['maturity_score']}/100 Score!"
            
            return await self.send_email(
                to_email=contact_email,
                subject=subject,
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending audit completion notification: {str(e)}")
            return False
    
    async def send_welcome_email(self, email: str, name: str) -> bool:
        """
        Send welcome email to new subscribers
        """
        try:
            template = self.jinja_env.get_template('welcome.html')
            
            html_content = template.render(name=name)
            
            subject = "Welcome to XTeam.Pro - Let's Transform Your Business Together!"
            
            return await self.send_email(
                to_email=email,
                subject=subject,
                html_content=html_content
            )
            
        except Exception as e:
            logger.error(f"Error sending welcome email: {str(e)}")
            return False
    
    def _get_admin_invitation_template(self) -> str:
        return """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>You're invited to XTeam.Pro Admin</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white !important; text-decoration: none; border-radius: 5px; }
        .credentials { background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; }
        .credential-row { display: flex; margin: 8px 0; }
        .label { font-weight: bold; width: 140px; color: #64748b; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to XTeam.Pro Admin</h1>
        </div>
        <div class="content">
            <p>Hello {{ username }},</p>
            <p>You have been invited to access the XTeam.Pro administration panel. Here are your login credentials:</p>
            <div class="credentials">
                <div class="credential-row">
                    <span class="label">Username:</span>
                    <span>{{ username }}</span>
                </div>
                <div class="credential-row">
                    <span class="label">Temporary Password:</span>
                    <span><strong>{{ temp_password }}</strong></span>
                </div>
            </div>
            <p>Please log in and change your password immediately.</p>
            <p style="text-align: center; margin: 24px 0;">
                <a href="{{ admin_url }}" class="button">Go to Admin Panel</a>
            </p>
            <p style="color: #ef4444; font-size: 14px;">
                ⚠️ This is a temporary password. Change it after your first login for security.
            </p>
        </div>
        <div class="footer">
            <p>XTeam.Pro &mdash; Business Automation Platform</p>
        </div>
    </div>
</body>
</html>"""

    def _get_password_reset_template(self) -> str:
        return """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset - XTeam.Pro Admin</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f8fafc; }
        .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background: #2563eb; color: white !important; text-decoration: none; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello {{ username }},</p>
            <p>A password reset has been requested for your XTeam.Pro admin account.</p>
            <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
            <p style="text-align: center; margin: 24px 0;">
                <a href="{{ reset_url }}" class="button">Reset My Password</a>
            </p>
            <p style="font-size: 14px; color: #64748b;">
                If you didn't request a password reset, please ignore this email or contact your administrator.
            </p>
            <p style="font-size: 12px; color: #94a3b8; word-break: break-all;">
                Or copy this link: {{ reset_url }}
            </p>
        </div>
        <div class="footer">
            <p>XTeam.Pro &mdash; Business Automation Platform</p>
        </div>
    </div>
</body>
</html>"""

    async def send_admin_invitation(
        self,
        email: str,
        username: str,
        temp_password: str,
        admin_url: str = "https://xteam.pro/admin/login",
    ) -> bool:
        """Send invitation email to a newly created admin user."""
        try:
            template = self.jinja_env.get_template("admin_invitation.html")
            html_content = template.render(
                username=username,
                temp_password=temp_password,
                admin_url=admin_url,
            )
            return await self.send_email(
                to_email=email,
                subject="You're invited to XTeam.Pro Admin Panel",
                html_content=html_content,
            )
        except Exception as e:
            logger.error(f"Error sending admin invitation: {str(e)}")
            return False

    async def send_password_reset(
        self,
        email: str,
        username: str,
        reset_token: str,
        base_url: str = "https://xteam.pro",
    ) -> bool:
        """Send password reset email to an admin user."""
        try:
            reset_url = f"{base_url}/admin/reset-password?token={reset_token}"
            template = self.jinja_env.get_template("password_reset.html")
            html_content = template.render(username=username, reset_url=reset_url)
            return await self.send_email(
                to_email=email,
                subject="Password Reset - XTeam.Pro Admin",
                html_content=html_content,
            )
        except Exception as e:
            logger.error(f"Error sending password reset email: {str(e)}")
            return False

    def is_configured(self) -> bool:
        """
        Check if email service is properly configured
        """
        return bool(self.smtp_username and self.smtp_password)