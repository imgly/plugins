# Provider Specifications

This folder contains the canonical specifications for implementing AI generation providers in this repository. It serves as the **single source of truth** for:

1. How providers are structured and implemented
2. Partner-specific model inventories and API patterns
3. Implementation patterns for different provider types

## Who Uses This

- **Skills and Agents**: Partner-specific skills and provider generator agents use these specs to implement new providers
- **Developers**: Reference for manual provider implementation
- **Code Review**: Validation that implementations follow repository patterns

## Folder Structure

```
specs/providers/
├── README.md              # This file
├── ARCHITECTURE.md        # How providers fit into the plugin system
│
├── schemas/               # Implementation patterns by provider type
│   ├── UI-GUIDELINES.md   # Parameter design & UI standards (START HERE)
│   ├── text-to-image.md   # T2I provider structure
│   ├── image-to-image.md  # I2I provider structure
│   ├── text-to-video.md   # T2V provider structure
│   ├── image-to-video.md  # I2V provider structure
│   └── quick-actions.md   # Quick action support patterns
│
└── {partner}/             # Partner-specific information
    ├── PROVIDERS.md       # Model inventory & implementation status
    ├── api-patterns.md    # Partner API conventions
    └── implementation-notes.md  # Partner-specific quirks
```

## Provider Types

| Type | Kind | Input | Output | Example Use Case |
|------|------|-------|--------|------------------|
| Text-to-Image (T2I) | `'image'` | prompt, dimensions | image URL | Generate image from text |
| Image-to-Image (I2I) | `'image'` | prompt, image_url, dimensions | image URL | Edit/remix existing image |
| Text-to-Video (T2V) | `'video'` | prompt, dimensions, duration | video URL | Generate video from text |
| Image-to-Video (I2V) | `'video'` | prompt, image_url, dimensions, duration | video URL | Animate image to video |

## Quick Start

1. **Implementing a new provider?**
   - Read `schemas/UI-GUIDELINES.md` for parameter design principles (START HERE)
   - Read `ARCHITECTURE.md` for system overview
   - Read the appropriate `schemas/{type}.md` for implementation pattern
   - Read `{partner}/api-patterns.md` for API specifics

2. **Adding a new model to existing partner?**
   - Check `{partner}/PROVIDERS.md` for model inventory
   - Follow existing provider of same type as template
   - Consult `schemas/UI-GUIDELINES.md` for parameter decisions

3. **Building automation (skill/agent)?**
   - Use `schemas/UI-GUIDELINES.md` for parameter standards
   - Use `schemas/` as source of truth for structure
   - Use `{partner}/PROVIDERS.md` for model discovery
   - Use `{partner}/api-patterns.md` for API mapping

## Current Partners

| Partner | Status | Location |
|---------|--------|----------|
| Runware | Active | `runware/` |

## Conventions

### Provider ID Format
```
{partner}/{vendor}/{model-name}

Examples:
- {partner}/google/imagen-4
- {partner}/openai/gpt-image-1
- {partner}/stability/sd-ultra
```

### File Naming
- Provider TypeScript: `{ModelName}.ts` (PascalCase)
- Provider Schema: `{ModelName}.json` (PascalCase)
- Partner folders: lowercase with hyphens

### Status Values in PROVIDERS.md
| Status | Meaning |
|--------|---------|
| `implemented` | Provider exists and works |
| `planned` | Will implement (prioritized) |
| `skipped` | Intentionally not implementing |
| `undecided` | Needs discussion |
