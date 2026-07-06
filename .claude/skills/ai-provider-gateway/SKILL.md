---
name: ai-provider-gateway
description: Use this skill whenever writing code that calls external AI model APIs (OpenAI, Anthropic, Gemini, or others) for AEO.GEO's monitoring or content generation features. Trigger for tasks like "send this prompt to ChatGPT and Claude," "compare AI responses across providers," or "add a new AI provider" — even if only one provider is mentioned, since the gateway must stay provider-agnostic.
---

# AI Provider Gateway (provider-agnostic client)

AEO.GEO must call multiple AI providers with the same prompt and compare results (that's the whole point of AI Monitoring). Never hardcode a single provider's SDK directly into business logic — always go through this gateway abstraction.

## Interface

```python
# apps/ai_monitoring/gateway.py
from dataclasses import dataclass

@dataclass
class AIResponse:
    provider: str
    text: str
    raw: dict
    error: str | None = None

class AIProviderGateway:
    def __init__(self):
        self._clients = {
            "openai": OpenAIClient(),
            "anthropic": AnthropicClient(),
            "gemini": GeminiClient(),
        }

    def query(self, provider: str, prompt: str, **kwargs) -> AIResponse:
        client = self._clients.get(provider)
        if not client:
            raise ValueError(f"Unknown provider: {provider}")
        try:
            return client.query(prompt, **kwargs)
        except Exception as e:
            return AIResponse(provider=provider, text="", raw={}, error=str(e))

    def query_all(self, prompt: str, providers: list[str] | None = None) -> list[AIResponse]:
        providers = providers or list(self._clients.keys())
        return [self.query(p, prompt) for p in providers]
```

## Per-provider clients (thin wrappers, same shape)

```python
class OpenAIClient:
    def __init__(self):
        from openai import OpenAI
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    def query(self, prompt: str, **kwargs) -> AIResponse:
        resp = self.client.chat.completions.create(
            model=kwargs.get("model", "gpt-4o-mini"),
            messages=[{"role": "user", "content": prompt}],
        )
        return AIResponse(provider="openai", text=resp.choices[0].message.content, raw=resp.model_dump())

class AnthropicClient:
    def __init__(self):
        import anthropic
        self.client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    def query(self, prompt: str, **kwargs) -> AIResponse:
        resp = self.client.messages.create(
            model=kwargs.get("model", "claude-sonnet-5"),
            max_tokens=1024,
            messages=[{"role": "user", "content": prompt}],
        )
        return AIResponse(provider="anthropic", text=resp.content[0].text, raw=resp.model_dump())

class GeminiClient:
    def __init__(self):
        import google.generativeai as genai
        genai.configure(api_key=settings.GOOGLE_AI_API_KEY)
        self.model = genai.GenerativeModel(kwargs.get("model", "gemini-2.0-flash") if False else "gemini-2.0-flash")

    def query(self, prompt: str, **kwargs) -> AIResponse:
        resp = self.model.generate_content(prompt)
        return AIResponse(provider="gemini", text=resp.text, raw={})
```

Adding a new provider (Perplexity, DeepSeek, Qwen, Mistral, Copilot) later means writing one more class matching this same `query(prompt) -> AIResponse` shape and registering it in `_clients` — nothing else in the codebase should change.

## Rate limits, retries, cost control

- Wrap every provider call with `tenacity` retry (max 3 attempts, exponential backoff) — third-party AI APIs fail transiently often.
- Always run provider calls inside Celery tasks, never inline in a Django view — a `query_all()` across providers can take 5-15+ seconds.
- Log token usage per call (`raw` field has usage data) into a `UsageLog` model early — this directly feeds the billing/cost model later (usage-based add-ons mentioned in the PRD).
- Cache identical `(provider, prompt)` calls within a short TTL (e.g. Redis, 1 hour) during development/testing to avoid burning API credits on repeated runs.

## Common mistakes to avoid

- Importing `openai`/`anthropic` SDKs directly inside `ai_monitoring` views or serializers instead of going through the gateway — breaks the "add a provider without touching business logic" property.
- Not handling partial failure — if Gemini errors but OpenAI succeeds, `query_all()` must still return the OpenAI result rather than raising for the whole batch (see the `error` field on `AIResponse`).
- Forgetting max_tokens/timeout settings — a hung request can block a Celery worker for the default client timeout (sometimes minutes).
- Never store raw API keys in code or version control — always via `.env` / Django settings from environment variables.
