"""Redis-backed refresh-token registry.

simplejwt refresh tokens are stateless by default. To support real logout /
revocation we record each issued refresh token's ``jti`` in the cache (Redis in
prod, LocMem in tests) with a TTL matching the token lifetime. Refresh is only
honoured while its jti is still present; logout deletes it.
"""
from django.conf import settings
from django.core.cache import cache

REFRESH_TTL_SECONDS = int(
    settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"].total_seconds()
)


def _key(user_id, jti: str) -> str:
    return f"refresh:{user_id}:{jti}"


def store_refresh(user_id, jti: str) -> None:
    cache.set(_key(user_id, jti), "valid", REFRESH_TTL_SECONDS)


def is_refresh_valid(user_id, jti: str) -> bool:
    return cache.get(_key(user_id, jti)) == "valid"


def revoke_refresh(user_id, jti: str) -> None:
    cache.delete(_key(user_id, jti))
