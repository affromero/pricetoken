"""Offline cost calculation for image generation models."""

from __future__ import annotations

from pricetoken.static_image import STATIC_IMAGE_PRICING
from pricetoken.types import ImageCostEstimate, ImageModelPricing


def calculate_image_cost(
    model_id: str, price_per_image: float, image_count: int
) -> ImageCostEstimate:
    return ImageCostEstimate(
        model_id=model_id,
        image_count=image_count,
        price_per_image=price_per_image,
        total_cost=price_per_image * image_count,
    )


def calculate_image_model_cost(
    model_id: str,
    image_count: int,
    pricing: list[ImageModelPricing] | None = None,
) -> ImageCostEstimate:
    data = pricing if pricing is not None else STATIC_IMAGE_PRICING
    model = next((m for m in data if m.model_id == model_id), None)

    if model is None:
        raise ValueError(
            f"Unknown image model: {model_id}. Provide pricing data or use calculate_image_cost()."
        )

    return calculate_image_cost(model_id, model.price_per_image, image_count)
