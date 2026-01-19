"""
Push notification providers.

This module contains provider implementations for different push notification platforms.
Currently supports:
- Web Push (using pywebpush and VAPID)

Future support planned for:
- Apple Push Notification Service (APNs) for iOS
- Firebase Cloud Messaging (FCM) for Android
"""

from app.services.push_providers.base import PushProvider, PushResult
from app.services.push_providers.web_push import WebPushProvider

__all__ = [
    "PushProvider",
    "PushResult",
    "WebPushProvider",
]
