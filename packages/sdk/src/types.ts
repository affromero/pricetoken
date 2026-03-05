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

export interface VideoModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  costPerMinute: number;
  resolution: string | null;
  maxDuration: number | null;
  qualityMode: string | null;
  source: 'fetched' | 'seed' | 'admin' | 'verified';
  status: ModelStatus | null;
  confidence: DataConfidence;
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
