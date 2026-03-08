# Contributing to PriceToken

Adding a new AI model's pricing to PriceToken is as simple as editing a YAML file. No TypeScript or Python knowledge required.

## Quick Start

1. Fork the repo and clone it
2. Edit the appropriate `registry/*.yaml` file (see [YAML Reference](#yaml-reference) below)
3. Run the generator to update static files:
   ```bash
   npm install
   npm run generate-static
   ```
4. Verify everything works:
   ```bash
   npm run generate-static:check
   ```
5. Open a PR

## Via GitHub Issue

Don't want to write YAML? Just [open a New Model issue](../../issues/new?template=new-model.yml) and fill out the form. A maintainer will add it.

## YAML Reference

All models live in `registry/` with one file per modality:

| File | Modality |
|------|----------|
| `registry/text.yaml` | Text/LLM models |
| `registry/tts.yaml` | Text-to-Speech models |
| `registry/stt.yaml` | Speech-to-Text models |
| `registry/avatar.yaml` | Avatar video models |
| `registry/image.yaml` | Image generation models |
| `registry/video.yaml` | Video generation models |

### Text models

```yaml
models:
  - modelId: my-provider-model-v1      # required, lowercase kebab-case
    provider: my-provider               # required, lowercase
    displayName: My Provider Model v1   # required
    inputPerMTok: 3                     # required, USD per million input tokens
    outputPerMTok: 15                   # required, USD per million output tokens
    contextWindow: 128000               # optional, null if unknown
    maxOutputTokens: 8192              # optional, null if unknown
    status: active                      # optional: active (default), deprecated, preview
    launchDate: "2025-06-01"            # optional, quoted ISO date
    pricingUrl: https://example.com/pricing  # optional, for verification
```

### TTS models

```yaml
  - modelId: my-tts-model
    provider: my-provider
    displayName: My TTS Model
    costPerMChars: 15                   # USD per million characters
    voiceType: neural                   # optional: neural, standard, etc.
    maxCharacters: 5000                 # optional
    supportedLanguages: 30              # optional, number of languages
```

### STT models

```yaml
  - modelId: my-stt-model
    provider: my-provider
    displayName: My STT Model
    costPerMinute: 0.006                # USD per minute of audio
    sttType: streaming                  # optional: batch, streaming, realtime
    maxDuration: 240                    # optional, max minutes
    supportedLanguages: 50              # optional
```

### Avatar models

```yaml
  - modelId: my-avatar-model
    provider: my-provider
    displayName: My Avatar Model
    costPerMinute: 5                    # USD per minute of video
    avatarType: premium                 # optional
    resolution: 1080p                   # optional
    maxDuration: 60                     # optional, max minutes
    qualityMode: standard               # optional
    lipSync: true                       # optional, boolean or null
```

### Image models

```yaml
  - modelId: my-image-model
    provider: my-provider
    displayName: My Image Model
    pricePerImage: 0.04                 # required, USD per image
    pricePerMegapixel: null             # optional
    defaultResolution: 1024x1024        # required
    qualityTier: standard               # required: standard, hd, ultra
    maxResolution: 2048x2048            # optional
    supportedFormats:                    # optional
      - png
      - jpeg
```

### Video models

```yaml
  - modelId: my-video-model
    provider: my-provider
    displayName: My Video Model
    costPerMinute: 8                    # USD per minute of video
    inputType: text                     # optional: text, image, text,image, etc.
    resolution: 1080p                   # optional
    maxDuration: 10                     # optional, max seconds
    qualityMode: standard               # optional
```

### Shared optional fields (all modalities)

```yaml
    status: active                      # active (default), deprecated, preview
    launchDate: "2025-06-01"            # quoted ISO date string
    pricingUrl: https://...             # official pricing page (metadata only)
    fallbackUrls:                       # alternative pricing URLs (metadata only)
      - https://docs.example.com/pricing
```

`pricingUrl` and `fallbackUrls` are metadata for verification — they don't appear in the generated SDK files.

## Naming Conventions

Model IDs follow the pattern `{provider}-{model}-{variant}`:

- `openai-gpt-4o` — provider + model
- `openai-gpt-4o-mini` — provider + model + variant
- `anthropic-claude-opus-4-6` — full version in ID
- `fal-kling-o3-1080p` — platform + underlying model + resolution

## What Happens Next

1. A maintainer reviews your PR (or issue)
2. The CI validates your YAML and checks that generated files are in sync
3. After merge, the model appears on [pricetoken.ai](https://pricetoken.ai) and in the npm/PyPI SDKs on next release
