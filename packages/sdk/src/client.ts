import type {
  ModelPricing,
  ModelHistory,
  ProviderSummary,
  PriceTokenResponse,
  PriceTokenError,
} from './types';

const SDK_VERSION = '0.6.0';

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
    return this.request<ModelPricing[]>(`/api/v1/pricing${qs ? `?${qs}` : ''}`);
  }

  async getModel(modelId: string, opts?: { currency?: string }): Promise<ModelPricing> {
    const params = new URLSearchParams();
    if (opts?.currency) params.set('currency', opts.currency);
    const qs = params.toString();
    return this.request<ModelPricing>(`/api/v1/pricing/${encodeURIComponent(modelId)}${qs ? `?${qs}` : ''}`);
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

  async compare(modelIds: string[], opts?: { currency?: string }): Promise<ModelPricing[]> {
    const params = new URLSearchParams({ models: modelIds.join(',') });
    if (opts?.currency) params.set('currency', opts.currency);
    return this.request<ModelPricing[]>(`/api/v1/pricing/compare?${params}`);
  }

  async getCheapest(opts?: { provider?: string; currency?: string; after?: string; before?: string }): Promise<ModelPricing> {
    const params = new URLSearchParams();
    if (opts?.provider) params.set('provider', opts.provider);
    if (opts?.currency) params.set('currency', opts.currency);
    if (opts?.after) params.set('after', opts.after);
    if (opts?.before) params.set('before', opts.before);
    const qs = params.toString();
    return this.request<ModelPricing>(`/api/v1/pricing/cheapest${qs ? `?${qs}` : ''}`);
  }
}
