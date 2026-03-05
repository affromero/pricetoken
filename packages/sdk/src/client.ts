import type {
  ModelPricing,
  ModelHistory,
  ProviderSummary,
  ImageModelPricing,
  ImageModelHistory,
  ImageProviderSummary,
  PriceTokenResponse,
  PriceTokenError,
  VideoModelPricing,
  VideoModelHistory,
  VideoProviderSummary,
} from './types';

const SDK_VERSION = '0.8.0';

export interface ClientOptions {
  baseUrl?: string;
  apiKey?: string;
  telemetry?: boolean;
}

export class PriceTokenClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly telemetryEnabled: boolean;
  private telemetrySent = false;

  constructor(options?: ClientOptions) {
    this.baseUrl = (options?.baseUrl ?? 'https://pricetoken.ai').replace(/\/$/, '');
    this.apiKey = options?.apiKey;
    this.telemetryEnabled = options?.telemetry ?? false;
  }

  private sendTelemetry(): void {
    if (!this.telemetryEnabled || this.telemetrySent) return;
    this.telemetrySent = true;

    const runtime =
      typeof globalThis.process !== 'undefined'
        ? `node-${globalThis.process.version?.replace('v', '') ?? 'unknown'}`
        : 'browser';

    fetch(`${this.baseUrl}/api/v1/telemetry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sdk: 'js', version: SDK_VERSION, runtime }),
    }).catch(() => {
      // fire-and-forget
    });
  }

  private async request<T>(path: string): Promise<T> {
    this.sendTelemetry();
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

  async getPricing(opts?: { provider?: string; currency?: string; after?: string; before?: string }): Promise<ModelPricing[]> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    if (opts?.currency) params.set('currency', opts.currency);
    if (opts?.after) params.set('after', opts.after);
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    return this.request<ModelPricing[]>(`/api/v1/pricing/text${qs ? `?${qs}` : ''}`);
  }

  async getModel(modelId: string, opts?: { currency?: string }): Promise<ModelPricing> {
    const params = new URLSearchParams();
    if (opts?.currency) params.set('currency', opts.currency);
    const qs = params.toString();
    return this.request<ModelPricing>(`/api/v1/pricing/text/${encodeURIComponent(modelId)}${qs ? `?${qs}` : ''}`);
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
    return this.request<ModelHistory[]>(`/api/v1/pricing/text/history${qs ? `?${qs}` : ''}`);
  }

  async getProviders(): Promise<ProviderSummary[]> {
    return this.request<ProviderSummary[]>('/api/v1/pricing/text/providers');
  }

  async compare(modelIds: string[], opts?: { currency?: string }): Promise<ModelPricing[]> {
    const params = new URLSearchParams({ models: modelIds.join(',') });
    if (opts?.currency) params.set('currency', opts.currency);
    return this.request<ModelPricing[]>(`/api/v1/pricing/text/compare?${params}`);
  }

  async getCheapest(opts?: { provider?: string; currency?: string; after?: string; before?: string }): Promise<ModelPricing> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    if (opts?.currency) params.set('currency', opts.currency);
    if (opts?.after) params.set('after', opts.after);
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    return this.request<ModelPricing>(`/api/v1/pricing/text/cheapest${qs ? `?${qs}` : ''}`);
  }

  // Image pricing methods

  async getImagePricing(opts?: { provider?: string; currency?: string; after?: string; before?: string }): Promise<ImageModelPricing[]> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    if (opts?.currency) params.set('currency', opts.currency);
    if (opts?.after) params.set('after', opts.after);
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    return this.request<ImageModelPricing[]>(`/api/v1/pricing/image${qs ? `?${qs}` : ''}`);
  }

  async getImageModel(modelId: string, opts?: { currency?: string }): Promise<ImageModelPricing> {
    const params = new URLSearchParams();
    if (opts?.currency) params.set('currency', opts.currency);
    const qs = params.toString();
    return this.request<ImageModelPricing>(`/api/v1/pricing/image/${encodeURIComponent(modelId)}${qs ? `?${qs}` : ''}`);
  }

  async getImageHistory(opts?: {
    days?: number;
    modelId?: string;
    provider?: string;
  }): Promise<ImageModelHistory[]> {
    const params = new URLSearchParams();
    if (opts?.days) params.set('days', String(opts.days));
    if (opts?.modelId) params.set('modelId', opts.modelId);
    if (opts?.provider) params.set('provider', opts.provider);
    const qs = params.toString();
    return this.request<ImageModelHistory[]>(`/api/v1/pricing/image/history${qs ? `?${qs}` : ''}`);
  }

  async getImageProviders(): Promise<ImageProviderSummary[]> {
    return this.request<ImageProviderSummary[]>('/api/v1/pricing/image/providers');
  }

  async compareImages(modelIds: string[], opts?: { currency?: string }): Promise<ImageModelPricing[]> {
    const params = new URLSearchParams({ models: modelIds.join(',') });
    if (opts?.currency) params.set('currency', opts.currency);
    return this.request<ImageModelPricing[]>(`/api/v1/pricing/image/compare?${params}`);
  }

  async getCheapestImage(opts?: { provider?: string; currency?: string; after?: string; before?: string }): Promise<ImageModelPricing> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    if (opts?.currency) params.set('currency', opts.currency);
    if (opts?.after) params.set('after', opts.after);
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    return this.request<ImageModelPricing>(`/api/v1/pricing/image/cheapest${qs ? `?${qs}` : ''}`);
  }

  // Video pricing methods

  async getVideoPricing(opts?: { provider?: string; currency?: string; after?: string; before?: string }): Promise<VideoModelPricing[]> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    if (opts?.currency) params.set('currency', opts.currency);
    if (opts?.after) params.set('after', opts.after);
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    return this.request<VideoModelPricing[]>(`/api/v1/video${qs ? `?${qs}` : ''}`);
  }

  async getVideoModel(modelId: string, opts?: { currency?: string }): Promise<VideoModelPricing> {
    const params = new URLSearchParams();
    if (opts?.currency) params.set('currency', opts.currency);
    const qs = params.toString();
    return this.request<VideoModelPricing>(`/api/v1/video/${encodeURIComponent(modelId)}${qs ? `?${qs}` : ''}`);
  }

  async getVideoHistory(opts?: { days?: number; modelId?: string; provider?: string }): Promise<VideoModelHistory[]> {
    const params = new URLSearchParams();
    if (opts?.days) params.set('days', String(opts.days));
    if (opts?.modelId) params.set('modelId', opts.modelId);
    if (opts?.provider) params.set('provider', opts.provider);
    const qs = params.toString();
    return this.request<VideoModelHistory[]>(`/api/v1/video/history${qs ? `?${qs}` : ''}`);
  }

  async getVideoProviders(): Promise<VideoProviderSummary[]> {
    return this.request<VideoProviderSummary[]>('/api/v1/video/providers');
  }

  async compareVideoModels(modelIds: string[], opts?: { currency?: string }): Promise<VideoModelPricing[]> {
    const params = new URLSearchParams({ models: modelIds.join(',') });
    if (opts?.currency) params.set('currency', opts.currency);
    return this.request<VideoModelPricing[]>(`/api/v1/video/compare?${params}`);
  }

  async getCheapestVideoModel(opts?: { provider?: string; currency?: string; after?: string; before?: string }): Promise<VideoModelPricing> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    if (opts?.currency) params.set('currency', opts.currency);
    if (opts?.after) params.set('after', opts.after);
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    return this.request<VideoModelPricing>(`/api/v1/video/cheapest${qs ? `?${qs}` : ''}`);
  }
}
