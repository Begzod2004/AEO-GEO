"""Provider-agnostic gateway for querying AI answer engines.

Business logic (scans, scoring) never imports a provider SDK directly — it goes
through ``AIProviderGateway`` so adding a provider is one class + one registry
entry and nothing else changes. Per provider, the gateway picks the real SDK
client or a deterministic **mock** client via ``apps.common.mode.is_live`` — the
single mode switch (see ``docs/adr/001-mock-mode.md``).

The mock never imports any AI SDK, so the whole scan→score→dashboard chain runs
offline with no API keys. Live clients lazy-import their SDK (and ``tenacity``)
*inside* the call so those packages are only needed when a provider is live.
"""
from __future__ import annotations

import hashlib
from dataclasses import dataclass

from django.conf import settings

from apps.common import mode


@dataclass
class AIResponse:
    """Uniform result shape across every provider (live or mock)."""

    provider: str
    text: str
    raw: dict
    error: str | None = None
    # Structured signals the *mock* client fills directly (is_mentioned /
    # sentiment / citations). Left ``None`` for live responses — the scan then
    # derives them via ``apps.ai_monitoring.parsing.parse_response``.
    signals: dict | None = None


# ---------------------------------------------------------------------------
# Mock client (offline, deterministic, realistic — ADR 001 condition #1)
# ---------------------------------------------------------------------------
# A small pool of plausible source names an answer engine might cite.
_SOURCE_POOL = (
    "wikipedia.org",
    "g2.com",
    "trustpilot.com",
    "forbes.com",
    "techcrunch.com",
    "gartner.com",
    "capterra.com",
    "reddit.com/r/technology",
)


class MockClient:
    """Deterministic, offline provider used whenever a provider isn't live.

    Signals are derived from ``sha256(prompt + provider)`` so that, across a
    prompt set, they form a *realistic spread* rather than a constant (ADR 001):

    * ``is_mentioned`` — both ``True`` and ``False`` appear (~65% true).
    * ``sentiment`` — ``positive``, ``neutral`` **and** ``negative`` all appear.
    * ``citation_sources`` — sometimes ``[]``, sometimes a short list.

    A mock that always returns "mentioned + positive" is a bug.
    """

    def __init__(self, provider: str):
        self.provider = provider

    def query(self, prompt: str, **kwargs) -> AIResponse:
        digest = hashlib.sha256(f"{prompt}::{self.provider}".encode()).digest()

        is_mentioned = digest[0] % 100 < 65  # ~65% of the set is mentioned

        sentiment_roll = digest[1] % 100  # ~45% positive / 35% neutral / 20% negative
        if sentiment_roll < 45:
            sentiment = "positive"
        elif sentiment_roll < 80:
            sentiment = "neutral"
        else:
            sentiment = "negative"

        citations: list[str] = []
        if digest[2] % 100 >= 50:  # ~half of responses carry citations
            count = 1 + digest[3] % 2  # 1 or 2 sources
            start = digest[4] % len(_SOURCE_POOL)
            citations = [
                _SOURCE_POOL[(start + i) % len(_SOURCE_POOL)] for i in range(count)
            ]

        return AIResponse(
            provider=self.provider,
            text=self._synthesize(prompt, is_mentioned, sentiment),
            raw={"mock": True},
            signals={
                "is_mentioned": is_mentioned,
                "sentiment": sentiment,
                "citations": citations,
            },
        )

    @staticmethod
    def _synthesize(prompt: str, is_mentioned: bool, sentiment: str) -> str:
        """A short synthetic answer — realistic enough to exercise parsing."""
        opener = "Based on what I found, " if is_mentioned else "I don't have much on that, but "
        tone = {
            "positive": "the options here are well regarded and worth a look.",
            "neutral": "there are a few reasonable choices to compare.",
            "negative": "reviews are mixed and users report some concerns.",
        }[sentiment]
        return f"{opener}{tone} (re: {prompt.strip()[:80]})"


# ---------------------------------------------------------------------------
# Live clients — thin SDK wrappers, same query(prompt) -> AIResponse shape.
# SDKs and tenacity are imported lazily *inside* the call so mock mode never
# needs them installed.
# ---------------------------------------------------------------------------
def _retry_call(func):
    """Run ``func`` under a tenacity retry (3 attempts, exponential backoff).

    Third-party AI APIs fail transiently often. ``tenacity`` is lazy-imported so
    it is only a dependency when a provider actually runs live.
    """
    from tenacity import retry, stop_after_attempt, wait_exponential

    wrapped = retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        reraise=True,
    )(func)
    return wrapped()


class OpenAIClient:
    def query(self, prompt: str, **kwargs) -> AIResponse:
        from openai import OpenAI

        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        def _call():
            return client.chat.completions.create(
                model=kwargs.get("model", "gpt-4o-mini"),
                messages=[{"role": "user", "content": prompt}],
                timeout=30,
            )

        resp = _retry_call(_call)
        return AIResponse(
            provider="openai",
            text=resp.choices[0].message.content or "",
            raw=resp.model_dump(),
        )


class AnthropicClient:
    def query(self, prompt: str, **kwargs) -> AIResponse:
        import anthropic

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

        def _call():
            return client.messages.create(
                model=kwargs.get("model", "claude-sonnet-5"),
                max_tokens=1024,
                timeout=30,
                messages=[{"role": "user", "content": prompt}],
            )

        resp = _retry_call(_call)
        return AIResponse(
            provider="anthropic",
            text=resp.content[0].text if resp.content else "",
            raw=resp.model_dump(),
        )


class GeminiClient:
    def query(self, prompt: str, **kwargs) -> AIResponse:
        import google.generativeai as genai

        genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
        model = genai.GenerativeModel(kwargs.get("model", "gemini-2.0-flash"))

        def _call():
            return model.generate_content(prompt)

        resp = _retry_call(_call)
        return AIResponse(provider="gemini", text=getattr(resp, "text", "") or "", raw={})


# Provider name -> live client class (only instantiated when the provider is live).
_LIVE_CLIENTS = {
    "openai": OpenAIClient,
    "anthropic": AnthropicClient,
    "gemini": GeminiClient,
}


class AIProviderGateway:
    """Query one prompt across many providers, all returning ``AIResponse``.

    Client selection (live SDK vs. offline mock) happens once at construction via
    ``apps.common.mode.is_live`` — the one place the mode switch lives.
    """

    def __init__(self, providers: list[str] | None = None):
        self.providers = list(providers) if providers else list(mode.AI_PROVIDERS)
        self._clients = {p: self._build_client(p) for p in self.providers}

    @staticmethod
    def _build_client(provider: str):
        if provider not in _LIVE_CLIENTS:
            raise ValueError(f"Unknown provider: {provider}")
        if mode.is_live(provider):
            return _LIVE_CLIENTS[provider]()
        return MockClient(provider)

    def query(self, provider: str, prompt: str, **kwargs) -> AIResponse:
        client = self._clients.get(provider)
        if client is None:
            raise ValueError(f"Unknown provider: {provider}")
        try:
            return client.query(prompt, **kwargs)
        except Exception as exc:  # partial failure: one bad provider never fails the batch
            return AIResponse(provider=provider, text="", raw={}, error=str(exc))

    def query_all(
        self, prompt: str, providers: list[str] | None = None
    ) -> list[AIResponse]:
        providers = providers or self.providers
        return [self.query(p, prompt) for p in providers]
