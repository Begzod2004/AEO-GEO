"""Signed, time-limited invite tokens — no model, no migration, no extra library.

Uses Django's built-in ``signing`` (HMAC over SECRET_KEY). The token just carries
the invited user's id; the accept flow uses it to let them set a password. A used
invite is detected by the user already having a usable password.
"""
from django.core import signing

INVITE_SALT = "org-invite"
INVITE_MAX_AGE_SECONDS = 48 * 3600  # 48 hours


def make_invite_token(user_id: int) -> str:
    return signing.dumps({"uid": user_id}, salt=INVITE_SALT)


def read_invite_token(token: str) -> int | None:
    """Return the user id, or None if the token is invalid or expired."""
    try:
        data = signing.loads(token, salt=INVITE_SALT, max_age=INVITE_MAX_AGE_SECONDS)
    except signing.BadSignature:  # covers SignatureExpired too
        return None
    return data.get("uid")
