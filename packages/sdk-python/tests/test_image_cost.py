"""Tests for image cost calculation — mirrors image_cost.test.ts."""

import pytest

from pricetoken import STATIC_IMAGE_PRICING, calculate_image_cost, calculate_image_model_cost
from pricetoken.types import FreshnessInfo


class TestCalculateImageCost:
    def test_basic_cost_calculation(self) -> None:
        result = calculate_image_cost("test-model", 0.04, 10)
        assert result.model_id == "test-model"
        assert result.image_count == 10
        assert result.price_per_image == 0.04
        assert result.total_cost == pytest.approx(0.40)

    def test_zero_images(self) -> None:
        result = calculate_image_cost("test-model", 0.04, 0)
        assert result.total_cost == 0
        assert result.image_count == 0


class TestCalculateImageModelCost:
    def test_from_static_pricing(self) -> None:
        result = calculate_image_model_cost("dall-e-3-standard-1024", 5)
        assert result.model_id == "dall-e-3-standard-1024"
        assert result.price_per_image == 0.040
        assert result.total_cost == pytest.approx(0.20)

    def test_unknown_model_raises(self) -> None:
        with pytest.raises(ValueError, match="Unknown image model"):
            calculate_image_model_cost("nonexistent-model", 1)

    def test_custom_pricing(self) -> None:
        from pricetoken.types import ImageModelPricing

        custom = [
            ImageModelPricing(
                model_id="custom-img",
                provider="custom",
                display_name="Custom Image",
                price_per_image=0.10,
                price_per_megapixel=None,
                default_resolution="1024x1024",
                quality_tier="standard",
                max_resolution=None,
                supported_formats=["png"],
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
        result = calculate_image_model_cost("custom-img", 3, custom)
        assert result.total_cost == pytest.approx(0.30)


class TestStaticImagePricing:
    def test_has_multiple_providers(self) -> None:
        providers = {m.provider for m in STATIC_IMAGE_PRICING}
        assert len(providers) >= 5

    def test_all_models_have_required_fields(self) -> None:
        for model in STATIC_IMAGE_PRICING:
            assert model.model_id
            assert model.provider
            assert model.display_name
            assert model.price_per_image > 0
            assert model.default_resolution
            assert model.quality_tier in ("standard", "hd", "ultra")
            assert model.source == "seed"
