export interface ModelPricing {
  modelId: string;
  provider: string;
  displayName: string;
  inputPerMTok: number;
  outputPerMTok: number;
  contextWindow: number | null;
  maxOutputTokens: number | null;
  source: 'fetched' | 'seed' | 'admin';
  lastUpdated: string | null;
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
