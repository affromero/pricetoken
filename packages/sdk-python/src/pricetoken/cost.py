"""Offline cost calculation using static pricing data."""

from __future__ import annotations

from pricetoken.static import STATIC_PRICING
from pricetoken.types import CostEstimate, ModelPricing


def calculate_cost(
    model_id: str,
    input_per_m_tok: float,
    output_per_m_tok: float,
    input_tokens: int,
    output_tokens: int,
) -> CostEstimate:
    """Calculate cost given explicit per-million-token rates."""
    input_cost = (input_tokens / 1_000_000) * input_per_m_tok
    output_cost = (output_tokens / 1_000_000) * output_per_m_tok

    return CostEstimate(
        model_id=model_id,
        input_tokens=input_tokens,
        output_tokens=output_tokens,
        input_cost=input_cost,
        output_cost=output_cost,
        total_cost=input_cost + output_cost,
    )


def calculate_model_cost(
    model_id: str,
    input_tokens: int,
    output_tokens: int,
    pricing: list[ModelPricing] | None = None,
) -> CostEstimate:
    """Calculate cost by looking up a model in static (or custom) pricing data.

    Raises ValueError if the model is not found.
    """
    data = pricing if pricing is not None else STATIC_PRICING
    model = next((m for m in data if m.model_id == model_id), None)

    if model is None:
        raise ValueError(
            f"Unknown model: {model_id}. Provide pricing data or use calculate_cost()."
        )

    return calculate_cost(
        model_id, model.input_per_m_tok, model.output_per_m_tok, input_tokens, output_tokens
    )
