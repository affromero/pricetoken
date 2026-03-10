/**
 * Sanity bounds for extracted pricing data.
 * Rejects values that are obviously wrong before they enter the verification pipeline.
 */

export interface SanityCheckResult {
  valid: boolean;
  reason?: string;
}

/** Text model pricing bounds (USD per million tokens) */
const TEXT_MIN_PRICE = 0.01; // Cheapest models are ~$0.05/MTok
const TEXT_MAX_PRICE = 200; // Most expensive is ~$100/MTok

/** Image model pricing bounds (USD per image) */
const IMAGE_MIN_PRICE = 0.001; // Some models charge <$0.01
const IMAGE_MAX_PRICE = 5.0; // No image model exceeds $5/image

/** Video model pricing bounds (USD per minute) */
const VIDEO_MIN_PRICE = 0.10; // Cheapest ~$1/min
const VIDEO_MAX_PRICE = 100; // Most expensive ~$30/min, leave headroom

/** Avatar model pricing bounds (USD per minute) */
const AVATAR_MIN_PRICE = 0.10; // Cheapest ~$0.99/min
const AVATAR_MAX_PRICE = 50; // Most expensive ~$6/min, leave headroom

/** TTS model pricing bounds (USD per million characters) */
const TTS_MIN_PRICE = 0.50;
const TTS_MAX_PRICE = 500;

/** STT model pricing bounds (USD per minute) */
const STT_MIN_PRICE = 0.0005;
const STT_MAX_PRICE = 1.0;

export function checkTextPriceSanity(
  modelId: string,
  inputPerMTok: number,
  outputPerMTok: number
): SanityCheckResult {
  if (inputPerMTok <= 0 || outputPerMTok <= 0) {
    return { valid: false, reason: `${modelId}: prices must be positive (input=$${inputPerMTok}, output=$${outputPerMTok})` };
  }
  if (inputPerMTok > TEXT_MAX_PRICE) {
    return { valid: false, reason: `${modelId}: input price $${inputPerMTok}/MTok exceeds max $${TEXT_MAX_PRICE}` };
  }
  if (outputPerMTok > TEXT_MAX_PRICE) {
    return { valid: false, reason: `${modelId}: output price $${outputPerMTok}/MTok exceeds max $${TEXT_MAX_PRICE}` };
  }
  if (inputPerMTok < TEXT_MIN_PRICE) {
    return { valid: false, reason: `${modelId}: input price $${inputPerMTok}/MTok below min $${TEXT_MIN_PRICE}` };
  }
  if (inputPerMTok > outputPerMTok) {
    return { valid: false, reason: `${modelId}: input ($${inputPerMTok}) > output ($${outputPerMTok}) — likely swapped` };
  }
  return { valid: true };
}

export function checkImagePriceSanity(
  modelId: string,
  pricePerImage: number
): SanityCheckResult {
  if (pricePerImage <= 0) {
    return { valid: false, reason: `${modelId}: price must be positive ($${pricePerImage})` };
  }
  if (pricePerImage > IMAGE_MAX_PRICE) {
    return { valid: false, reason: `${modelId}: price $${pricePerImage}/image exceeds max $${IMAGE_MAX_PRICE}` };
  }
  if (pricePerImage < IMAGE_MIN_PRICE) {
    return { valid: false, reason: `${modelId}: price $${pricePerImage}/image below min $${IMAGE_MIN_PRICE}` };
  }
  return { valid: true };
}

export function checkVideoPriceSanity(
  modelId: string,
  costPerMinute: number
): SanityCheckResult {
  if (costPerMinute <= 0) {
    return { valid: false, reason: `${modelId}: cost must be positive ($${costPerMinute}/min)` };
  }
  if (costPerMinute > VIDEO_MAX_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMinute}/min exceeds max $${VIDEO_MAX_PRICE}` };
  }
  if (costPerMinute < VIDEO_MIN_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMinute}/min below min $${VIDEO_MIN_PRICE}` };
  }
  return { valid: true };
}

export function checkAvatarPriceSanity(
  modelId: string,
  costPerMinute: number
): SanityCheckResult {
  if (costPerMinute <= 0) {
    return { valid: false, reason: `${modelId}: cost must be positive ($${costPerMinute}/min)` };
  }
  if (costPerMinute > AVATAR_MAX_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMinute}/min exceeds max $${AVATAR_MAX_PRICE}` };
  }
  if (costPerMinute < AVATAR_MIN_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMinute}/min below min $${AVATAR_MIN_PRICE}` };
  }
  return { valid: true };
}

export function checkTtsPriceSanity(
  modelId: string,
  costPerMChars: number
): SanityCheckResult {
  if (costPerMChars <= 0) {
    return { valid: false, reason: `${modelId}: cost must be positive ($${costPerMChars}/M chars)` };
  }
  if (costPerMChars > TTS_MAX_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMChars}/M chars exceeds max $${TTS_MAX_PRICE}` };
  }
  if (costPerMChars < TTS_MIN_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMChars}/M chars below min $${TTS_MIN_PRICE}` };
  }
  return { valid: true };
}

/** Music model pricing bounds (USD per minute) */
const MUSIC_MIN_PRICE = 0.001; // SunoAPI.org is ~$0.00625/min
const MUSIC_MAX_PRICE = 10; // ElevenLabs is $0.50/min, generous ceiling

export function checkMusicPriceSanity(
  modelId: string,
  costPerMinute: number
): SanityCheckResult {
  if (costPerMinute <= 0) {
    return { valid: false, reason: `${modelId}: cost must be positive ($${costPerMinute}/min)` };
  }
  if (costPerMinute > MUSIC_MAX_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMinute}/min exceeds max $${MUSIC_MAX_PRICE}` };
  }
  if (costPerMinute < MUSIC_MIN_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMinute}/min below min $${MUSIC_MIN_PRICE}` };
  }
  return { valid: true };
}

export function checkSttPriceSanity(
  modelId: string,
  costPerMinute: number
): SanityCheckResult {
  if (costPerMinute <= 0) {
    return { valid: false, reason: `${modelId}: cost must be positive ($${costPerMinute}/min)` };
  }
  if (costPerMinute > STT_MAX_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMinute}/min exceeds max $${STT_MAX_PRICE}` };
  }
  if (costPerMinute < STT_MIN_PRICE) {
    return { valid: false, reason: `${modelId}: cost $${costPerMinute}/min below min $${STT_MIN_PRICE}` };
  }
  return { valid: true };
}
