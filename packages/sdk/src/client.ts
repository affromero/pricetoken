import type {
  ModelPricing,
  ModelHistory,
  ProviderSummary,
  PriceTokenResponse,
  PriceTokenError,
} from './types';

interface ClientOptions {
  baseUrl?: string;
  apiKey?: string;
}

export class PriceTokenClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(options?: ClientOptions) {
    this.baseUrl = (options?.baseUrl ?? 'https://pricetoken.ai').replace(/\/$/, '');
    this.apiKey = options?.apiKey;
  }

  private async request<T>(path: string): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const res = await fetch(`${this.baseUrl}${path}`, { headers });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as PriceTokenError | null;
      const error = new Error(body?.error ?? `HTTP ${res.status}`);
      (error as Error & { status: number }).status = res.status;
      throw error;
    }

    const json = (await res.json()) as PriceTokenResponse<T>;
    return json.data;
  }

  async getPricing(opts?: { provider?: string }): Promise<ModelPricing[]> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    const qs = params.toString();
    return this.request<ModelPricing[]>(`/api/v1/pricing${qs ? `?${qs}` : ''}`);
  }

  async getModel(modelId: string): Promise<ModelPricing> {
    return this.request<ModelPricing>(`/api/v1/pricing/${encodeURIComponent(modelId)}`);
  }

  async getHistory(opts?: {
    days?: number;
    modelId?: string;
    provider?: string;
  }): Promise<ModelHistory[]> {
    const params = new URLSearchParams();
    if (opts?.days) params.set('days', String(opts.days));
    if (opts?.modelId) params.set('modelId', opts.modelId);
    if (opts?.provider) params.set('provider', opts.provider);
    const qs = params.toString();
    return this.request<ModelHistory[]>(`/api/v1/pricing/history${qs ? `?${qs}` : ''}`);
  }

  async getProviders(): Promise<ProviderSummary[]> {
    return this.request<ProviderSummary[]>('/api/v1/pricing/providers');
  }

  async compare(modelIds: string[]): Promise<ModelPricing[]> {
    const params = new URLSearchParams({ models: modelIds.join(',') });
    return this.request<ModelPricing[]>(`/api/v1/pricing/compare?${params}`);
  }

  async getCheapest(opts?: { provider?: string }): Promise<ModelPricing> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    const qs = params.toString();
    return this.request<ModelPricing>(`/api/v1/pricing/cheapest${qs ? `?${qs}` : ''}`);
  }
}
