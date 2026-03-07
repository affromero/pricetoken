"""Type definitions for the PriceToken SDK."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

ModelStatus = Literal["active", "deprecated", "preview"]
DataConfidence = Literal["high", "medium", "low"]
ConfidenceLevel = Literal["high", "medium", "low"]
Source = Literal["fetched", "seed", "admin", "verified", "carried"]


@dataclass(slots=True)
class FreshnessInfo:
    last_verified: str
    age_hours: int
    stale: bool


@dataclass(slots=True)
class ModelPricing:
    model_id: str
    provider: str
    display_name: str
    input_per_m_tok: float
    output_per_m_tok: float
    context_window: int | None
    max_output_tokens: int | None
    source: Source
    status: ModelStatus | None
    confidence: DataConfidence
    confidence_score: int
    confidence_level: ConfidenceLevel
    freshness: FreshnessInfo
    last_updated: str | None
    launch_date: str | None


@dataclass(slots=True)
class CostEstimate:
    model_id: str
    input_tokens: int
    output_tokens: int
    input_cost: float
    output_cost: float
    total_cost: float


@dataclass(slots=True)
class PriceHistoryPoint:
    date: str
    input_per_m_tok: float
    output_per_m_tok: float


@dataclass(slots=True)
class ModelHistory:
    model_id: str
    provider: str
    display_name: str
    history: list[PriceHistoryPoint]


@dataclass(slots=True)
class ProviderSummary:
    id: str
    display_name: str
    model_count: int
    cheapest_input_per_m_tok: float
    cheapest_output_per_m_tok: float


class PriceTokenError(Exception):
    """Raised when the PriceToken API returns an error."""

    def __init__(self, error: str, status: int) -> None:
        super().__init__(error)
        self.error = error
        self.status = status


def _parse_freshness(data: dict[str, Any] | None) -> FreshnessInfo:
    if data is None:
        return FreshnessInfo(last_verified="", age_hours=0, stale=True)
    return FreshnessInfo(
        last_verified=data.get("lastVerified", ""),
        age_hours=data.get("ageHours", 0),
        stale=data.get("stale", True),
    )


def _parse_model_pricing(data: dict[str, Any]) -> ModelPricing:
    return ModelPricing(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        input_per_m_tok=data["inputPerMTok"],
        output_per_m_tok=data["outputPerMTok"],
        context_window=data.get("contextWindow"),
        max_output_tokens=data.get("maxOutputTokens"),
        source=data["source"],
        status=data.get("status"),
        confidence=data.get("confidence", "low"),
        confidence_score=data.get("confidenceScore", 0),
        confidence_level=data.get("confidenceLevel", "low"),
        freshness=_parse_freshness(data.get("freshness")),
        last_updated=data.get("lastUpdated"),
        launch_date=data.get("launchDate"),
    )


def _parse_history_point(data: dict[str, Any]) -> PriceHistoryPoint:
    return PriceHistoryPoint(
        date=data["date"],
        input_per_m_tok=data["inputPerMTok"],
        output_per_m_tok=data["outputPerMTok"],
    )


def _parse_model_history(data: dict[str, Any]) -> ModelHistory:
    return ModelHistory(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        history=[_parse_history_point(p) for p in data["history"]],
    )


def _parse_provider_summary(data: dict[str, Any]) -> ProviderSummary:
    return ProviderSummary(
        id=data["id"],
        display_name=data["displayName"],
        model_count=data["modelCount"],
        cheapest_input_per_m_tok=data["cheapestInputPerMTok"],
        cheapest_output_per_m_tok=data["cheapestOutputPerMTok"],
    )


# ---------------------------------------------------------------------------
# Image pricing types
# ---------------------------------------------------------------------------

ImageQualityTier = Literal["standard", "hd", "ultra"]


@dataclass(slots=True)
class ImageModelPricing:
    model_id: str
    provider: str
    display_name: str
    price_per_image: float
    price_per_megapixel: float | None
    default_resolution: str
    quality_tier: ImageQualityTier
    max_resolution: str | None
    supported_formats: list[str]
    source: Source
    status: ModelStatus | None
    confidence: DataConfidence
    confidence_score: int
    confidence_level: ConfidenceLevel
    freshness: FreshnessInfo
    last_updated: str | None
    launch_date: str | None


@dataclass(slots=True)
class ImageCostEstimate:
    model_id: str
    image_count: int
    price_per_image: float
    total_cost: float


@dataclass(slots=True)
class ImagePriceHistoryPoint:
    date: str
    price_per_image: float


@dataclass(slots=True)
class ImageModelHistory:
    model_id: str
    provider: str
    display_name: str
    history: list[ImagePriceHistoryPoint]


@dataclass(slots=True)
class ImageProviderSummary:
    id: str
    display_name: str
    model_count: int
    cheapest_per_image: float


def _parse_image_model_pricing(data: dict[str, Any]) -> ImageModelPricing:
    return ImageModelPricing(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        price_per_image=data["pricePerImage"],
        price_per_megapixel=data.get("pricePerMegapixel"),
        default_resolution=data["defaultResolution"],
        quality_tier=data["qualityTier"],
        max_resolution=data.get("maxResolution"),
        supported_formats=data.get("supportedFormats", ["png"]),
        source=data["source"],
        status=data.get("status"),
        confidence=data.get("confidence", "low"),
        confidence_score=data.get("confidenceScore", 0),
        confidence_level=data.get("confidenceLevel", "low"),
        freshness=_parse_freshness(data.get("freshness")),
        last_updated=data.get("lastUpdated"),
        launch_date=data.get("launchDate"),
    )


def _parse_image_history_point(data: dict[str, Any]) -> ImagePriceHistoryPoint:
    return ImagePriceHistoryPoint(date=data["date"], price_per_image=data["pricePerImage"])


def _parse_image_model_history(data: dict[str, Any]) -> ImageModelHistory:
    return ImageModelHistory(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        history=[_parse_image_history_point(p) for p in data["history"]],
    )


def _parse_image_provider_summary(data: dict[str, Any]) -> ImageProviderSummary:
    return ImageProviderSummary(
        id=data["id"],
        display_name=data["displayName"],
        model_count=data["modelCount"],
        cheapest_per_image=data["cheapestPerImage"],
    )


# ---------------------------------------------------------------------------
# Video pricing types
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class VideoModelPricing:
    model_id: str
    provider: str
    display_name: str
    cost_per_minute: float
    resolution: str | None
    max_duration: int | None
    quality_mode: str | None
    source: Source
    status: ModelStatus | None
    confidence: DataConfidence
    confidence_score: int
    confidence_level: ConfidenceLevel
    freshness: FreshnessInfo
    last_updated: str | None
    launch_date: str | None


@dataclass(slots=True)
class VideoCostEstimate:
    model_id: str
    duration_seconds: float
    cost_per_minute: float
    total_cost: float


@dataclass(slots=True)
class VideoPriceHistoryPoint:
    date: str
    cost_per_minute: float


@dataclass(slots=True)
class VideoModelHistory:
    model_id: str
    provider: str
    display_name: str
    history: list[VideoPriceHistoryPoint]


@dataclass(slots=True)
class VideoProviderSummary:
    id: str
    display_name: str
    model_count: int
    cheapest_cost_per_minute: float


def _parse_video_model_pricing(data: dict[str, Any]) -> VideoModelPricing:
    return VideoModelPricing(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        cost_per_minute=data["costPerMinute"],
        resolution=data.get("resolution"),
        max_duration=data.get("maxDuration"),
        quality_mode=data.get("qualityMode"),
        source=data["source"],
        status=data.get("status"),
        confidence=data.get("confidence", "low"),
        confidence_score=data.get("confidenceScore", 0),
        confidence_level=data.get("confidenceLevel", "low"),
        freshness=_parse_freshness(data.get("freshness")),
        last_updated=data.get("lastUpdated"),
        launch_date=data.get("launchDate"),
    )


def _parse_video_history_point(data: dict[str, Any]) -> VideoPriceHistoryPoint:
    return VideoPriceHistoryPoint(
        date=data["date"],
        cost_per_minute=data["costPerMinute"],
    )


def _parse_video_model_history(data: dict[str, Any]) -> VideoModelHistory:
    return VideoModelHistory(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        history=[_parse_video_history_point(p) for p in data["history"]],
    )


def _parse_video_provider_summary(data: dict[str, Any]) -> VideoProviderSummary:
    return VideoProviderSummary(
        id=data["id"],
        display_name=data["displayName"],
        model_count=data["modelCount"],
        cheapest_cost_per_minute=data["cheapestCostPerMinute"],
    )


# ---------------------------------------------------------------------------
# Avatar pricing types
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class AvatarModelPricing:
    model_id: str
    provider: str
    display_name: str
    cost_per_minute: float
    avatar_type: str | None
    resolution: str | None
    max_duration: int | None
    quality_mode: str | None
    source: Source
    status: ModelStatus | None
    confidence: DataConfidence
    confidence_score: int
    confidence_level: ConfidenceLevel
    freshness: FreshnessInfo
    last_updated: str | None
    launch_date: str | None
    lip_sync: bool | None = None


@dataclass(slots=True)
class AvatarCostEstimate:
    model_id: str
    duration_seconds: float
    cost_per_minute: float
    total_cost: float


@dataclass(slots=True)
class AvatarPriceHistoryPoint:
    date: str
    cost_per_minute: float


@dataclass(slots=True)
class AvatarModelHistory:
    model_id: str
    provider: str
    display_name: str
    history: list[AvatarPriceHistoryPoint]


@dataclass(slots=True)
class AvatarProviderSummary:
    id: str
    display_name: str
    model_count: int
    cheapest_cost_per_minute: float


def _parse_avatar_model_pricing(data: dict[str, Any]) -> AvatarModelPricing:
    return AvatarModelPricing(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        cost_per_minute=data["costPerMinute"],
        avatar_type=data.get("avatarType"),
        resolution=data.get("resolution"),
        max_duration=data.get("maxDuration"),
        quality_mode=data.get("qualityMode"),
        source=data["source"],
        status=data.get("status"),
        confidence=data.get("confidence", "low"),
        confidence_score=data.get("confidenceScore", 0),
        confidence_level=data.get("confidenceLevel", "low"),
        freshness=_parse_freshness(data.get("freshness")),
        last_updated=data.get("lastUpdated"),
        launch_date=data.get("launchDate"),
        lip_sync=data.get("lipSync"),
    )


def _parse_avatar_history_point(data: dict[str, Any]) -> AvatarPriceHistoryPoint:
    return AvatarPriceHistoryPoint(
        date=data["date"],
        cost_per_minute=data["costPerMinute"],
    )


def _parse_avatar_model_history(data: dict[str, Any]) -> AvatarModelHistory:
    return AvatarModelHistory(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        history=[_parse_avatar_history_point(p) for p in data["history"]],
    )


def _parse_avatar_provider_summary(data: dict[str, Any]) -> AvatarProviderSummary:
    return AvatarProviderSummary(
        id=data["id"],
        display_name=data["displayName"],
        model_count=data["modelCount"],
        cheapest_cost_per_minute=data["cheapestCostPerMinute"],
    )


# ---------------------------------------------------------------------------
# TTS pricing types
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class TtsModelPricing:
    model_id: str
    provider: str
    display_name: str
    cost_per_m_chars: float
    voice_type: str | None
    max_characters: int | None
    supported_languages: int | None
    source: Source
    status: ModelStatus | None
    confidence: DataConfidence
    confidence_score: int
    confidence_level: ConfidenceLevel
    freshness: FreshnessInfo
    last_updated: str | None
    launch_date: str | None


@dataclass(slots=True)
class TtsCostEstimate:
    model_id: str
    characters: int
    cost_per_m_chars: float
    total_cost: float


@dataclass(slots=True)
class TtsPriceHistoryPoint:
    date: str
    cost_per_m_chars: float


@dataclass(slots=True)
class TtsModelHistory:
    model_id: str
    provider: str
    display_name: str
    history: list[TtsPriceHistoryPoint]


@dataclass(slots=True)
class TtsProviderSummary:
    id: str
    display_name: str
    model_count: int
    cheapest_cost_per_m_chars: float


def _parse_tts_model_pricing(data: dict[str, Any]) -> TtsModelPricing:
    return TtsModelPricing(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        cost_per_m_chars=data["costPerMChars"],
        voice_type=data.get("voiceType"),
        max_characters=data.get("maxCharacters"),
        supported_languages=data.get("supportedLanguages"),
        source=data["source"],
        status=data.get("status"),
        confidence=data.get("confidence", "low"),
        confidence_score=data.get("confidenceScore", 0),
        confidence_level=data.get("confidenceLevel", "low"),
        freshness=_parse_freshness(data.get("freshness")),
        last_updated=data.get("lastUpdated"),
        launch_date=data.get("launchDate"),
    )


def _parse_tts_history_point(data: dict[str, Any]) -> TtsPriceHistoryPoint:
    return TtsPriceHistoryPoint(
        date=data["date"],
        cost_per_m_chars=data["costPerMChars"],
    )


def _parse_tts_model_history(data: dict[str, Any]) -> TtsModelHistory:
    return TtsModelHistory(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        history=[_parse_tts_history_point(p) for p in data["history"]],
    )


def _parse_tts_provider_summary(data: dict[str, Any]) -> TtsProviderSummary:
    return TtsProviderSummary(
        id=data["id"],
        display_name=data["displayName"],
        model_count=data["modelCount"],
        cheapest_cost_per_m_chars=data["cheapestCostPerMChars"],
    )


# ---------------------------------------------------------------------------
# STT pricing types
# ---------------------------------------------------------------------------


@dataclass(slots=True)
class SttModelPricing:
    model_id: str
    provider: str
    display_name: str
    cost_per_minute: float
    stt_type: str | None
    max_duration: int | None
    supported_languages: int | None
    source: Source
    status: ModelStatus | None
    confidence: DataConfidence
    confidence_score: int
    confidence_level: ConfidenceLevel
    freshness: FreshnessInfo
    last_updated: str | None
    launch_date: str | None


@dataclass(slots=True)
class SttCostEstimate:
    model_id: str
    duration_seconds: float
    cost_per_minute: float
    total_cost: float


@dataclass(slots=True)
class SttPriceHistoryPoint:
    date: str
    cost_per_minute: float


@dataclass(slots=True)
class SttModelHistory:
    model_id: str
    provider: str
    display_name: str
    history: list[SttPriceHistoryPoint]


@dataclass(slots=True)
class SttProviderSummary:
    id: str
    display_name: str
    model_count: int
    cheapest_cost_per_minute: float


def _parse_stt_model_pricing(data: dict[str, Any]) -> SttModelPricing:
    return SttModelPricing(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        cost_per_minute=data["costPerMinute"],
        stt_type=data.get("sttType"),
        max_duration=data.get("maxDuration"),
        supported_languages=data.get("supportedLanguages"),
        source=data["source"],
        status=data.get("status"),
        confidence=data.get("confidence", "low"),
        confidence_score=data.get("confidenceScore", 0),
        confidence_level=data.get("confidenceLevel", "low"),
        freshness=_parse_freshness(data.get("freshness")),
        last_updated=data.get("lastUpdated"),
        launch_date=data.get("launchDate"),
    )


def _parse_stt_history_point(data: dict[str, Any]) -> SttPriceHistoryPoint:
    return SttPriceHistoryPoint(
        date=data["date"],
        cost_per_minute=data["costPerMinute"],
    )


def _parse_stt_model_history(data: dict[str, Any]) -> SttModelHistory:
    return SttModelHistory(
        model_id=data["modelId"],
        provider=data["provider"],
        display_name=data["displayName"],
        history=[_parse_stt_history_point(p) for p in data["history"]],
    )


def _parse_stt_provider_summary(data: dict[str, Any]) -> SttProviderSummary:
    return SttProviderSummary(
        id=data["id"],
        display_name=data["displayName"],
        model_count=data["modelCount"],
        cheapest_cost_per_minute=data["cheapestCostPerMinute"],
    )
