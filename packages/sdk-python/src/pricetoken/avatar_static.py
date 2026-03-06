"""Static avatar pricing data for offline cost calculation."""

from pricetoken.types import AvatarModelPricing, FreshnessInfo

STATIC_AVATAR_PRICING: list[AvatarModelPricing] = [
    # HeyGen — Standard Avatar
    # 1 credit = 1 min of video, $0.99/credit on API plan
    AvatarModelPricing(
        model_id="heygen-avatar-standard",
        provider="heygen",
        display_name="HeyGen Standard Avatar",
        cost_per_minute=0.99,
        avatar_type="standard",
        resolution="1080p",
        max_duration=None,
        quality_mode="standard",
        source="seed",
        status="active",
        confidence="high",
        confidence_score=65,
        confidence_level="medium",
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date="2024-01-15",
    ),
    # HeyGen — Interactive Avatar (Avatar IV)
    # 6 credits/min = $5.94/min
    AvatarModelPricing(
        model_id="heygen-avatar-iv",
        provider="heygen",
        display_name="HeyGen Interactive Avatar IV",
        cost_per_minute=5.94,
        avatar_type="premium",
        resolution="1080p",
        max_duration=None,
        quality_mode="premium",
        source="seed",
        status="active",
        confidence="high",
        confidence_score=65,
        confidence_level="medium",
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date="2025-03-01",
    ),
    # HeyGen — Video Translation
    # 3 credits/min = $2.97/min
    AvatarModelPricing(
        model_id="heygen-video-translation",
        provider="heygen",
        display_name="HeyGen Video Translation",
        cost_per_minute=2.97,
        avatar_type="translation",
        resolution="1080p",
        max_duration=None,
        quality_mode="standard",
        source="seed",
        status="active",
        confidence="high",
        confidence_score=65,
        confidence_level="medium",
        freshness=FreshnessInfo(last_verified="", age_hours=0, stale=False),
        last_updated=None,
        launch_date="2024-06-01",
    ),
]
