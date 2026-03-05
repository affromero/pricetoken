"""Tests for cost calculation — mirrors cost.test.ts."""

import pytest

from pricetoken import STATIC_PRICING, calculate_cost, calculate_model_cost
from pricetoken.types import FreshnessInfo


class TestCalculateCost:
    def test_calculates_cost_for_given_token_counts(self) -> None:
        result = calculate_cost("test-model", 3, 15, 1_000_000, 500_000)
        assert result.input_cost == 3
        assert result.output_cost == 7.5
        assert result.total_cost == 10.5
        assert result.model_id == "test-model"
        assert result.input_tokens == 1_000_000
        assert result.output_tokens == 500_000

    def test_returns_zero_cost_for_zero_tokens(self) -> None:
        result = calculate_cost("test-model", 10, 30, 0, 0)
        assert result.total_cost == 0
        assert result.input_cost == 0
        assert result.output_cost == 0

    def test_handles_large_token_counts(self) -> None:
        result = calculate_cost("test-model", 1, 2, 100_000_000, 50_000_000)
        assert result.input_cost == 100
        assert result.output_cost == 100
        assert result.total_cost == 200

    def test_handles_fractional_prices(self) -> None:
        result = calculate_cost("test-model", 0.075, 0.30, 1_000_000, 1_000_000)
        assert result.input_cost == pytest.approx(0.075)
        assert result.output_cost == pytest.approx(0.30)


class TestCalculateModelCost:
    def test_looks_up_model_from_static_pricing(self) -> None:
        result = calculate_model_cost("claude-sonnet-4-6", 1_000_000, 500_000)
        assert result.input_cost == 3
        assert result.output_cost == 7.5
        assert result.total_cost == 10.5

    def test_raises_for_unknown_model(self) -> None:
        with pytest.raises(ValueError, match="Unknown model"):
            calculate_model_cost("nonexistent-model", 1000, 1000)

    def test_accepts_custom_pricing_data(self) -> None:
        from pricetoken.types import ModelPricing

        custom = [
            ModelPricing(
                model_id="custom-model",
                provider="custom",
                display_name="Custom",
                input_per_m_tok=5,
                output_per_m_tok=10,
                context_window=None,
                max_output_tokens=None,
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
        result = calculate_model_cost("custom-model", 2_000_000, 1_000_000, custom)
        assert result.input_cost == 10
        assert result.output_cost == 10


class TestStaticPricing:
    def test_contains_models_from_multiple_providers(self) -> None:
        providers = {m.provider for m in STATIC_PRICING}
        assert len(providers) >= 3

    def test_all_models_have_required_fields(self) -> None:
        for model in STATIC_PRICING:
            assert model.model_id
            assert model.provider
            assert model.display_name
            assert model.input_per_m_tok > 0
            assert model.output_per_m_tok > 0
            assert model.source == "seed"

    def test_output_price_is_always_gte_input_price(self) -> None:
        for model in STATIC_PRICING:
            assert model.output_per_m_tok >= model.input_per_m_tok
