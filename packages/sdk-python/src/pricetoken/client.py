"""HTTP client for the PriceToken API."""

from __future__ import annotations

import json
import platform
import threading
import urllib.error
import urllib.parse
import urllib.request
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from collections.abc import Mapping

from pricetoken.types import (
    ImageModelHistory,
    ImageModelPricing,
    ImageProviderSummary,
    ModelHistory,
    ModelPricing,
    PriceTokenError,
    ProviderSummary,
    VideoModelHistory,
    VideoModelPricing,
    VideoProviderSummary,
    _parse_image_model_history,
    _parse_image_model_pricing,
    _parse_image_provider_summary,
    _parse_model_history,
    _parse_model_pricing,
    _parse_provider_summary,
    _parse_video_model_history,
    _parse_video_model_pricing,
    _parse_video_provider_summary,
)


class PriceTokenClient:
    """Typed client for the PriceToken REST API."""

    def __init__(
        self,
        *,
        base_url: str = "https://pricetoken.ai",
        api_key: str | None = None,
        telemetry: bool = False,
    ) -> None:
        self._base_url = base_url.rstrip("/")
        self._api_key = api_key
        self._telemetry_enabled = telemetry
        self._telemetry_sent = False

    def _send_telemetry(self) -> None:
        if not self._telemetry_enabled or self._telemetry_sent:
            return
        self._telemetry_sent = True

        from pricetoken import __version__

        runtime = f"python-{platform.python_version()}"
        url = f"{self._base_url}/api/v1/telemetry"
        payload = json.dumps({"sdk": "python", "version": __version__, "runtime": runtime}).encode()

        def _ping() -> None:
            try:
                req = urllib.request.Request(
                    url,
                    data=payload,
                    headers={"Content-Type": "application/json"},
                    method="POST",
                )
                urllib.request.urlopen(req, timeout=5)
            except Exception:
                pass

        threading.Thread(target=_ping, daemon=True).start()

    def _request(self, path: str) -> Any:
        self._send_telemetry()
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
    def _build_qs(params: Mapping[str, str | int | None]) -> str:
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
        params = {"provider": provider, "currency": currency, "after": after, "before": before}
        qs = self._build_qs(params)
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
        params = {"provider": provider, "currency": currency, "after": after, "before": before}
        qs = self._build_qs(params)
        data: dict[str, Any] = self._request(f"/api/v1/pricing/cheapest{qs}")
        return _parse_model_pricing(data)

    # Image pricing methods

    def get_image_pricing(
        self,
        *,
        provider: str | None = None,
        currency: str | None = None,
        after: str | None = None,
        before: str | None = None,
    ) -> list[ImageModelPricing]:
        """Get current pricing for all image models."""
        params = {"provider": provider, "currency": currency, "after": after, "before": before}
        qs = self._build_qs(params)
        data: list[dict[str, Any]] = self._request(f"/api/v1/pricing/image{qs}")
        return [_parse_image_model_pricing(m) for m in data]

    def get_image_model(
        self,
        model_id: str,
        *,
        currency: str | None = None,
    ) -> ImageModelPricing:
        """Get pricing for a single image model."""
        encoded = urllib.parse.quote(model_id, safe="")
        qs = self._build_qs({"currency": currency})
        data: dict[str, Any] = self._request(f"/api/v1/pricing/image/{encoded}{qs}")
        return _parse_image_model_pricing(data)

    def get_image_history(
        self,
        *,
        days: int | None = None,
        model_id: str | None = None,
        provider: str | None = None,
    ) -> list[ImageModelHistory]:
        """Get image price history."""
        qs = self._build_qs({"days": days, "modelId": model_id, "provider": provider})
        data: list[dict[str, Any]] = self._request(f"/api/v1/pricing/image/history{qs}")
        return [_parse_image_model_history(m) for m in data]

    def get_image_providers(self) -> list[ImageProviderSummary]:
        """Get image provider list with stats."""
        data: list[dict[str, Any]] = self._request("/api/v1/pricing/image/providers")
        return [_parse_image_provider_summary(p) for p in data]

    def compare_images(
        self,
        model_ids: list[str],
        *,
        currency: str | None = None,
    ) -> list[ImageModelPricing]:
        """Compare image models side by side."""
        qs = self._build_qs({"models": ",".join(model_ids), "currency": currency})
        data: list[dict[str, Any]] = self._request(f"/api/v1/pricing/image/compare{qs}")
        return [_parse_image_model_pricing(m) for m in data]

    def get_cheapest_image(
        self,
        *,
        provider: str | None = None,
        currency: str | None = None,
        after: str | None = None,
        before: str | None = None,
    ) -> ImageModelPricing:
        """Get the cheapest image model."""
        params = {"provider": provider, "currency": currency, "after": after, "before": before}
        qs = self._build_qs(params)
        data: dict[str, Any] = self._request(f"/api/v1/pricing/image/cheapest{qs}")
        return _parse_image_model_pricing(data)

    # Video pricing methods

    def get_video_pricing(
        self,
        *,
        provider: str | None = None,
        currency: str | None = None,
        after: str | None = None,
        before: str | None = None,
    ) -> list[VideoModelPricing]:
        """Get current pricing for all video models."""
        params = {"provider": provider, "currency": currency, "after": after, "before": before}
        qs = self._build_qs(params)
        data: list[dict[str, Any]] = self._request(f"/api/v1/video{qs}")
        return [_parse_video_model_pricing(m) for m in data]

    def get_video_model(
        self,
        model_id: str,
        *,
        currency: str | None = None,
    ) -> VideoModelPricing:
        """Get pricing for a single video model."""
        encoded = urllib.parse.quote(model_id, safe="")
        qs = self._build_qs({"currency": currency})
        data: dict[str, Any] = self._request(f"/api/v1/video/{encoded}{qs}")
        return _parse_video_model_pricing(data)

    def get_video_history(
        self,
        *,
        days: int | None = None,
        model_id: str | None = None,
        provider: str | None = None,
    ) -> list[VideoModelHistory]:
        """Get video price history."""
        qs = self._build_qs({"days": days, "modelId": model_id, "provider": provider})
        data: list[dict[str, Any]] = self._request(f"/api/v1/video/history{qs}")
        return [_parse_video_model_history(m) for m in data]

    def get_video_providers(self) -> list[VideoProviderSummary]:
        """Get video provider list with stats."""
        data: list[dict[str, Any]] = self._request("/api/v1/video/providers")
        return [_parse_video_provider_summary(p) for p in data]

    def compare_video_models(
        self,
        model_ids: list[str],
        *,
        currency: str | None = None,
    ) -> list[VideoModelPricing]:
        """Compare video models side by side."""
        qs = self._build_qs({"models": ",".join(model_ids), "currency": currency})
        data: list[dict[str, Any]] = self._request(f"/api/v1/video/compare{qs}")
        return [_parse_video_model_pricing(m) for m in data]

    def get_cheapest_video_model(
        self,
        *,
        provider: str | None = None,
        currency: str | None = None,
        after: str | None = None,
        before: str | None = None,
    ) -> VideoModelPricing:
        """Get the cheapest video model."""
        params = {"provider": provider, "currency": currency, "after": after, "before": before}
        qs = self._build_qs(params)
        data: dict[str, Any] = self._request(f"/api/v1/video/cheapest{qs}")
        return _parse_video_model_pricing(data)
