-- Backfill null launch dates across all pricing categories
-- Sources verified via web research + multi-agent verification
-- Run on production: docker exec pricetoken-postgres-1 psql -U pricetoken -d pricetoken -f /tmp/backfill-launch-dates.sql

BEGIN;

-- ============================================================
-- VIDEO (8 models)
-- ============================================================

-- Kling 2.5 Turbo via fal.ai — launched 2025-09-23
-- Source: https://ir.kuaishou.com/news-releases/news-release-details/kling-ai-launches-25-turbo-video-model-industry-leading
UPDATE "VideoPricingSnapshot"
SET "launchDate" = '2025-09-23'
WHERE "modelId" = 'fal-kling2.5-turbo-1080p' AND "launchDate" IS NULL;

-- MiniMax Hailuo 02 512p — launched 2025-06-18
-- Source: https://www.minimax.io/news/minimax-hailuo-02
UPDATE "VideoPricingSnapshot"
SET "launchDate" = '2025-06-18'
WHERE "modelId" = 'minimax-hailuo02-512p' AND "launchDate" IS NULL;

-- MiniMax Hailuo 2.3 Fast — launched 2025-10-28
-- Source: https://www.minimax.io/news/minimax-hailuo-23
UPDATE "VideoPricingSnapshot"
SET "launchDate" = '2025-10-28'
WHERE "modelId" IN ('minimax-hailuo23-fast-1080p', 'minimax-hailuo23-fast-768p') AND "launchDate" IS NULL;

-- Seedance 1.5 Pro (all variants) — launched 2025-12-16
-- Source: https://seed.bytedance.com/en/blog/sound-and-vision-all-in-one-take-the-official-release-of-seedance-1-5-pro
UPDATE "VideoPricingSnapshot"
SET "launchDate" = '2025-12-16'
WHERE "modelId" IN (
  'seedance-1.5-pro-480p',
  'seedance-1.5-pro-480p-audio',
  'seedance-1.5-pro-720p',
  'seedance-1.5-pro-720p-audio'
) AND "launchDate" IS NULL;

-- ============================================================
-- AVATAR (12 models)
-- ============================================================

-- HeyGen Avatar III (3.0 engine) — launched 2024-09-12
-- Source: https://www.heygen.com/blog/introducing-avatar-3-0-the-next-generation-of-ai-avatars
UPDATE "AvatarPricingSnapshot"
SET "launchDate" = '2024-09-12'
WHERE "modelId" IN (
  'heygen-digital-twin-iii',
  'heygen-photo-avatar-iii',
  'heygen-public-avatar-iii'
) AND "launchDate" IS NULL;

-- HeyGen Avatar IV — launched 2025-05-01
-- Source: https://community.heygen.com/public/events/product-launch-introducing-avatar-iv-m6fn84c06s
UPDATE "AvatarPricingSnapshot"
SET "launchDate" = '2025-05-01'
WHERE "modelId" IN (
  'heygen-digital-twin-iv',
  'heygen-photo-avatar-iv',
  'heygen-public-avatar-iv'
) AND "launchDate" IS NULL;

-- HeyGen Video Translation — Precision/Speed modes launched 2025-11-17
-- Source: https://docs.heygen.com/changelog/new-mode-in-video-translation-api
UPDATE "AvatarPricingSnapshot"
SET "launchDate" = '2025-11-17'
WHERE "modelId" IN (
  'heygen-translate-precision',
  'heygen-translate-speed',
  'heygen-translation-precision',
  'heygen-translation-speed'
) AND "launchDate" IS NULL;

-- HeyGen Video Translation — Proofread launched 2024-08-01
-- Source: https://www.heygen.com/news/free-avatar-proofread-updates-new-dashboard-august-2024
UPDATE "AvatarPricingSnapshot"
SET "launchDate" = '2024-08-01'
WHERE "modelId" IN (
  'heygen-translate-proofread',
  'heygen-translation-proofread'
) AND "launchDate" IS NULL;

-- ============================================================
-- TTS (24 models)
-- ============================================================

-- Amazon Polly Generative — GA May 2024
-- Source: https://aws.amazon.com/blogs/aws/a-new-generative-engine-and-three-voices-are-now-generally-available-on-amazon-polly/
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2024-05-01'
WHERE "modelId" = 'amazon-polly-generative' AND "launchDate" IS NULL;

-- Amazon Polly Neural (GovCloud) — same engine as Neural, launched 2019-07-30
-- Source: https://aws.amazon.com/about-aws/whats-new/2019/07/amazon-polly-neural-tts/
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2019-07-30'
WHERE "modelId" = 'amazon-polly-govcloud-neural' AND "launchDate" IS NULL;

-- Amazon Polly Standard (GovCloud) — same engine as Standard, launched 2016-11-30
-- Source: https://aws.amazon.com/about-aws/whats-new/2016/11/introducing-amazon-polly/
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2016-11-30'
WHERE "modelId" = 'amazon-polly-govcloud-standard' AND "launchDate" IS NULL;

-- Amazon Polly Long-Form — launched 2023-01-01 (approximate)
-- Source: https://docs.aws.amazon.com/polly/latest/dg/long-form-voices.html
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2023-01-01'
WHERE "modelId" = 'amazon-polly-long-form' AND "launchDate" IS NULL;

-- Azure TTS Custom (Deprecated) — Azure Speech GA 2018-11-01
-- Source: https://azure.microsoft.com/en-us/updates/azure-cognitive-services-speech-service-is-now-generally-available/
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2018-11-01'
WHERE "modelId" = 'azure-custom-deprecated' AND "launchDate" IS NULL;

-- Azure Custom Neural Voice Professional — GA 2021-10-01
-- Source: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-neural-voice
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2021-10-01'
WHERE "modelId" = 'azure-custom-neural-professional' AND "launchDate" IS NULL;

-- Azure Custom Neural Voice Professional HD — announced Feb/Mar 2025
-- Source: https://techcommunity.microsoft.com/blog/azure-ai-foundry-blog/azure-ai-speech-text-to-speech-feb-2025-updates-new-hd-voices-and-more/4387263
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2025-02-01'
WHERE "modelId" = 'azure-custom-neural-professional-hd' AND "launchDate" IS NULL;

-- Azure Neural TTS (Standard tier) — 2019-09-01
-- Source: same as azure-tts-neural in static data
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2019-09-01'
WHERE "modelId" = 'azure-neural-standard' AND "launchDate" IS NULL;

-- Azure TTS Standard (Deprecated) — 2018-11-01
-- Source: Azure Speech Service GA
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2018-11-01'
WHERE "modelId" = 'azure-standard-deprecated' AND "launchDate" IS NULL;

-- Cartesia Sonic-Turbo — launched with Sonic 2/3 family, ~2024-06-01
-- Source: https://cartesia.ai/sonic
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2024-06-01'
WHERE "modelId" = 'cartesia-sonic-turbo' AND "launchDate" IS NULL;

-- Deepgram Aura-1 (Growth/PAYG) — launched 2024-03-12
-- Source: https://deepgram.com/learn/aura-text-to-speech-tts-api-voice-ai-agents-launch
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2024-03-12'
WHERE "modelId" IN ('deepgram-aura-1-growth', 'deepgram-aura-1-payg') AND "launchDate" IS NULL;

-- Deepgram Aura-2 (Growth/PAYG) — launched 2025-04-15
-- Source: https://deepgram.com/learn/introducing-aura-2-enterprise-text-to-speech
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2025-04-15'
WHERE "modelId" IN ('deepgram-aura-2-growth', 'deepgram-aura-2-payg') AND "launchDate" IS NULL;

-- Google Cloud Chirp 3 HD — launched 2025-03-17
-- Source: https://techcrunch.com/2025/03/17/google-adds-its-hd-voice-model-chirp-3-to-its-vertex-ai-platform/
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2025-03-17'
WHERE "modelId" = 'google-cloud-chirp3-hd' AND "launchDate" IS NULL;

-- Google Cloud Instant Custom Voice — launched with Chirp 3, 2025-03-17
-- Source: https://docs.cloud.google.com/text-to-speech/docs/chirp3-instant-custom-voice
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2025-03-17'
WHERE "modelId" = 'google-cloud-instant-custom-voice' AND "launchDate" IS NULL;

-- Google Cloud Neural2 — launched 2022-06-01
-- Source: same as google-cloud-tts-neural2 in static data
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2022-06-01'
WHERE "modelId" = 'google-cloud-neural2' AND "launchDate" IS NULL;

-- Google Cloud Polyglot Voices — launched ~2023-06-01
-- Source: https://docs.cloud.google.com/text-to-speech/docs/polyglot
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2023-06-01'
WHERE "modelId" IN ('google-cloud-polyglot', 'google-cloud-polyglot-preview') AND "launchDate" IS NULL;

-- Google Cloud Standard — launched 2018-03-27
-- Source: same as google-cloud-tts-standard in static data
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2018-03-27'
WHERE "modelId" = 'google-cloud-standard' AND "launchDate" IS NULL;

-- Google Cloud Studio — launched ~2023-06-01
-- Source: https://docs.cloud.google.com/text-to-speech/docs/release-notes
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2023-06-01'
WHERE "modelId" = 'google-cloud-studio' AND "launchDate" IS NULL;

-- Google Cloud WaveNet — launched 2018-03-27
-- Source: same as google-cloud-tts-wavenet in static data
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2018-03-27'
WHERE "modelId" = 'google-cloud-wavenet' AND "launchDate" IS NULL;

-- OpenAI TTS HD — launched 2023-11-06
-- Source: https://openai.com/index/new-models-and-developer-products-announced-at-devday/
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2023-11-06'
WHERE "modelId" = 'openai-tts-hd' AND "launchDate" IS NULL;

-- OpenAI TTS Standard — launched 2023-11-06
-- Source: same as above
UPDATE "TtsPricingSnapshot"
SET "launchDate" = '2023-11-06'
WHERE "modelId" = 'openai-tts-standard' AND "launchDate" IS NULL;

-- ============================================================
-- STT (44 models)
-- ============================================================

-- AssemblyAI Universal-2 (Pre-recorded) — launched 2024-10-31
-- Source: https://www.assemblyai.com/universal-2
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2024-10-31'
WHERE "modelId" = 'assemblyai-universal-2-batch' AND "launchDate" IS NULL;

-- AssemblyAI Universal-3 Pro (Pre-recorded) — launched 2026-02-03
-- Source: https://www.assemblyai.com/blog/introducing-universal-3-pro
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2026-02-03'
WHERE "modelId" = 'assemblyai-universal-3-pro-batch' AND "launchDate" IS NULL;

-- AssemblyAI Universal-3 Pro Streaming — launched 2026-03-03
-- Source: https://www.assemblyai.com/changelog
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2026-03-03'
WHERE "modelId" = 'assemblyai-universal-3-pro-streaming' AND "launchDate" IS NULL;

-- AssemblyAI Universal-Streaming (English) — launched 2025-06-02
-- Source: https://www.assemblyai.com/blog/introducing-universal-streaming
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-06-02'
WHERE "modelId" = 'assemblyai-universal-streaming-en' AND "launchDate" IS NULL;

-- AssemblyAI Universal-Streaming Multilingual — launched 2025-11-12
-- Source: https://www.assemblyai.com/blog/introducing-multilingual-universal-streaming
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-11-12'
WHERE "modelId" = 'assemblyai-universal-streaming-multilingual' AND "launchDate" IS NULL;

-- AssemblyAI Whisper Streaming — launched ~2025-11-01 (month estimate)
-- Source: https://www.assemblyai.com/products/streaming-speech-to-text
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-11-01'
WHERE "modelId" = 'assemblyai-whisper-streaming' AND "launchDate" IS NULL;

-- Azure Speech (all 4 tiers) — GA 2018-09-24
-- Source: https://azure.microsoft.com/en-us/updates/azure-cognitive-services-speech-service-is-now-generally-available/
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2018-09-24'
WHERE "modelId" IN (
  'azure-speech-custom-batch',
  'azure-speech-custom-realtime',
  'azure-speech-standard-batch',
  'azure-speech-standard-realtime'
) AND "launchDate" IS NULL;

-- Cartesia Ink-Whisper — launched 2025-06-10
-- Source: https://cartesia.ai/blog/introducing-ink-speech-to-text
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-06-10'
WHERE "modelId" IN ('cartesia-ink-whisper', 'cartesia-ink-whisper-standard') AND "launchDate" IS NULL;

-- Deepgram Base (all tiers) — launched 2022-07-07
-- Source: https://deepgram.com/changelog/announcing-new-tier-parameter
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2022-07-07'
WHERE "modelId" IN (
  'deepgram-base-batch',
  'deepgram-base-prerecorded',
  'deepgram-base-streaming'
) AND "launchDate" IS NULL;

-- Deepgram Enhanced (all tiers) — launched 2022-05-26
-- Source: https://deepgram.com/changelog/introducing-new-enhanced-model
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2022-05-26'
WHERE "modelId" IN (
  'deepgram-enhanced-batch',
  'deepgram-enhanced-prerecorded',
  'deepgram-enhanced-streaming'
) AND "launchDate" IS NULL;

-- Deepgram Flux (all tiers) — launched 2025-10-02
-- Source: https://www.businesswire.com/news/home/20251002758871/en/
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-10-02'
WHERE "modelId" IN (
  'deepgram-flux-batch',
  'deepgram-flux-prerecorded',
  'deepgram-flux-streaming'
) AND "launchDate" IS NULL;

-- Deepgram Nova-2 (all tiers) — GA 2023-11-14
-- Source: https://deepgram.com/changelog/announcing-nova-2-ga-additional-language-support
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2023-11-14'
WHERE "modelId" IN (
  'deepgram-nova-2-batch',
  'deepgram-nova-2-prerecorded',
  'deepgram-nova-2-streaming'
) AND "launchDate" IS NULL;

-- Deepgram Nova-3 Monolingual (all tiers) — launched 2025-02-12
-- Source: https://deepgram.com/learn/introducing-nova-3-speech-to-text-api
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-02-12'
WHERE "modelId" IN (
  'deepgram-nova-3-monolingual-batch',
  'deepgram-nova-3-monolingual-prerecorded',
  'deepgram-nova-3-monolingual-streaming'
) AND "launchDate" IS NULL;

-- Deepgram Nova-3 Multilingual (all tiers) — launched 2025-02-12
-- Source: same announcement as Nova-3 monolingual
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-02-12'
WHERE "modelId" IN (
  'deepgram-nova-3-multilingual-batch',
  'deepgram-nova-3-multilingual-prerecorded',
  'deepgram-nova-3-multilingual-streaming'
) AND "launchDate" IS NULL;

-- Google Cloud STT V1 Medical — launched 2021-11-08
-- Source: https://docs.cloud.google.com/speech-to-text/docs/release-notes
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2021-11-08'
WHERE "modelId" IN (
  'google-cloud-stt-v1-medical-conversation',
  'google-cloud-stt-v1-medical-dictation'
) AND "launchDate" IS NULL;

-- Google Cloud STT V1 Standard (all logging variants) — GA 2017-04-18
-- Source: https://cloud.google.com/blog/products/gcp/cloud-speech-api-is-now-generally-available/
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2017-04-18'
WHERE "modelId" IN (
  'google-cloud-stt-v1-standard-logged',
  'google-cloud-stt-v1-standard-unlogged',
  'google-cloud-stt-v1-standard-with-logging',
  'google-cloud-stt-v1-standard-without-logging'
) AND "launchDate" IS NULL;

-- Google Cloud STT V2 (all tiers) — GA 2023-08-09
-- Source: https://cloud.google.com/blog/products/ai-machine-learning/google-cloud-speech-to-text-v2-api/
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2023-08-09'
WHERE "modelId" IN (
  'google-cloud-stt-v2-dynamic-batch',
  'google-cloud-stt-v2-standard',
  'google-cloud-stt-v2-standard-tier2',
  'google-cloud-stt-v2-standard-tier3',
  'google-cloud-stt-v2-standard-tier4'
) AND "launchDate" IS NULL;

-- OpenAI GPT-4o Transcribe / Mini Transcribe — launched 2025-03-20
-- Source: https://openai.com/index/introducing-our-next-generation-audio-models/
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-03-20'
WHERE "modelId" IN (
  'openai-gpt-4o-mini-transcribe',
  'openai-gpt-4o-transcribe'
) AND "launchDate" IS NULL;

-- OpenAI GPT-4o Transcribe Diarize — launched 2025-10-18
-- Source: https://community.openai.com/t/introducing-gpt-4o-transcribe-diarize-now-available-in-the-audio-api/1362933
UPDATE "SttPricingSnapshot"
SET "launchDate" = '2025-10-18'
WHERE "modelId" = 'openai-gpt-4o-transcribe-diarize' AND "launchDate" IS NULL;

-- ============================================================
-- VERIFICATION: Count remaining nulls
-- ============================================================

SELECT 'Video' as category, COUNT(*) FILTER (WHERE "launchDate" IS NULL) as remaining_nulls
FROM (SELECT DISTINCT ON ("modelId") * FROM "VideoPricingSnapshot" ORDER BY "modelId", "createdAt" DESC) t
UNION ALL
SELECT 'Avatar', COUNT(*) FILTER (WHERE "launchDate" IS NULL)
FROM (SELECT DISTINCT ON ("modelId") * FROM "AvatarPricingSnapshot" ORDER BY "modelId", "createdAt" DESC) t
UNION ALL
SELECT 'TTS', COUNT(*) FILTER (WHERE "launchDate" IS NULL)
FROM (SELECT DISTINCT ON ("modelId") * FROM "TtsPricingSnapshot" ORDER BY "modelId", "createdAt" DESC) t
UNION ALL
SELECT 'STT', COUNT(*) FILTER (WHERE "launchDate" IS NULL)
FROM (SELECT DISTINCT ON ("modelId") * FROM "SttPricingSnapshot" ORDER BY "modelId", "createdAt" DESC) t;

COMMIT;
