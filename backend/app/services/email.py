"""
Email service using Resend.

Provides email functionality for password reset and future invite emails.
"""

import logging
from typing import Optional

from app.config import settings

logger = logging.getLogger(__name__)


class EmailService:
    """
    Service for sending emails via Resend.

    Uses the Resend API for transactional email delivery.
    Fails gracefully if the API key is not configured (development mode).
    """

    def __init__(self):
        """Initialize the service with Resend client if configured."""
        self._client = None
        self._from_email = settings.from_email

        if settings.resend_api_key:
            try:
                import resend
                resend.api_key = settings.resend_api_key
                self._client = resend
                logger.info("Resend email service initialized")
            except ImportError:
                logger.warning("Resend package not installed")
        else:
            logger.warning("RESEND_API_KEY not configured - emails will be logged only")

    @property
    def is_configured(self) -> bool:
        """Check if email service is properly configured."""
        return self._client is not None

    async def send_password_reset_email(
        self,
        to_email: str,
        reset_url: str,
        user_name: Optional[str] = None,
    ) -> bool:
        """
        Send a password reset email.

        Args:
            to_email: Recipient email address
            reset_url: URL for the password reset page (includes token)
            user_name: Optional user name for personalization

        Returns:
            True if email was sent successfully, False otherwise
        """
        greeting = f"Hi {user_name}," if user_name else "Hi,"

        subject = "Reset your CTLST Labs password"

        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #4a6741 0%, #7a9f70 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">CTLST Labs</h1>
    </div>

    <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e5e5; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px; margin-bottom: 20px;">{greeting}</p>

        <p style="font-size: 16px; margin-bottom: 20px;">
            We received a request to reset the password for your CTLST Labs account.
            Click the button below to create a new password:
        </p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="{reset_url}"
               style="display: inline-block; background-color: #4a6741; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                Reset Password
            </a>
        </div>

        <p style="font-size: 14px; color: #666; margin-bottom: 10px;">
            This link will expire in 30 minutes for security reasons.
        </p>

        <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            If you didn't request a password reset, you can safely ignore this email.
            Your password will remain unchanged.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 25px 0;">

        <p style="font-size: 12px; color: #999; text-align: center;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{reset_url}" style="color: #4a6741; word-break: break-all;">{reset_url}</a>
        </p>
    </div>

    <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
        <p>&copy; 2025 CTLST Labs. All rights reserved.</p>
    </div>
</body>
</html>
"""

        text_content = f"""{greeting}

We received a request to reset the password for your CTLST Labs account.

Reset your password by visiting:
{reset_url}

This link will expire in 30 minutes for security reasons.

If you didn't request a password reset, you can safely ignore this email.
Your password will remain unchanged.

---
CTLST Labs
"""

        return await self._send_email(
            to_email=to_email,
            subject=subject,
            html_content=html_content,
            text_content=text_content,
        )

    async def _send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: str,
    ) -> bool:
        """
        Internal method to send an email.

        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML version of the email
            text_content: Plain text version of the email

        Returns:
            True if email was sent successfully, False otherwise
        """
        if not self.is_configured:
            # Log the email details for development
            logger.info(
                f"[DEV MODE] Email would be sent:\n"
                f"  To: {to_email}\n"
                f"  Subject: {subject}\n"
                f"  Content: {text_content[:200]}..."
            )
            return True  # Return True in dev mode to allow flow to continue

        try:
            response = self._client.Emails.send({
                "from": self._from_email,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
                "text": text_content,
            })

            logger.info(f"Password reset email sent to {to_email}, id: {response.get('id')}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False


# Singleton instance for convenience
email_service = EmailService()
