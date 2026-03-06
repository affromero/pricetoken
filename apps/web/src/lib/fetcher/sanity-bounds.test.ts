import { describe, it, expect } from 'vitest';
import {
  checkTextPriceSanity,
  checkImagePriceSanity,
  checkVideoPriceSanity,
  checkAvatarPriceSanity,
  checkTtsPriceSanity,
  checkSttPriceSanity,
} from './sanity-bounds';

describe('checkTextPriceSanity', () => {
  it('accepts valid text pricing', () => {
    expect(checkTextPriceSanity('gpt-4.1', 2.0, 8.0).valid).toBe(true);
  });

  it('rejects zero input price', () => {
    const result = checkTextPriceSanity('test', 0, 5.0);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('positive');
  });

  it('rejects negative output price', () => {
    const result = checkTextPriceSanity('test', 1.0, -2.0);
    expect(result.valid).toBe(false);
  });

  it('rejects input exceeding max', () => {
    const result = checkTextPriceSanity('test', 300, 500);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('exceeds max');
  });

  it('rejects input > output (likely swapped)', () => {
    const result = checkTextPriceSanity('test', 10, 5);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('swapped');
  });

  it('rejects below minimum price', () => {
    const result = checkTextPriceSanity('test', 0.001, 0.01);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('below min');
  });
});

describe('checkImagePriceSanity', () => {
  it('accepts valid image pricing', () => {
    expect(checkImagePriceSanity('dall-e-3', 0.04).valid).toBe(true);
  });

  it('rejects zero price', () => {
    expect(checkImagePriceSanity('test', 0).valid).toBe(false);
  });

  it('rejects price above max', () => {
    expect(checkImagePriceSanity('test', 10).valid).toBe(false);
  });

  it('rejects price below min', () => {
    expect(checkImagePriceSanity('test', 0.0001).valid).toBe(false);
  });
});

describe('checkVideoPriceSanity', () => {
  it('accepts valid video pricing', () => {
    expect(checkVideoPriceSanity('runway-gen4-720p', 7.2).valid).toBe(true);
  });

  it('rejects zero cost', () => {
    expect(checkVideoPriceSanity('test', 0).valid).toBe(false);
  });

  it('rejects cost above max', () => {
    expect(checkVideoPriceSanity('test', 150).valid).toBe(false);
  });

  it('rejects cost below min', () => {
    expect(checkVideoPriceSanity('test', 0.01).valid).toBe(false);
  });
});

describe('checkAvatarPriceSanity', () => {
  it('accepts valid avatar pricing', () => {
    expect(checkAvatarPriceSanity('heygen-avatar-standard', 0.99).valid).toBe(true);
  });

  it('rejects zero cost', () => {
    expect(checkAvatarPriceSanity('test', 0).valid).toBe(false);
  });

  it('rejects cost above max', () => {
    expect(checkAvatarPriceSanity('test', 60).valid).toBe(false);
  });

  it('rejects cost below min', () => {
    expect(checkAvatarPriceSanity('test', 0.01).valid).toBe(false);
  });
});

describe('checkTtsPriceSanity', () => {
  it('accepts valid TTS pricing', () => {
    expect(checkTtsPriceSanity('openai-tts-1', 15.0).valid).toBe(true);
  });

  it('accepts boundary min price', () => {
    expect(checkTtsPriceSanity('test', 0.50).valid).toBe(true);
  });

  it('accepts boundary max price', () => {
    expect(checkTtsPriceSanity('test', 500).valid).toBe(true);
  });

  it('rejects zero cost', () => {
    const result = checkTtsPriceSanity('test', 0);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('positive');
  });

  it('rejects cost above max', () => {
    const result = checkTtsPriceSanity('test', 600);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('exceeds max');
  });

  it('rejects cost below min', () => {
    const result = checkTtsPriceSanity('test', 0.1);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('below min');
  });
});

describe('checkSttPriceSanity', () => {
  it('accepts valid STT pricing', () => {
    expect(checkSttPriceSanity('openai-whisper-1', 0.006).valid).toBe(true);
  });

  it('accepts boundary min price', () => {
    expect(checkSttPriceSanity('test', 0.0005).valid).toBe(true);
  });

  it('accepts boundary max price', () => {
    expect(checkSttPriceSanity('test', 1.0).valid).toBe(true);
  });

  it('rejects zero cost', () => {
    const result = checkSttPriceSanity('test', 0);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('positive');
  });

  it('rejects cost above max', () => {
    const result = checkSttPriceSanity('test', 2.0);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('exceeds max');
  });

  it('rejects cost below min', () => {
    const result = checkSttPriceSanity('test', 0.0001);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('below min');
  });
});
