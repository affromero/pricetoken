"""HTTP client for the PriceToken API."""

from __future__ import annotations

import json
import urllib.error
import urllib.parse
import urllib.request
from typing import Any

from pricetoken.types import (
    ModelHistory,
    ModelPricing,
    PriceTokenError,
    ProviderSummary,
    _parse_model_history,
    _parse_model_pricing,
    _parse_provider_summary,
)


class PriceTokenClient:
    """Typed client for the PriceToken REST API."""

    def __init__(
        self,
        *,
        base_url: str = "https://pricetoken.ai",
        api_key: str | None = None,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key

    def _request(self, path: str) -> Any:
        headers = {"Content-Type": "application/json"}
        if self._api_key:
            headers["Authorization"] = f"Bearer {self._api_key}"

        url = f"{self._base_url}{path}"
        req = urllib.request.Request(url, headers=headers)

        try:
            with urllib.request.urlopen(req) as resp:
                body = json.loads(resp.read().decode())
                return body["data"]
        except urllib.error.HTTPError as exc:
            try:
                error_body = json.loads(exc.read().decode())
                raise PriceTokenError(error_body["error"], exc.code) from exc
            except (json.JSONDecodeError, KeyError):
                raise PriceTokenError(f"HTTP {exc.code}", exc.code) from exc

    @staticmethod
    def _build_qs(params: dict[str, str | int | None]) -> str:
        filtered = {k: str(v) for k, v in params.items() if v is not None}
        if not filtered:
            return ""
        return "?" + urllib.parse.urlencode(filtered)

    def get_pricing(
        self,
        *,
        provider: str | None = None,
        currency: str | None = None,
        after: str | None = None,
        before: str | None = None,
    ) -> list[ModelPricing]:
        """Get current pricing for all models."""
        qs = self._build_qs({"provider": provider, "currency": currency, "after": after, "before": before})
        data: list[dict[str, Any]] = self._request(f"/api/v1/pricing{qs}")
        return [_parse_model_pricing(m) for m in data]

    def get_model(
        self,
        model_id: str,
        *,
        currency: str | None = None,
    ) -> ModelPricing:
        """Get pricing for a single model."""
        encoded = urllib.parse.quote(model_id, safe="")
        qs = self._build_qs({"currency": currency})
        data: dict[str, Any] = self._request(f"/api/v1/pricing/{encoded}{qs}")
        return _parse_model_pricing(data)

    def get_history(
        self,
        *,
        days: int | None = None,
        model_id: str | None = None,
        provider: str | None = None,
    ) -> list[ModelHistory]:
        """Get price history."""
        qs = self._build_qs({"days": days, "modelId": model_id, "provider": provider})
        data: list[dict[str, Any]] = self._request(f"/api/v1/pricing/history{qs}")
        return [_parse_model_history(m) for m in data]

    def get_providers(self) -> list[ProviderSummary]:
        """Get provider list with stats."""
        data: list[dict[str, Any]] = self._request("/api/v1/pricing/providers")
        return [_parse_provider_summary(p) for p in data]

    def compare(
        self,
        model_ids: list[str],
        *,
        currency: str | None = None,
    ) -> list[ModelPricing]:
        """Compare models side by side."""
        qs = self._build_qs({"models": ",".join(model_ids), "currency": currency})
        data: list[dict[str, Any]] = self._request(f"/api/v1/pricing/compare{qs}")
        return [_parse_model_pricing(m) for m in data]

    def get_cheapest(
        self,
        *,
        provider: str | None = None,
        currency: str | None = None,
        after: str | None = None,
        before: str | None = None,
    ) -> ModelPricing:
        """Get the cheapest model."""
        qs = self._build_qs({"provider": provider, "currency": currency, "after": after, "before": before})
        data: dict[str, Any] = self._request(f"/api/v1/pricing/cheapest{qs}")
        return _parse_model_pricing(data)
