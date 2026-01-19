"""
Web Push provider using VAPID authentication.

Implements the Web Push protocol using pywebpush library.
Handles subscription validation and proper error handling for expired subscriptions.
"""

import json
import logging
from typing import Dict, Any, Optional

from pywebpush import webpush, WebPushException

from app.services.push_providers.base import PushProvider, PushResult
from app.config import settings

logger = logging.getLogger(__name__)


class WebPushProvider(PushProvider):
    """
    Web Push notification provider using VAPID authentication.

    Uses the pywebpush library to send notifications to web browsers
    that have subscribed via the Push API.
    """

    def __init__(
        self,
        vapid_private_key: Optional[str] = None,
        vapid_public_key: Optional[str] = None,
        vapid_subject: Optional[str] = None,
    ):
        """
        Initialize the Web Push provider.

        Args:
            vapid_private_key: VAPID private key (base64url encoded)
            vapid_public_key: VAPID public key (base64url encoded)
            vapid_subject: VAPID subject (mailto: or https: URL)

        If not provided, values are read from settings/environment.
        """
        self._vapid_private_key = vapid_private_key or getattr(settings, 'vapid_private_key', None)
        self._vapid_public_key = vapid_public_key or getattr(settings, 'vapid_public_key', None)
        self._vapid_subject = vapid_subject or getattr(settings, 'vapid_subject', None)

    @property
    def platform(self) -> str:
        """Return the platform identifier."""
        return "web"

    @property
    def vapid_claims(self) -> Dict[str, str]:
        """Get VAPID claims for authentication."""
        return {
            "sub": self._vapid_subject or "mailto:support@ctlstlabs.com",
        }

    @property
    def is_configured(self) -> bool:
        """Check if VAPID keys are configured."""
        return bool(self._vapid_private_key and self._vapid_public_key)

    async def send(
        self,
        endpoint: str,
        payload: Dict[str, Any],
        p256dh_key: Optional[str] = None,
        auth_key: Optional[str] = None,
        **kwargs,
    ) -> PushResult:
        """
        Send a web push notification.

        Args:
            endpoint: The push service endpoint URL
            payload: The notification payload
            p256dh_key: User's public key for encryption
            auth_key: User's auth secret for encryption
            **kwargs: Additional arguments (ignored)

        Returns:
            PushResult indicating success, failure, or expiration
        """
        if not self.is_configured:
            logger.error("Web push VAPID keys not configured")
            return PushResult.failed("VAPID keys not configured")

        if not p256dh_key or not auth_key:
            logger.error("Missing encryption keys for web push")
            return PushResult.failed("Missing p256dh_key or auth_key")

        # Build subscription info for pywebpush
        subscription_info = {
            "endpoint": endpoint,
            "keys": {
                "p256dh": p256dh_key,
                "auth": auth_key,
            }
        }

        # Format payload as JSON string
        formatted_payload = self.format_payload(payload)
        payload_json = json.dumps(formatted_payload)

        try:
            # Send the notification
            response = webpush(
                subscription_info=subscription_info,
                data=payload_json,
                vapid_private_key=self._vapid_private_key,
                vapid_claims=self.vapid_claims,
            )

            logger.info(f"Web push sent successfully to endpoint: {endpoint[:50]}...")
            return PushResult.success("Notification sent successfully")

        except WebPushException as e:
            return self._handle_webpush_error(e, endpoint)

        except Exception as e:
            logger.exception(f"Unexpected error sending web push: {e}")
            return PushResult.failed(f"Unexpected error: {str(e)}")

    def _handle_webpush_error(self, error: WebPushException, endpoint: str) -> PushResult:
        """
        Handle WebPushException and return appropriate PushResult.

        Specifically handles 410 (Gone) and 404 (Not Found) errors which
        indicate the subscription has expired and should be removed.

        Args:
            error: The WebPushException that was raised
            endpoint: The endpoint that failed (for logging)

        Returns:
            PushResult with appropriate status
        """
        status_code = error.response.status_code if error.response else None
        error_message = str(error)

        # 410 Gone - subscription has expired, should be removed
        if status_code == 410:
            logger.info(f"Subscription expired (410 Gone): {endpoint[:50]}...")
            return PushResult.expired("Subscription has expired (410 Gone)")

        # 404 Not Found - subscription doesn't exist, should be removed
        if status_code == 404:
            logger.info(f"Subscription not found (404): {endpoint[:50]}...")
            return PushResult.expired("Subscription not found (404)")

        # 401 Unauthorized - VAPID authentication failed
        if status_code == 401:
            logger.error(f"VAPID authentication failed (401): {error_message}")
            return PushResult.failed(
                "VAPID authentication failed - check VAPID keys",
                error_code=401,
            )

        # 429 Too Many Requests - rate limited
        if status_code == 429:
            logger.warning(f"Rate limited by push service (429): {endpoint[:50]}...")
            return PushResult.failed(
                "Rate limited by push service",
                error_code=429,
            )

        # 413 Payload Too Large
        if status_code == 413:
            logger.error(f"Payload too large (413): {error_message}")
            return PushResult.failed(
                "Notification payload too large",
                error_code=413,
            )

        # Other errors
        logger.error(f"Web push failed with status {status_code}: {error_message}")
        return PushResult.failed(
            f"Push failed: {error_message}",
            error_code=status_code,
        )

    def validate_subscription(
        self,
        endpoint: Optional[str] = None,
        p256dh_key: Optional[str] = None,
        auth_key: Optional[str] = None,
        **kwargs,
    ) -> bool:
        """
        Validate that a web push subscription has required fields.

        Args:
            endpoint: The push service endpoint URL
            p256dh_key: User's public key
            auth_key: User's auth secret
            **kwargs: Additional arguments (ignored)

        Returns:
            True if all required fields are present and valid
        """
        if not endpoint:
            return False

        if not p256dh_key or not auth_key:
            return False

        # Basic URL validation
        if not endpoint.startswith(("https://", "http://")):
            return False

        # Check for known push service domains (optional, for stricter validation)
        valid_domains = [
            "fcm.googleapis.com",
            "updates.push.services.mozilla.com",
            "notify.windows.com",
            "push.apple.com",
            # Add more as needed
        ]
        # Note: We don't strictly enforce this as new services may be added

        return True

    def format_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format the payload for web push notifications.

        Ensures the payload has the expected structure for service workers.

        Args:
            payload: The notification payload

        Returns:
            Formatted payload with required fields
        """
        # Ensure required fields exist
        formatted = {
            "title": payload.get("title", "TrainSmart"),
            "body": payload.get("body", ""),
            "icon": payload.get("icon", "/icons/icon-192x192.png"),
            "badge": payload.get("badge", "/icons/badge-72x72.png"),
            "data": payload.get("data", {}),
        }

        # Include optional fields if present
        optional_fields = ["tag", "actions", "requireInteraction", "silent", "image", "vibrate"]
        for field in optional_fields:
            if field in payload:
                formatted[field] = payload[field]

        return formatted
