"""Offline STT cost calculation using static pricing data."""

from __future__ import annotations

from pricetoken.stt_static import STATIC_STT_PRICING
from pricetoken.types import SttCostEstimate, SttModelPricing


def calculate_stt_cost(
    model_id: str,
    cost_per_minute: float,
    duration_seconds: float,
) -> SttCostEstimate:
    """Calculate STT cost given explicit per-minute rate."""
    total_cost = (duration_seconds / 60) * cost_per_minute

    return SttCostEstimate(
        model_id=model_id,
        duration_seconds=duration_seconds,
        cost_per_minute=cost_per_minute,
        total_cost=total_cost,
    )


def calculate_stt_model_cost(
    model_id: str,
    duration_seconds: float,
    pricing: list[SttModelPricing] | None = None,
) -> SttCostEstimate:
    """Calculate STT cost by looking up a model in static (or custom) pricing data.

    Raises ValueError if the model is not found.
    """
    data = pricing if pricing is not None else STATIC_STT_PRICING
    model = next((m for m in data if m.model_id == model_id), None)

    if model is None:
        raise ValueError(
            f"Unknown STT model: {model_id}. Provide pricing data or use calculate_stt_cost()."
        )

    return calculate_stt_cost(model_id, model.cost_per_minute, duration_seconds)
