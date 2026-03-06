export type ModelStatus = 'active' | 'deprecated' | 'preview';
export type DataConfidence = 'high' | 'medium' | 'low';
export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface FreshnessInfo {
  lastVerified: string;
  ageHours: number;
  stale: boolean;
}

export interface ModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  inputPerMTok: number;
  outputPerMTok: number;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  source: 'fetched' | 'seed' | 'admin' | 'verified' | 'carried';
  status: ModelStatus | null;
  confidence: DataConfidence;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  freshness: FreshnessInfo;
  lastUpdated: string | null;
  launchDate: string | null;
}

export interface PriceHistoryPoint {
  date: string;
  inputPerMTok: number;
  outputPerMTok: number;
}

export interface ModelHistory {
  modelId: string;
  provider: string;
  displayName: string;
  history: PriceHistoryPoint[];
}

export interface ProviderSummary {
  id: string;
  displayName: string;
  modelCount: number;
  cheapestInputPerMTok: number;
  cheapestOutputPerMTok: number;
}

export interface CostEstimate {
  modelId: string;
  inputTokens: number;
  outputTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
}

export interface PriceTokenResponse<T> {
  data: T;
  meta: {
    timestamp: string;
    cached: boolean;
    currency?: string;
    exchangeRate?: number;
  };
}

export interface PriceTokenError {
  error: string;
  status: number;
}

export type ImageQualityTier = 'standard' | 'hd' | 'ultra';

export interface ImageModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  pricePerImage: number;
  pricePerMegapixel: number | null;
  defaultResolution: string;
  qualityTier: ImageQualityTier;
  maxResolution: string | null;
  supportedFormats: string[];
  source: 'fetched' | 'seed' | 'admin' | 'verified' | 'carried';
  status: ModelStatus | null;
  confidence: DataConfidence;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  freshness: FreshnessInfo;
  lastUpdated: string | null;
  launchDate: string | null;
}

export interface ImageCostEstimate {
  modelId: string;
  imageCount: number;
  pricePerImage: number;
  totalCost: number;
}

export interface ImagePriceHistoryPoint {
  date: string;
  pricePerImage: number;
}

export interface ImageModelHistory {
  modelId: string;
  provider: string;
  displayName: string;
  history: ImagePriceHistoryPoint[];
}

export interface ImageProviderSummary {
  id: string;
  displayName: string;
  modelCount: number;
  cheapestPerImage: number;
}

export interface VideoModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  resolution: string | null;
  maxDuration: number | null;
  qualityMode: string | null;
  source: 'fetched' | 'seed' | 'admin' | 'verified' | 'carried';
  status: ModelStatus | null;
  confidence: DataConfidence;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  freshness: FreshnessInfo;
  lastUpdated: string | null;
  launchDate: string | null;
}

export interface VideoCostEstimate {
  modelId: string;
  durationSeconds: number;
  costPerMinute: number;
  totalCost: number;
}

export interface VideoPriceHistoryPoint {
  date: string;
  costPerMinute: number;
}

export interface VideoModelHistory {
  modelId: string;
  provider: string;
  displayName: string;
  history: VideoPriceHistoryPoint[];
}

export interface VideoProviderSummary {
  id: string;
  displayName: string;
  modelCount: number;
  cheapestCostPerMinute: number;
}

export interface AvatarModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  avatarType: string | null;
  resolution: string | null;
  maxDuration: number | null;
  qualityMode: string | null;
  source: 'fetched' | 'seed' | 'admin' | 'verified' | 'carried';
  status: ModelStatus | null;
  confidence: DataConfidence;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  freshness: FreshnessInfo;
  lastUpdated: string | null;
  launchDate: string | null;
}

export interface AvatarCostEstimate {
  modelId: string;
  durationSeconds: number;
  costPerMinute: number;
  totalCost: number;
}

export interface AvatarPriceHistoryPoint {
  date: string;
  costPerMinute: number;
}

export interface AvatarModelHistory {
  modelId: string;
  provider: string;
  displayName: string;
  history: AvatarPriceHistoryPoint[];
}

export interface AvatarProviderSummary {
  id: string;
  displayName: string;
  modelCount: number;
  cheapestCostPerMinute: number;
}
