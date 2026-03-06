"""Offline avatar cost calculation using static pricing data."""

from __future__ import annotations

from pricetoken.avatar_static import STATIC_AVATAR_PRICING
from pricetoken.types import AvatarCostEstimate, AvatarModelPricing


def calculate_avatar_cost(
    model_id: str,
    cost_per_minute: float,
    duration_seconds: float,
) -> AvatarCostEstimate:
    """Calculate avatar cost given explicit per-minute rate."""
    total_cost = (duration_seconds / 60) * cost_per_minute

    return AvatarCostEstimate(
        model_id=model_id,
        duration_seconds=duration_seconds,
        cost_per_minute=cost_per_minute,
        total_cost=total_cost,
    )


def calculate_avatar_model_cost(
    model_id: str,
    duration_seconds: float,
    pricing: list[AvatarModelPricing] | None = None,
) -> AvatarCostEstimate:
    """Calculate avatar cost by looking up a model in static (or custom) pricing data.

    Raises ValueError if the model is not found.
    """
    data = pricing if pricing is not None else STATIC_AVATAR_PRICING
    model = next((m for m in data if m.model_id == model_id), None)

    if model is None:
        raise ValueError(
            f"Unknown avatar model: {model_id}. "
            "Provide pricing data or use calculate_avatar_cost()."
        )

    return calculate_avatar_cost(model_id, model.cost_per_minute, duration_seconds)
