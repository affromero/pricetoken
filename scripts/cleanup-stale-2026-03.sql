-- 1. Delete all rows for 5 removed avatar model IDs
DELETE FROM "AvatarPricingSnapshot"
WHERE "modelId" IN (
  'heygen-translate-precision', 'heygen-translate-proofread',
  'heygen-translate-speed', 'heygen-video-agent-prompt', 'heygen-video-translation'
);

-- 2. Delete stale low-confidence rows from before March 7
DELETE FROM "ModelPricingSnapshot"
WHERE "confidence" = 'low' AND "source" IN ('flagged', 'fetched')
  AND "createdAt" < '2026-03-07T00:00:00Z';

DELETE FROM "AvatarPricingSnapshot"
WHERE "confidence" = 'low' AND "source" IN ('flagged', 'fetched')
  AND "createdAt" < '2026-03-07T00:00:00Z';

-- 3. Deprecate old HeyGen IDs in DB
UPDATE "AvatarPricingSnapshot" SET "status" = 'deprecated'
WHERE "modelId" IN ('heygen-avatar-standard', 'heygen-avatar-iv');

-- 4. Deprecate gemini-3-pro-preview in DB
UPDATE "ModelPricingSnapshot" SET "status" = 'deprecated'
WHERE "modelId" = 'gemini-3-pro-preview';
