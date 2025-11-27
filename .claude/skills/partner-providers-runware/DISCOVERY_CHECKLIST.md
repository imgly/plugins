# Discovery Checklist

Step-by-step process for discovering new Runware models.

## Prerequisites

- [ ] Read `specs/providers/runware/providers.md` to understand current state

## Discovery Steps

### 1. Gather Current State

```
Read: specs/providers/runware/providers.md
Extract:
- List of all tracked models with their AIR identifiers
- Current status of each model
- Provider documentation URLs from the table
```

### 2. Fetch Provider Documentation

For each provider in the documentation links table:

```
WebFetch each URL, extracting:
- Model names and versions
- AIR identifiers (format: provider:model@version)
- Capabilities (text-to-image, image-to-video, etc.)
- Release dates if available
- Any deprecation notices
```

Provider documentation URLs are at: https://runware.ai/docs/en/providers/{provider}.md

### 3. Compare Against Tracked Models

For each discovered model:

- [ ] Check if AIR exists in providers.md
- [ ] If exists, check if capabilities match
- [ ] If new, categorize as "new model"
- [ ] If changed, categorize as "updated model"

### 4. Analyze and Recommend

For new models, recommend status based on:

| Condition | Recommendation |
|-----------|----------------|
| Latest version of a model family | `planned` |
| Older version, newer exists | `skipped` |
| Unique capabilities | `planned` |
| Niche/specialized use case | `undecided` |

### 5. Report to User

Format findings using the template in SKILL.md:

1. New models table with recommendations
2. Updated models table with changes
3. Summary statistics
4. Ask which to implement

## Notes

- Always check release dates to understand model freshness
- Look for deprecation notices in docs
- Note any breaking API changes between versions
- Consider capability overlap when recommending skip vs implement
