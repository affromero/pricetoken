"""PriceToken — Real-time LLM pricing data."""

from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("pricetoken")
except PackageNotFoundError:
    __version__ = "0.7.0"

from pricetoken.client import PriceTokenClient
from pricetoken.cost import calculate_cost, calculate_model_cost
from pricetoken.image_cost import calculate_image_cost, calculate_image_model_cost
from pricetoken.static import STATIC_PRICING
from pricetoken.static_image import STATIC_IMAGE_PRICING
from pricetoken.types import (
    CostEstimate,
    DataConfidence,
    ImageCostEstimate,
    ImageModelHistory,
    ImageModelPricing,
    ImagePriceHistoryPoint,
    ImageProviderSummary,
    ImageQualityTier,
    ModelHistory,
    ModelPricing,
    ModelStatus,
    PriceHistoryPoint,
    PriceTokenError,
    ProviderSummary,
    Source,
    VideoCostEstimate,
    VideoModelHistory,
    VideoModelPricing,
    VideoPriceHistoryPoint,
    VideoProviderSummary,
)
from pricetoken.video_cost import calculate_video_cost, calculate_video_model_cost
from pricetoken.video_static import STATIC_VIDEO_PRICING

__all__ = [
    "STATIC_IMAGE_PRICING",
    "STATIC_PRICING",
    "STATIC_VIDEO_PRICING",
    "CostEstimate",
    "DataConfidence",
    "ImageCostEstimate",
    "ImageModelHistory",
    "ImageModelPricing",
    "ImagePriceHistoryPoint",
    "ImageProviderSummary",
    "ImageQualityTier",
    "ModelHistory",
    "ModelPricing",
    "ModelStatus",
    "PriceHistoryPoint",
    "PriceTokenClient",
    "PriceTokenError",
    "ProviderSummary",
    "Source",
    "VideoCostEstimate",
    "VideoModelHistory",
    "VideoModelPricing",
    "VideoPriceHistoryPoint",
    "VideoProviderSummary",
    "__version__",
    "calculate_cost",
    "calculate_image_cost",
    "calculate_image_model_cost",
    "calculate_model_cost",
    "calculate_video_cost",
    "calculate_video_model_cost",
]
