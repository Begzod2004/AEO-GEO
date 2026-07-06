"""Central switch between *live* (real AI/provider APIs) and *mock* mode.

The whole platform must run end-to-end with `docker-compose up` even when no
AI API keys are configured. Every external adapter (AI gateway, embedding
service, ...) asks this module whether it should hit a real provider or fall
back to a deterministic mock. See ``docs/adr/001-mock-mode.md``.

Resolution rules
----------------
``AEO_MODE`` setting controls the global behaviour:

* ``"mock"`` — always use mocks, ignore any keys (great for CI / tests).
* ``"live"`` — always attempt the real provider (will error if a key is
  genuinely missing — that is intentional, it surfaces misconfiguration).
* ``"auto"`` (default) — use the real provider only when its API key is set,
  otherwise transparently fall back to the mock.
"""
from __future__ import annotations

from django.conf import settings

# Provider name -> Django setting holding its API key.
PROVIDER_KEY_SETTING: dict[str, str] = {
    "openai": "OPENAI_API_KEY",
    "anthropic": "ANTHROPIC_API_KEY",
    "gemini": "GOOGLE_AI_API_KEY",
}

AI_PROVIDERS: tuple[str, ...] = tuple(PROVIDER_KEY_SETTING)


def provider_has_key(provider: str) -> bool:
    """True when a non-empty API key is configured for ``provider``."""
    setting_name = PROVIDER_KEY_SETTING.get(provider)
    if not setting_name:
        return False
    return bool(str(getattr(settings, setting_name, "") or "").strip())


def is_live(provider: str) -> bool:
    """Whether ``provider`` should call its real API (vs. the mock)."""
    mode = getattr(settings, "AEO_MODE", "auto")
    if mode == "mock":
        return False
    if mode == "live":
        return True
    return provider_has_key(provider)


def global_mode() -> str:
    """Coarse mode label for health/status reporting: ``"live"`` or ``"mock"``.

    In ``auto`` mode we report ``live`` if *any* provider key is present.
    """
    mode = getattr(settings, "AEO_MODE", "auto")
    if mode in ("mock", "live"):
        return mode
    return "live" if any(provider_has_key(p) for p in AI_PROVIDERS) else "mock"


def provider_modes() -> dict[str, str]:
    """Per-provider mode map, useful for diagnostics and the health endpoint."""
    return {p: ("live" if is_live(p) else "mock") for p in AI_PROVIDERS}
