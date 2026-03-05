"""Tests for HTTP client — mirrors client.test.ts."""

from __future__ import annotations

import io
import json
import urllib.error
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from pricetoken import PriceTokenClient, PriceTokenError


def _mock_response(data: Any) -> MagicMock:
    body = json.dumps(
        {"data": data, "meta": {"timestamp": "2026-01-01T00:00:00Z", "cached": False}}
    )
    resp = MagicMock()
    resp.read.return_value = body.encode()
    resp.__enter__ = lambda s: s
    resp.__exit__ = MagicMock(return_value=False)
    return resp


def _mock_error(status: int, error: str) -> urllib.error.HTTPError:
    body = json.dumps({"error": error, "status": status}).encode()
    return urllib.error.HTTPError(
        url="https://test.api",
        code=status,
        msg=error,
        hdrs=None,  # type: ignore[arg-type]
        fp=io.BytesIO(body),
    )


class TestPriceTokenClient:
    def test_uses_default_base_url(self) -> None:
        client = PriceTokenClient()
        assert client._base_url == "https://pricetoken.ai"

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_sends_api_key_as_bearer_token(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response([])
        client = PriceTokenClient(base_url="https://test.api", api_key="pt_test123")

        client.get_pricing()

        req = mock_urlopen.call_args[0][0]
        assert req.get_header("Authorization") == "Bearer pt_test123"

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_pricing_returns_model_list(self, mock_urlopen: MagicMock) -> None:
        mock_data = [
            {
                "modelId": "test",
                "provider": "test",
                "displayName": "Test",
                "inputPerMTok": 1,
                "outputPerMTok": 2,
                "contextWindow": None,
                "maxOutputTokens": None,
                "source": "seed",
                "status": "active",
                "confidence": "high",
                "lastUpdated": None,
                "launchDate": None,
            }
        ]
        mock_urlopen.return_value = _mock_response(mock_data)
        client = PriceTokenClient(base_url="https://test.api")

        result = client.get_pricing()
        assert len(result) == 1
        assert result[0].model_id == "test"

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_pricing_filters_by_provider(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response([])
        client = PriceTokenClient(base_url="https://test.api")

        client.get_pricing(provider="anthropic")

        req = mock_urlopen.call_args[0][0]
        assert "provider=anthropic" in req.full_url

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_model_fetches_single_model(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response(
            {
                "modelId": "gpt-4.1",
                "provider": "openai",
                "displayName": "GPT-4.1",
                "inputPerMTok": 2,
                "outputPerMTok": 8,
                "contextWindow": 1000000,
                "maxOutputTokens": 32768,
                "source": "seed",
                "status": "active",
                "confidence": "high",
                "lastUpdated": None,
                "launchDate": None,
            }
        )
        client = PriceTokenClient(base_url="https://test.api")

        result = client.get_model("gpt-4.1")

        req = mock_urlopen.call_args[0][0]
        assert "/api/v1/text/gpt-4.1" in req.full_url
        assert result.model_id == "gpt-4.1"

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_history_passes_query_params(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response([])
        client = PriceTokenClient(base_url="https://test.api")

        client.get_history(days=30, provider="openai")

        req = mock_urlopen.call_args[0][0]
        assert "days=30" in req.full_url
        assert "provider=openai" in req.full_url

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_compare_sends_model_ids_as_comma_separated(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response([])
        client = PriceTokenClient(base_url="https://test.api")

        client.compare(["gpt-4.1", "claude-sonnet-4-6"])

        req = mock_urlopen.call_args[0][0]
        assert "models=gpt-4.1%2Cclaude-sonnet-4-6" in req.full_url

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_raises_typed_error_on_failure(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.side_effect = _mock_error(404, "Model not found")
        client = PriceTokenClient(base_url="https://test.api")

        with pytest.raises(PriceTokenError, match="Model not found") as exc_info:
            client.get_model("nonexistent")
        assert exc_info.value.status == 404

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_raises_on_http_error_with_no_json_body(self, mock_urlopen: MagicMock) -> None:
        exc = urllib.error.HTTPError(
            url="https://test.api",
            code=500,
            msg="Internal Server Error",
            hdrs=None,  # type: ignore[arg-type]
            fp=io.BytesIO(b"not json"),
        )
        mock_urlopen.side_effect = exc
        client = PriceTokenClient(base_url="https://test.api")

        with pytest.raises(PriceTokenError, match="HTTP 500") as exc_info:
            client.get_pricing()
        assert exc_info.value.status == 500

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_telemetry_not_sent_when_disabled(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response([])
        client = PriceTokenClient(base_url="https://test.api")

        client.get_pricing()

        assert mock_urlopen.call_count == 1

    @patch("pricetoken.client.threading.Thread")
    @patch("pricetoken.client.urllib.request.urlopen")
    def test_telemetry_sent_via_thread_when_enabled(
        self, mock_urlopen: MagicMock, mock_thread_cls: MagicMock
    ) -> None:
        mock_urlopen.return_value = _mock_response([])
        mock_thread = MagicMock()
        mock_thread_cls.return_value = mock_thread
        client = PriceTokenClient(base_url="https://test.api", telemetry=True)

        client.get_pricing()

        mock_thread_cls.assert_called_once()
        mock_thread.start.assert_called_once()
        assert mock_thread_cls.call_args[1]["daemon"] is True

    @patch("pricetoken.client.threading.Thread")
    @patch("pricetoken.client.urllib.request.urlopen")
    def test_telemetry_sent_only_once(
        self, mock_urlopen: MagicMock, mock_thread_cls: MagicMock
    ) -> None:
        mock_urlopen.return_value = _mock_response([])
        mock_thread_cls.return_value = MagicMock()
        client = PriceTokenClient(base_url="https://test.api", telemetry=True)

        client.get_pricing()
        client.get_pricing()

        assert mock_thread_cls.call_count == 1

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_video_pricing_returns_video_model_list(self, mock_urlopen: MagicMock) -> None:
        mock_data = [
            {
                "modelId": "runway-gen4-720p",
                "provider": "runway",
                "displayName": "Runway Gen-4",
                "costPerMinute": 7.2,
                "resolution": "720p",
                "maxDuration": 10,
                "qualityMode": None,
                "source": "seed",
                "status": "active",
                "confidence": "high",
                "lastUpdated": None,
                "launchDate": None,
            }
        ]
        mock_urlopen.return_value = _mock_response(mock_data)
        client = PriceTokenClient(base_url="https://test.api")

        result = client.get_video_pricing()
        assert len(result) == 1
        assert result[0].model_id == "runway-gen4-720p"
        assert result[0].cost_per_minute == 7.2

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_video_model_fetches_single_video_model(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response(
            {
                "modelId": "runway-gen4-720p",
                "provider": "runway",
                "displayName": "Runway Gen-4",
                "costPerMinute": 7.2,
                "resolution": "720p",
                "maxDuration": 10,
                "qualityMode": None,
                "source": "seed",
                "status": "active",
                "confidence": "high",
                "lastUpdated": None,
                "launchDate": None,
            }
        )
        client = PriceTokenClient(base_url="https://test.api")

        result = client.get_video_model("runway-gen4-720p")

        req = mock_urlopen.call_args[0][0]
        assert "/api/v1/video/runway-gen4-720p" in req.full_url
        assert result.model_id == "runway-gen4-720p"

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_video_history_passes_query_params(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response([])
        client = PriceTokenClient(base_url="https://test.api")

        client.get_video_history(days=30, provider="runway")

        req = mock_urlopen.call_args[0][0]
        assert "days=30" in req.full_url
        assert "provider=runway" in req.full_url

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_video_providers_fetches_provider_list(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response([])
        client = PriceTokenClient(base_url="https://test.api")

        client.get_video_providers()

        req = mock_urlopen.call_args[0][0]
        assert "/api/v1/video/providers" in req.full_url

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_compare_video_models_sends_model_ids(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response([])
        client = PriceTokenClient(base_url="https://test.api")

        client.compare_video_models(["runway-gen4-720p", "kling-3.0-1080p"])

        req = mock_urlopen.call_args[0][0]
        assert "models=runway-gen4-720p%2Ckling-3.0-1080p" in req.full_url

    @patch("pricetoken.client.urllib.request.urlopen")
    def test_get_cheapest_video_model_fetches_cheapest(self, mock_urlopen: MagicMock) -> None:
        mock_urlopen.return_value = _mock_response(
            {
                "modelId": "kling-3.0-1080p",
                "provider": "kling",
                "displayName": "Kling 3.0 1080p",
                "costPerMinute": 5.04,
                "resolution": "1080p",
                "maxDuration": 15,
                "qualityMode": None,
                "source": "seed",
                "status": "active",
                "confidence": "high",
                "lastUpdated": None,
                "launchDate": None,
            }
        )
        client = PriceTokenClient(base_url="https://test.api")

        result = client.get_cheapest_video_model(provider="kling")

        req = mock_urlopen.call_args[0][0]
        assert "/api/v1/video/cheapest" in req.full_url
        assert "provider=kling" in req.full_url
        assert result.model_id == "kling-3.0-1080p"
