"""Append-only audit trail helper. Failures are logged, never raised — an audit
write must not break the operation it records."""
import logging

from apps.common.models import AuditLog

logger = logging.getLogger(__name__)


def record(action: str, user=None, organization=None, **meta) -> None:
    try:
        AuditLog.objects.create(
            action=action,
            user=user if getattr(user, "is_authenticated", False) else None,
            organization=organization,
            meta=meta,
        )
    except Exception:
        logger.warning("audit record failed for action=%s", action, exc_info=True)
