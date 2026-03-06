import type { AvatarModelPricing } from './types';

export const STATIC_AVATAR_PRICING: AvatarModelPricing[] = [
  // HeyGen — Standard Avatar
  // 1 credit = 1 min of video, $0.99/credit on API plan
  {
    modelId: 'heygen-avatar-standard',
    provider: 'heygen',
    displayName: 'HeyGen Standard Avatar',
    costPerMinute: 0.99,
    avatarType: 'standard',
    resolution: '1080p',
    maxDuration: null,
    qualityMode: 'standard',
    source: 'seed',
    status: 'active',
    confidence: 'high',
    confidenceScore: 65,
    confidenceLevel: 'medium',
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: '2024-01-15',
  },
  // HeyGen — Interactive Avatar (Avatar IV)
  // 6 credits/min = $5.94/min
  {
    modelId: 'heygen-avatar-iv',
    provider: 'heygen',
    displayName: 'HeyGen Interactive Avatar IV',
    costPerMinute: 5.94,
    avatarType: 'premium',
    resolution: '1080p',
    maxDuration: null,
    qualityMode: 'premium',
    source: 'seed',
    status: 'active',
    confidence: 'high',
    confidenceScore: 65,
    confidenceLevel: 'medium',
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: '2025-03-01',
  },
  // HeyGen — Video Translation
  // 3 credits/min = $2.97/min
  {
    modelId: 'heygen-video-translation',
    provider: 'heygen',
    displayName: 'HeyGen Video Translation',
    costPerMinute: 2.97,
    avatarType: 'translation',
    resolution: '1080p',
    maxDuration: null,
    qualityMode: 'standard',
    source: 'seed',
    status: 'active',
    confidence: 'high',
    confidenceScore: 65,
    confidenceLevel: 'medium',
    freshness: { lastVerified: new Date().toISOString(), ageHours: 0, stale: false },
    lastUpdated: null,
    launchDate: '2024-06-01',
  },
];
