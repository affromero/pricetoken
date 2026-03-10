"""Tests for music cost calculation — mirrors music-cost.test.ts."""

import pytest

from pricetoken import STATIC_MUSIC_PRICING
from pricetoken.music_cost import calculate_music_cost, calculate_music_model_cost
from pricetoken.types import FreshnessInfo, MusicModelPricing


class TestCalculateMusicCost:
    def test_calculates_cost_for_given_duration(self) -> None:
        result = calculate_music_cost("test-model", 0.50, 60)
        assert result.total_cost == pytest.approx(0.50)
        assert result.model_id == "test-model"
        assert result.duration_seconds == 60
        assert result.cost_per_minute == 0.50

    def test_returns_zero_cost_for_zero_duration(self) -> None:
        result = calculate_music_cost("test-model", 0.50, 0)
        assert result.total_cost == 0

    def test_handles_fractional_seconds(self) -> None:
        result = calculate_music_cost("test-model", 6.0, 30)
        assert result.total_cost == 3.0

    def test_calculates_full_minute_correctly(self) -> None:
        result = calculate_music_cost("test-model", 0.50, 60)
        assert result.total_cost == pytest.approx(0.50)


class TestCalculateMusicModelCost:
    def test_looks_up_model_from_static_pricing(self) -> None:
        result = calculate_music_model_cost("elevenlabs-eleven-music", 60)
        assert result.total_cost == pytest.approx(0.50)
        assert result.cost_per_minute == 0.50

    def test_raises_for_unknown_model(self) -> None:
        with pytest.raises(ValueError, match="Unknown music model"):
            calculate_music_model_cost("nonexistent-model", 10)

    def test_accepts_custom_pricing_data(self) -> None:
        custom = [
            MusicModelPricing(
                model_id="custom-music",
                provider="custom",
                display_name="Custom",
                cost_per_minute=2.0,
                max_duration=None,
                output_format="mp3",
                vocals=True,
                source="seed",
                status="active",
                confidence="high",
                confidence_score=65,
                confidence_level="medium",
                freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
                last_updated=None,
                launch_date=None,
                official=True,
                pricing_note=None,
            ),
        ]
        result = calculate_music_model_cost("custom-music", 30, custom)
        assert result.total_cost == pytest.approx(1.0)


class TestStaticMusicPricing:
    def test_contains_models_from_at_least_one_provider(self) -> None:
        providers = {m.provider for m in STATIC_MUSIC_PRICING}
        assert len(providers) >= 1

    def test_all_models_have_required_fields(self) -> None:
        for model in STATIC_MUSIC_PRICING:
            assert model.model_id
            assert model.provider
            assert model.display_name
            assert model.cost_per_minute > 0
            assert model.source == "seed"
