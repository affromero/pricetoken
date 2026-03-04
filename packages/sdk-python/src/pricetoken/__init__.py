"""PriceToken — Real-time LLM pricing data."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("pricetoken")
except PackageNotFoundError:
    __version__ = "0.3.0"

from pricetoken.client import PriceTokenClient
from pricetoken.cost import calculate_cost, calculate_model_cost
from pricetoken.static import STATIC_PRICING
from pricetoken.types import (
    CostEstimate,
    DataConfidence,
    ModelHistory,
    ModelPricing,
    ModelStatus,
    PriceHistoryPoint,
    PriceTokenError,
    ProviderSummary,
    Source,
)

__all__ = [
    "__version__",
    "PriceTokenClient",
    "calculate_cost",
    "calculate_model_cost",
    "STATIC_PRICING",
    "CostEstimate",
    "DataConfidence",
    "ModelHistory",
    "ModelPricing",
    "ModelStatus",
    "PriceHistoryPoint",
    "PriceTokenError",
    "ProviderSummary",
    "Source",
]
