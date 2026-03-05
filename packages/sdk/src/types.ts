export type ModelStatus = 'active' | 'deprecated' | 'preview';
export type DataConfidence = 'high' | 'low';

export interface ModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  inputPerMTok: number;
  outputPerMTok: number;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  source: 'fetched' | 'seed' | 'admin' | 'verified';
  status: ModelStatus | null;
  confidence: DataConfidence;
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
  source: 'fetched' | 'seed' | 'admin';
  status: ModelStatus | null;
  confidence: DataConfidence;
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
