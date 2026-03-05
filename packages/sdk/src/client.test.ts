import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PriceTokenClient } from './client';

const mockResponse = <T>(data: T) => ({
  ok: true,
  json: () => Promise.resolve({ data, meta: { timestamp: new Date().toISOString(), cached: false } }),
});

const mockErrorResponse = (status: number, error: string) => ({
  ok: false,
  status,
  json: () => Promise.resolve({ error, status }),
});

describe('PriceTokenClient', () => {
  let client: PriceTokenClient;

  beforeEach(() => {
    client = new PriceTokenClient({ baseUrl: 'https://test.api' });
    vi.restoreAllMocks();
  });

  it('uses default base URL', () => {
    const defaultClient = new PriceTokenClient();
    expect(defaultClient).toBeDefined();
  });

  it('sends API key as Bearer token', async () => {
    const authedClient = new PriceTokenClient({
      baseUrl: 'https://test.api',
      apiKey: 'pt_test123',
    });

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await authedClient.getPricing();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/text',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer pt_test123',
        }),
      })
    );
  });

  it('getPricing returns model array', async () => {
    const mockData = [{ modelId: 'test', provider: 'test', inputPerMTok: 1, outputPerMTok: 2 }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(mockData) as Response);

    const result = await client.getPricing();
    expect(result).toEqual(mockData);
  });

  it('getPricing filters by provider', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getPricing({ provider: 'anthropic' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/text?provider=anthropic',
      expect.anything()
    );
  });

  it('getModel fetches single model', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse({ modelId: 'gpt-4.1' }) as Response
    );

    await client.getModel('gpt-4.1');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/text/gpt-4.1',
      expect.anything()
    );
  });

  it('getHistory passes query params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getHistory({ days: 30, provider: 'openai' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('days=30'),
      expect.anything()
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('provider=openai'),
      expect.anything()
    );
  });

  it('compare sends model IDs as comma-separated list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.compare(['gpt-4.1', 'claude-sonnet-4-6']);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('models=gpt-4.1%2Cclaude-sonnet-4-6'),
      expect.anything()
    );
  });

  it('throws typed error on failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockErrorResponse(404, 'Model not found') as unknown as Response
    );

    await expect(client.getModel('nonexistent')).rejects.toThrow('Model not found');
  });

  it('getPricing forwards after and before date params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getPricing({ after: '2025-01-01', before: '2025-12-31' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('after=2025-01-01'),
      expect.anything()
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('before=2025-12-31'),
      expect.anything()
    );
  });

  it('getCheapest forwards after and before date params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse({}) as Response
    );

    await client.getCheapest({ after: '2025-06-01' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('after=2025-06-01'),
      expect.anything()
    );
  });

  it('throws on HTTP error with no JSON body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('no json')),
    } as unknown as Response);

    await expect(client.getPricing()).rejects.toThrow('HTTP 500');
  });

  it('does not send telemetry when disabled (default)', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getPricing();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/text'),
      expect.anything()
    );
  });

  it('sends telemetry POST on first API call when enabled', async () => {
    const telemetryClient = new PriceTokenClient({
      baseUrl: 'https://test.api',
      telemetry: true,
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await telemetryClient.getPricing();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/telemetry',
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('sends telemetry only once across multiple calls', async () => {
    const telemetryClient = new PriceTokenClient({
      baseUrl: 'https://test.api',
      telemetry: true,
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await telemetryClient.getPricing();
    await telemetryClient.getPricing();

    const telemetryCalls = fetchSpy.mock.calls.filter(
      (call) => (call[0] as string).includes('/telemetry')
    );
    expect(telemetryCalls).toHaveLength(1);
  });

  it('getVideoPricing returns video model array', async () => {
    const mockData = [{ modelId: 'runway-gen4-720p', provider: 'runway', costPerMinute: 7.2 }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(mockData) as Response);

    const result = await client.getVideoPricing();
    expect(result).toEqual(mockData);
  });

  it('getVideoModel fetches single video model', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse({ modelId: 'runway-gen4-720p' }) as Response
    );

    await client.getVideoModel('runway-gen4-720p');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/video/runway-gen4-720p',
      expect.anything()
    );
  });

  it('getVideoHistory passes query params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getVideoHistory({ days: 30, provider: 'runway' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('days=30'),
      expect.anything()
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('provider=runway'),
      expect.anything()
    );
  });

  it('getVideoProviders fetches video provider list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getVideoProviders();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/video/providers',
      expect.anything()
    );
  });

  it('compareVideoModels sends model IDs', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.compareVideoModels(['runway-gen4-720p', 'kling-3.0-1080p']);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('models=runway-gen4-720p%2Ckling-3.0-1080p'),
      expect.anything()
    );
  });

  it('getCheapestVideoModel fetches cheapest video model', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse({}) as Response
    );

    await client.getCheapestVideoModel({ provider: 'runway' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/v1/video/cheapest'),
      expect.anything()
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('provider=runway'),
      expect.anything()
    );
  });

  it('does not throw when telemetry fetch fails', async () => {
    const telemetryClient = new PriceTokenClient({
      baseUrl: 'https://test.api',
      telemetry: true,
    });

    let callCount = 0;
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      callCount++;
      if ((url as string).includes('/telemetry')) {
        return Promise.reject(new Error('network error'));
      }
      return Promise.resolve(mockResponse([]) as Response);
    });

    const result = await telemetryClient.getPricing();
    expect(result).toEqual([]);
    expect(callCount).toBe(2);
  });

  // Image pricing methods

  it('getImagePricing returns image model array', async () => {
    const mockData = [{ modelId: 'dall-e-3', provider: 'openai', pricePerImage: 0.04 }];
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse(mockData) as Response);

    const result = await client.getImagePricing();
    expect(result).toEqual(mockData);
  });

  it('getImagePricing filters by provider', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getImagePricing({ provider: 'openai' });

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/image?provider=openai',
      expect.anything()
    );
  });

  it('getImageModel fetches single image model', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse({ modelId: 'dall-e-3-standard-1024' }) as Response
    );

    await client.getImageModel('dall-e-3-standard-1024');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/image/dall-e-3-standard-1024',
      expect.anything()
    );
  });

  it('getImageHistory passes query params', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getImageHistory({ days: 30, provider: 'openai' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('days=30'),
      expect.anything()
    );
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('provider=openai'),
      expect.anything()
    );
  });

  it('getImageProviders fetches image providers', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.getImageProviders();

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/image/providers',
      expect.anything()
    );
  });

  it('compareImages sends model IDs as comma-separated list', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse([]) as Response
    );

    await client.compareImages(['dall-e-3-standard-1024', 'imagen-4-fast']);

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('models=dall-e-3-standard-1024%2Cimagen-4-fast'),
      expect.anything()
    );
  });

  it('getCheapestImage forwards provider param', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse({}) as Response
    );

    await client.getCheapestImage({ provider: 'openai' });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('provider=openai'),
      expect.anything()
    );
  });
});
