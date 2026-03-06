"""Tests for STT cost calculation — mirrors test_avatar_cost.py."""

import pytest

from pricetoken import STATIC_STT_PRICING
from pricetoken.stt_cost import calculate_stt_cost, calculate_stt_model_cost
from pricetoken.types import FreshnessInfo, SttModelPricing


class TestCalculateSttCost:
    def test_calculates_cost_for_given_duration(self) -> None:
        result = calculate_stt_cost("test-model", 0.006, 60)
        assert result.total_cost == pytest.approx(0.006)
        assert result.model_id == "test-model"
        assert result.duration_seconds == 60
        assert result.cost_per_minute == 0.006

    def test_returns_zero_cost_for_zero_duration(self) -> None:
        result = calculate_stt_cost("test-model", 0.006, 0)
        assert result.total_cost == 0

    def test_handles_fractional_seconds(self) -> None:
        result = calculate_stt_cost("test-model", 0.006, 30)
        assert result.total_cost == pytest.approx(0.003)

    def test_calculates_full_minute_correctly(self) -> None:
        result = calculate_stt_cost("test-model", 0.024, 60)
        assert result.total_cost == pytest.approx(0.024)


class TestCalculateSttModelCost:
    def test_looks_up_model_from_static_pricing(self) -> None:
        result = calculate_stt_model_cost("openai-whisper-1", 60)
        assert result.total_cost == pytest.approx(0.006)
        assert result.cost_per_minute == 0.006

    def test_raises_for_unknown_model(self) -> None:
        with pytest.raises(ValueError, match="Unknown STT model"):
            calculate_stt_model_cost("nonexistent-model", 10)

    def test_accepts_custom_pricing_data(self) -> None:
        custom = [
            SttModelPricing(
                model_id="custom-stt",
                provider="custom",
                display_name="Custom",
                cost_per_minute=0.01,
                stt_type=None,
                max_duration=None,
                supported_languages=None,
                source="seed",
                status="active",
                confidence="high",
                confidence_score=65,
                confidence_level="medium",
                freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
                last_updated=None,
                launch_date=None,
            ),
        ]
        result = calculate_stt_model_cost("custom-stt", 30, custom)
        assert result.total_cost == pytest.approx(0.005)


class TestStaticSttPricing:
    def test_contains_models_from_multiple_providers(self) -> None:
        providers = {m.provider for m in STATIC_STT_PRICING}
        assert len(providers) >= 3

    def test_all_models_have_required_fields(self) -> None:
        for model in STATIC_STT_PRICING:
            assert model.model_id
            assert model.provider
            assert model.display_name
            assert model.cost_per_minute > 0
            assert model.source == "seed"
