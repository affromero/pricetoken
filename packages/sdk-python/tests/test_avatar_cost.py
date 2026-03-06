"""Tests for avatar cost calculation — mirrors avatar-cost.test.ts."""

import pytest

from pricetoken import STATIC_AVATAR_PRICING
from pricetoken.avatar_cost import calculate_avatar_cost, calculate_avatar_model_cost
from pricetoken.types import AvatarModelPricing, FreshnessInfo


class TestCalculateAvatarCost:
    def test_calculates_cost_for_given_duration(self) -> None:
        result = calculate_avatar_cost("test-model", 0.99, 60)
        assert result.total_cost == pytest.approx(0.99)
        assert result.model_id == "test-model"
        assert result.duration_seconds == 60
        assert result.cost_per_minute == 0.99

    def test_returns_zero_cost_for_zero_duration(self) -> None:
        result = calculate_avatar_cost("test-model", 5.94, 0)
        assert result.total_cost == 0

    def test_handles_fractional_seconds(self) -> None:
        result = calculate_avatar_cost("test-model", 6.0, 30)
        assert result.total_cost == 3.0

    def test_calculates_full_minute_correctly(self) -> None:
        result = calculate_avatar_cost("test-model", 5.94, 60)
        assert result.total_cost == pytest.approx(5.94)


class TestCalculateAvatarModelCost:
    def test_looks_up_model_from_static_pricing(self) -> None:
        result = calculate_avatar_model_cost("heygen-avatar-standard", 60)
        assert result.total_cost == pytest.approx(0.99)
        assert result.cost_per_minute == 0.99

    def test_raises_for_unknown_model(self) -> None:
        with pytest.raises(ValueError, match="Unknown avatar model"):
            calculate_avatar_model_cost("nonexistent-model", 10)

    def test_accepts_custom_pricing_data(self) -> None:
        custom = [
            AvatarModelPricing(
                model_id="custom-avatar",
                provider="custom",
                display_name="Custom",
                cost_per_minute=2.0,
                avatar_type=None,
                resolution=None,
                max_duration=None,
                quality_mode=None,
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
        result = calculate_avatar_model_cost("custom-avatar", 30, custom)
        assert result.total_cost == pytest.approx(1.0)


class TestStaticAvatarPricing:
    def test_contains_models_from_at_least_one_provider(self) -> None:
        providers = {m.provider for m in STATIC_AVATAR_PRICING}
        assert len(providers) >= 1

    def test_all_models_have_required_fields(self) -> None:
        for model in STATIC_AVATAR_PRICING:
            assert model.model_id
            assert model.provider
            assert model.display_name
            assert model.cost_per_minute > 0
            assert model.source == "seed"
