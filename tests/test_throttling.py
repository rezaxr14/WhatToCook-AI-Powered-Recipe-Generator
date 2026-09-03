"""Rate limiting behaviour tests (429 shape, Retry-After, per-endpoint caps)."""

from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

TEST_RATES = {"demo": "2/min", "ai": "1/min", "catalog": "5/min"}


def _rates():
    from django.conf import settings

    cfg = dict(settings.REST_FRAMEWORK)
    cfg["DEFAULT_THROTTLE_RATES"] = TEST_RATES
    return cfg


@override_settings(REST_FRAMEWORK=_rates())
class ThrottlingTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()

    def _first_429(self, url: str, method: str = "post", max_attempts: int = 8):
        """POST until the endpoint answers 429; returns (attempt_index, response)."""
        for i in range(max_attempts):
            r = getattr(self.client, method)(url)
            if r.status_code == 429:
                return i, r
        self.fail(f"Endpoint {url} never throttled within {max_attempts} attempts")

    def test_demo_endpoint_429_with_retry_after(self):
        # Request #0 is anonymous (IP bucket); #1 establishes the session
        # (user bucket) -> the per-user 2/min cap trips on request #4.
        idx, r = self._first_429("/api/auth/demo/")
        self.assertEqual(idx, 3)
        body = r.json()
        self.assertEqual(body["error"], "rate_limited")
        self.assertIn("retry_after", body)
        self.assertTrue(int(r["Retry-After"]) >= 1)

    def test_health_probe_is_never_throttled(self):
        # /api/health has no throttle scope — probes must always pass.
        for _ in range(30):
            self.assertEqual(self.client.get("/api/health/").status_code, 200)

    def test_buckets_are_independent_per_scope(self):
        # Burning the "demo" bucket must not affect another scope.
        self._first_429("/api/auth/demo/")
        for _ in range(4):
            r = self.client.get("/api/ingredients/")
            self.assertEqual(r.status_code, 200)

    def test_error_body_is_consistent_json(self):
        idx, r = self._first_429("/api/auth/demo/")
        self.assertGreaterEqual(idx, 3)
        body = r.json()
        self.assertEqual(body["error"], "rate_limited")
        self.assertIsInstance(body["retry_after"], int)
        self.assertIsInstance(body["detail"], str)
