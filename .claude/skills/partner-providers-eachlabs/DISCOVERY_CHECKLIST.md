# Discovery Checklist

## Quick Discovery

Run the discovery script to get all available models:

```bash
node .claude/skills/partner-providers-eachlabs/discover-models.mjs
```

This outputs a minimal JSON array sorted by `output_type`:

```json
[
  { "slug": "flux-2-pro", "title": "Flux 2 Pro", "output_type": "image" },
  { "slug": "kling-v2-6-pro-text-to-video", "title": "Kling | v2.6 | Pro | Text to Video", "output_type": "video" }
]
```

## Workflow

1. **Run the script** to get current API models
2. **Read `specs/providers/eachlabs/providers.md`** to see what's tracked
3. **Compare** the lists to identify:
   - New models (in API but not in providers.md)
   - Removed models (in providers.md but not in API)
4. **Report findings** to user with recommendations
5. **Update providers.md** with new models after user approval

## Output Types

| output_type | Meaning |
|-------------|---------|
| `image` | Single image output |
| `array` | Multiple images (batch) |
| `video` | Video output |
| `audio` | Audio output |
| `text` | Text output |
| `object` | Structured data |
| `code` | Training/code output |

## Capability Detection

Determine capability from slug patterns:

| Pattern in slug | Capability |
|-----------------|------------|
| `text-to-video` | t2v |
| `image-to-video` | i2v |
| `text-to-image` | t2i |
| `-edit`, `-remix` | i2i |
| `reference-to-` | i2i or i2v |

## Notes

- No authentication required for the models API
- The script fetches up to 500 models
- Full model details (including `request_schema`) available via: `GET https://api.eachlabs.ai/v1/model?slug=<slug>`
