"""Tests for video cost calculation — mirrors video-cost.test.ts."""

import pytest

from pricetoken import STATIC_VIDEO_PRICING
from pricetoken.video_cost import calculate_video_cost, calculate_video_model_cost


class TestCalculateVideoCost:
    def test_calculates_cost_for_given_duration(self) -> None:
        result = calculate_video_cost("test-model", 6.0, 30)
        assert result.total_cost == 3.0
        assert result.model_id == "test-model"
        assert result.duration_seconds == 30
        assert result.cost_per_minute == 6.0

    def test_returns_zero_cost_for_zero_duration(self) -> None:
        result = calculate_video_cost("test-model", 10, 0)
        assert result.total_cost == 0

    def test_handles_fractional_seconds(self) -> None:
        result = calculate_video_cost("test-model", 12.0, 5)
        assert result.total_cost == pytest.approx(1.0)

    def test_calculates_full_minute_correctly(self) -> None:
        result = calculate_video_cost("test-model", 7.2, 60)
        assert result.total_cost == pytest.approx(7.2)


class TestCalculateVideoModelCost:
    def test_looks_up_model_from_static_pricing(self) -> None:
        result = calculate_video_model_cost("runway-gen4-720p", 60)
        assert result.total_cost == pytest.approx(7.2)
        assert result.cost_per_minute == pytest.approx(7.2)

    def test_raises_for_unknown_model(self) -> None:
        with pytest.raises(ValueError, match="Unknown video model"):
            calculate_video_model_cost("nonexistent-model", 10)

    def test_accepts_custom_pricing_data(self) -> None:
        from pricetoken.types import VideoModelPricing

        custom = [
            VideoModelPricing(
                model_id="custom-video",
                provider="custom",
                display_name="Custom",
                cost_per_minute=10,
                resolution=None,
                max_duration=None,
                quality_mode=None,
                source="seed",
                status="active",
                confidence="high",
                last_updated=None,
                launch_date=None,
            ),
        ]
        result = calculate_video_model_cost("custom-video", 30, custom)
        assert result.total_cost == pytest.approx(5.0)


class TestStaticVideoPricing:
    def test_contains_models_from_multiple_providers(self) -> None:
        providers = {m.provider for m in STATIC_VIDEO_PRICING}
        assert len(providers) >= 5

    def test_all_models_have_required_fields(self) -> None:
        for model in STATIC_VIDEO_PRICING:
            assert model.model_id
            assert model.provider
            assert model.display_name
            assert model.cost_per_minute > 0
            assert model.source == "seed"
