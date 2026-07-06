"""AI Monitoring: the Prompt Library and the per-provider ScanResult rows.

A ``Prompt`` is a question real users ask an AI answer engine ("What is the best
CRM?"). A scan runs each prompt through every configured provider and records, as
a ``ScanResult``, whether the organization was mentioned, the sentiment, and any
sources the answer cited — the raw signal the Dashboard scores roll up.
"""
from django.db import models

from apps.common.models import TimeStampedModel


class Prompt(TimeStampedModel):
    class Category(models.TextChoices):
        BRAND = "brand", "Brand"
        PRODUCT = "product", "Product"
        COMPARISON = "comparison", "Comparison"
        LOCAL = "local", "Local"
        FAQ = "faq", "FAQ"

    organization = models.ForeignKey(
        "organizations.Organization",
        on_delete=models.CASCADE,
        related_name="prompts",
    )
    text = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"[{self.category}] {self.text[:60]}"


class ScanResult(TimeStampedModel):
    class Provider(models.TextChoices):
        OPENAI = "openai", "OpenAI"
        ANTHROPIC = "anthropic", "Anthropic"
        GEMINI = "gemini", "Gemini"

    class Sentiment(models.TextChoices):
        POSITIVE = "positive", "Positive"
        NEUTRAL = "neutral", "Neutral"
        NEGATIVE = "negative", "Negative"

    prompt = models.ForeignKey(
        Prompt, on_delete=models.CASCADE, related_name="scan_results"
    )
    provider = models.CharField(max_length=20, choices=Provider.choices)
    response_text = models.TextField(blank=True)
    is_mentioned = models.BooleanField(default=False)
    sentiment = models.CharField(
        max_length=10, choices=Sentiment.choices, default=Sentiment.NEUTRAL
    )
    citation_sources = models.JSONField(default=list, blank=True)
    scanned_at = models.DateTimeField()

    class Meta:
        ordering = ("-scanned_at",)

    def __str__(self):
        return f"{self.provider} on prompt {self.prompt_id} (mentioned={self.is_mentioned})"
