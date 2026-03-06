"""Tests for TTS cost calculation — mirrors test_avatar_cost.py."""

import pytest

from pricetoken import STATIC_TTS_PRICING
from pricetoken.tts_cost import calculate_tts_cost, calculate_tts_model_cost
from pricetoken.types import FreshnessInfo, TtsModelPricing


class TestCalculateTtsCost:
    def test_calculates_cost_for_given_characters(self) -> None:
        result = calculate_tts_cost("test-model", 15.00, 1000)
        assert result.total_cost == pytest.approx(0.015)
        assert result.model_id == "test-model"
        assert result.characters == 1000
        assert result.cost_per_m_chars == 15.00

    def test_returns_zero_cost_for_zero_characters(self) -> None:
        result = calculate_tts_cost("test-model", 30.00, 0)
        assert result.total_cost == 0

    def test_handles_fractional_characters(self) -> None:
        result = calculate_tts_cost("test-model", 10.00, 500_000)
        assert result.total_cost == pytest.approx(5.0)

    def test_calculates_full_million_correctly(self) -> None:
        result = calculate_tts_cost("test-model", 15.00, 1_000_000)
        assert result.total_cost == pytest.approx(15.00)


class TestCalculateTtsModelCost:
    def test_looks_up_model_from_static_pricing(self) -> None:
        result = calculate_tts_model_cost("openai-tts-1", 1_000_000)
        assert result.total_cost == pytest.approx(15.00)
        assert result.cost_per_m_chars == 15.00

    def test_raises_for_unknown_model(self) -> None:
        with pytest.raises(ValueError, match="Unknown TTS model"):
            calculate_tts_model_cost("nonexistent-model", 1000)

    def test_accepts_custom_pricing_data(self) -> None:
        custom = [
            TtsModelPricing(
                model_id="custom-tts",
                provider="custom",
                display_name="Custom",
                cost_per_m_chars=10.0,
                voice_type=None,
                max_characters=None,
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
        result = calculate_tts_model_cost("custom-tts", 500_000, custom)
        assert result.total_cost == pytest.approx(5.0)


class TestStaticTtsPricing:
    def test_contains_models_from_multiple_providers(self) -> None:
        providers = {m.provider for m in STATIC_TTS_PRICING}
        assert len(providers) >= 3

    def test_all_models_have_required_fields(self) -> None:
        for model in STATIC_TTS_PRICING:
            assert model.model_id
            assert model.provider
            assert model.display_name
            assert model.cost_per_m_chars > 0
            assert model.source == "seed"
