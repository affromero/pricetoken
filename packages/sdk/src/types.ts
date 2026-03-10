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

export type VideoInputType = 'text' | 'image' | 'text,image' | 'audio' | 'multimodal';

export interface VideoModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  inputType: VideoInputType | null;
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
  lipSync: boolean | null;
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

export interface TtsModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMChars: number;
  voiceType: string | null;
  maxCharacters: number | null;
  supportedLanguages: number | null;
  source: 'fetched' | 'seed' | 'admin' | 'verified' | 'carried';
  status: ModelStatus | null;
  confidence: DataConfidence;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  freshness: FreshnessInfo;
  lastUpdated: string | null;
  launchDate: string | null;
}

export interface TtsCostEstimate {
  modelId: string;
  characters: number;
  costPerMChars: number;
  totalCost: number;
}

export interface TtsPriceHistoryPoint {
  date: string;
  costPerMChars: number;
}

export interface TtsModelHistory {
  modelId: string;
  provider: string;
  displayName: string;
  history: TtsPriceHistoryPoint[];
}

export interface TtsProviderSummary {
  id: string;
  displayName: string;
  modelCount: number;
  cheapestCostPerMChars: number;
}

export interface SttModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  sttType: string | null;
  maxDuration: number | null;
  supportedLanguages: number | null;
  source: 'fetched' | 'seed' | 'admin' | 'verified' | 'carried';
  status: ModelStatus | null;
  confidence: DataConfidence;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  freshness: FreshnessInfo;
  lastUpdated: string | null;
  launchDate: string | null;
}

export interface SttCostEstimate {
  modelId: string;
  durationSeconds: number;
  costPerMinute: number;
  totalCost: number;
}

export interface SttPriceHistoryPoint {
  date: string;
  costPerMinute: number;
}

export interface SttModelHistory {
  modelId: string;
  provider: string;
  displayName: string;
  history: SttPriceHistoryPoint[];
}

export interface SttProviderSummary {
  id: string;
  displayName: string;
  modelCount: number;
  cheapestCostPerMinute: number;
}

export interface MusicModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  maxDuration: number | null;
  outputFormat: string | null;
  vocals: boolean | null;
  official: boolean;
  pricingNote: string | null;
  source: 'fetched' | 'seed' | 'admin' | 'verified' | 'carried';
  status: ModelStatus | null;
  confidence: DataConfidence;
  confidenceScore: number;
  confidenceLevel: ConfidenceLevel;
  freshness: FreshnessInfo;
  lastUpdated: string | null;
  launchDate: string | null;
}

export interface MusicCostEstimate {
  modelId: string;
  durationSeconds: number;
  costPerMinute: number;
  totalCost: number;
}

export interface MusicPriceHistoryPoint {
  date: string;
  costPerMinute: number;
}

export interface MusicModelHistory {
  modelId: string;
  provider: string;
  displayName: string;
  history: MusicPriceHistoryPoint[];
}

export interface MusicProviderSummary {
  id: string;
  displayName: string;
  modelCount: number;
  cheapestCostPerMinute: number;
}
