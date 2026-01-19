"""
Abstract base class for push notification providers.

Defines the interface that all push providers must implement.
"""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, Dict, Any
from enum import Enum


class PushResultStatus(str, Enum):
    """Status of a push notification delivery attempt."""
    SUCCESS = "success"
    FAILED = "failed"
    EXPIRED = "expired"  # Subscription/token is no longer valid


@dataclass
class PushResult:
    """
    Result of a push notification delivery attempt.

    Attributes:
        status: Whether the push was successful, failed, or the subscription expired
        message: Human-readable description of the result
        should_deactivate: Whether the device token should be marked inactive
        error_code: Optional error code from the push service
        raw_response: Optional raw response from the push service
    """
    status: PushResultStatus
    message: str
    should_deactivate: bool = False
    error_code: Optional[int] = None
    raw_response: Optional[Any] = None

    @property
    def is_success(self) -> bool:
        """Check if the push was successful."""
        return self.status == PushResultStatus.SUCCESS

    @property
    def is_expired(self) -> bool:
        """Check if the subscription/token has expired."""
        return self.status == PushResultStatus.EXPIRED

    @classmethod
    def success(cls, message: str = "Notification sent successfully") -> "PushResult":
        """Create a successful result."""
        return cls(
            status=PushResultStatus.SUCCESS,
            message=message,
            should_deactivate=False,
        )

    @classmethod
    def failed(
        cls,
        message: str,
        error_code: Optional[int] = None,
        raw_response: Optional[Any] = None,
    ) -> "PushResult":
        """Create a failed result."""
        return cls(
            status=PushResultStatus.FAILED,
            message=message,
            should_deactivate=False,
            error_code=error_code,
            raw_response=raw_response,
        )

    @classmethod
    def expired(cls, message: str = "Subscription has expired") -> "PushResult":
        """Create an expired subscription result."""
        return cls(
            status=PushResultStatus.EXPIRED,
            message=message,
            should_deactivate=True,  # Mark for deactivation
        )


class PushProvider(ABC):
    """
    Abstract base class for push notification providers.

    Implement this interface to add support for new push notification platforms.
    Each provider handles the specifics of sending to their platform (web push,
    APNs, FCM, etc.).
    """

    @property
    @abstractmethod
    def platform(self) -> str:
        """
        Return the platform identifier this provider handles.

        Examples: 'web', 'ios', 'android'
        """
        pass

    @abstractmethod
    async def send(
        self,
        endpoint: str,
        payload: Dict[str, Any],
        **kwargs,
    ) -> PushResult:
        """
        Send a push notification to a device.

        Args:
            endpoint: The push service endpoint URL or device token
            payload: The notification payload (title, body, data, etc.)
            **kwargs: Provider-specific parameters (e.g., p256dh_key, auth_key for web push)

        Returns:
            PushResult indicating success, failure, or expiration
        """
        pass

    @abstractmethod
    def validate_subscription(self, **kwargs) -> bool:
        """
        Validate that a subscription/token has the required fields.

        Args:
            **kwargs: Subscription data to validate

        Returns:
            True if the subscription data is valid, False otherwise
        """
        pass

    def format_payload(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format the payload for this provider's requirements.

        Override this method if the provider needs specific payload formatting.
        Default implementation returns the payload as-is.

        Args:
            payload: The notification payload

        Returns:
            Formatted payload for this provider
        """
        return payload
