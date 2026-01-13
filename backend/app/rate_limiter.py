"""
Rate limiting configuration for TrainSmart API.
"""

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address


def get_real_client_ip(request: Request) -> str:
    """
    Extract the real client IP address, handling Cloud Run's X-Forwarded-For header.

    SECURITY: Cloud Run appends the real client IP as the rightmost entry in X-Forwarded-For.
    The leftmost entries can be spoofed by the client, so we must use the rightmost IP
    (added by our trusted infrastructure) to prevent rate limit bypass attacks.

    Format: "spoofed_by_client, ..., real_client_ip_from_cloud_run"
    """
    x_forwarded_for = request.headers.get("X-Forwarded-For")
    if x_forwarded_for:
        # Get the RIGHTMOST IP (added by Cloud Run load balancer, cannot be spoofed)
        ips = [ip.strip() for ip in x_forwarded_for.split(",")]
        return ips[-1]  # Last IP is from our trusted proxy
    # Fall back to direct connection IP
    return get_remote_address(request)


# Initialize rate limiter with custom key function for Cloud Run compatibility
limiter = Limiter(key_func=get_real_client_ip)
