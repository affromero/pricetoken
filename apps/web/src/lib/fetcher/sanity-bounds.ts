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
