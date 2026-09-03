"""
Rate-limit configuration + a cache-based limiter for NON-DRF views.

Kept free of DRF imports so ``settings.py`` can load it at import time
without circular-import hazards (DRF itself imports Django settings).

See ``GetFood/throttles.py`` for the DRF throttle classes and the 429
exception handler; see ``WhatToCook/settings.py`` for wiring.
"""

import os
import time

from django.core.cache import cache
from django.http import JsonResponse

# ---------------------------------------------------------------------------
# Default rate table — every scope has a sane baseline, tunable via env.
# ---------------------------------------------------------------------------

DEFAULT_RATES: dict[str, str] = {
    # Read-only catalog (recipes, ingredients, pantries list/detail)
    "catalog": "240/min",
    # Cheap platform probes (stats)
    "stats": "120/min",
    # Session auth (login / logout / me)
    "auth": "15/min",
    # Account creation (brute-force / spam sensitive)
    "signup": "5/hour",
    # One-click demo session
    "demo": "20/min",
    # Cheap AI meta endpoints (provider & model listing)
    "ai_meta": "60/min",
    # Expensive generative endpoints (suggestions, recipe chat, SSE stream,
    # one-shot recipe generation).
    "ai": "12/min",
    "ai_hour": "60/hour",
    "ai_day": "150/day",
    # Smart-matching computation
    "can_cook": "60/min",
    # AI vision scans (paid model calls)
    "scan": "5/min",
    "scan_day": "40/day",
    # Pantry edits
    "pantry": "90/min",
    # Shopping list edits + reads
    "shopping": "180/min",
    # Telegram account linking (token generation)
    "telegram_link": "30/min",
    # Telegram bot webhook (Telegram retries bursts; keep headroom)
    "telegram_webhook": "120/min",
}


def load_rates() -> dict[str, str]:
    """Merge env overrides on top of the baseline table.

    THROTTLE_RATES="ai=20/min;signup=10/hour"   (semicolon separated)
    """
    rates = dict(DEFAULT_RATES)
    raw = os.environ.get("THROTTLE_RATES", "").strip()
    if not raw:
        return rates
    for pair in raw.split(";"):
        pair = pair.strip()
        if not pair or "=" not in pair:
            continue
        scope, _, rate = pair.partition("=")
        scope = scope.strip()
        rate = rate.strip()
        if scope and rate:
            rates[scope] = rate
    return rates


# ---------------------------------------------------------------------------
# Cache-based limiter for NON-DRF endpoints (legacy pages + telegram webhook)
# ---------------------------------------------------------------------------


def limit_exceeded(request, scope: str, limit: int, window_seconds: int = 60) -> bool:
    """Fixed-window counter for plain Django views.

    Returns True when the caller should be rejected (HTTP 429). Keyed per
    authenticated user, else per client IP, inside Django's cache so it
    shares the Redis backend with DRF throttling in production.
    """
    ident = getattr(request, "wtc_client_key", None)
    if ident is None:
        if request.user and request.user.is_authenticated:
            ident = f"u{request.user.pk}"
        else:
            xff = request.META.get("HTTP_X_FORWARDED_FOR", "")
            ip = xff.split(",")[0].strip() if xff else request.META.get("REMOTE_ADDR", "unknown")
            ident = f"i{ip}"
        request.wtc_client_key = ident

    window = int(time.time()) // window_seconds
    key = f"wtc:rl:{scope}:{ident}:{window}"
    try:
        count = cache.incr(key)
    except ValueError:
        cache.set(key, 1, timeout=window_seconds * 2 + 5)
        count = 1
    return count > limit


def rate_limited_json(request, scope: str, limit: int, window_seconds: int = 60) -> JsonResponse | None:
    """Return a 429 JsonResponse when the caller exceeded the limit,
    otherwise None (proceed normally)."""
    if limit_exceeded(request, scope, limit, window_seconds):
        response = JsonResponse(
            {
                "error": "rate_limited",
                "detail": "Rate limit exceeded. Please try again shortly.",
                "retry_after": window_seconds,
            },
            status=429,
        )
        response["Retry-After"] = str(window_seconds)
        return response
    return None
