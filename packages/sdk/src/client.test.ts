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
      'https://test.api/api/v1/pricing',
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
      'https://test.api/api/v1/pricing?provider=anthropic',
      expect.anything()
    );
  });

  it('getModel fetches single model', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      mockResponse({ modelId: 'gpt-4.1' }) as Response
    );

    await client.getModel('gpt-4.1');

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://test.api/api/v1/pricing/gpt-4.1',
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

  it('throws on HTTP error with no JSON body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error('no json')),
    } as unknown as Response);

    await expect(client.getPricing()).rejects.toThrow('HTTP 500');
  });
});
