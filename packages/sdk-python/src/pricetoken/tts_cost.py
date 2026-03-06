"""Offline TTS cost calculation using static pricing data."""

from __future__ import annotations

from pricetoken.tts_static import STATIC_TTS_PRICING
from pricetoken.types import TtsCostEstimate, TtsModelPricing


def calculate_tts_cost(
    model_id: str,
    cost_per_m_chars: float,
    characters: int,
) -> TtsCostEstimate:
    """Calculate TTS cost given explicit per-million-characters rate."""
    total_cost = (characters / 1_000_000) * cost_per_m_chars

    return TtsCostEstimate(
        model_id=model_id,
        characters=characters,
        cost_per_m_chars=cost_per_m_chars,
        total_cost=total_cost,
    )


def calculate_tts_model_cost(
    model_id: str,
    characters: int,
    pricing: list[TtsModelPricing] | None = None,
) -> TtsCostEstimate:
    """Calculate TTS cost by looking up a model in static (or custom) pricing data.

    Raises ValueError if the model is not found.
    """
    data = pricing if pricing is not None else STATIC_TTS_PRICING
    model = next((m for m in data if m.model_id == model_id), None)

    if model is None:
        raise ValueError(
            f"Unknown TTS model: {model_id}. Provide pricing data or use calculate_tts_cost()."
        )

    return calculate_tts_cost(model_id, model.cost_per_m_chars, characters)
