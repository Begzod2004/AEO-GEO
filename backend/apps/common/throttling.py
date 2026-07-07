"""Anti-brute-force throttles. Rates come straight from Django settings so they
are env-configurable and easy to override in tests; a rate of ``None`` disables
the throttle entirely (the default while running the test suite)."""
from django.conf import settings
from rest_framework.throttling import AnonRateThrottle


class AuthRateThrottle(AnonRateThrottle):
    """Per-IP limit for credential endpoints (login/register/reset/invite)."""

    scope = "auth"

    def get_rate(self):
        return getattr(settings, "AUTH_THROTTLE_RATE", None)


class WaitlistRateThrottle(AnonRateThrottle):
    """Per-IP limit for the public marketing waitlist."""

    scope = "waitlist"

    def get_rate(self):
        return getattr(settings, "WAITLIST_THROTTLE_RATE", None)
