# CESDK Version Management

This document explains how @cesdk package versions are managed in this monorepo.

## Overview

This repository contains plugins for `@cesdk/cesdk-js` and `@cesdk/engine`. The version management system ensures:
- All examples and tests use the same CESDK version
- Plugins declare minimum compatible versions for end users
- No version conflicts during development

## Architecture

### 1. Plugin Packages (`packages/*`)
- Declare **minimum** CESDK versions in `peerDependencies` (e.g., `^1.37.0`)
- These versions tell users what CESDK versions the plugin supports
- When published, users see these minimum requirements

### 2. Example Projects (`examples/*`)
- Use specific CESDK versions for testing via `catalog:` references
- Test that plugins work correctly with a known CESDK version

### 3. Version Control System

We use **two mechanisms** to ensure version consistency:

#### Workspace Catalog (`pnpm-workspace.yaml`)
```yaml
catalog:
  '@cesdk/cesdk-js': '1.49.1'
  '@cesdk/engine': '1.49.1'
```
- Defines the test version for example projects
- Example projects reference this with `"catalog:"` in their package.json

#### pnpm Overrides (`package.json` root)
```json
"pnpm": {
  "overrides": {
    "@cesdk/cesdk-js": "1.49.1",
    "@cesdk/engine": "1.49.1"
  }
}
```
- Forces all packages in the monorepo to use these exact versions
- Prevents pnpm from installing multiple versions due to peer dependency ranges
- Ensures type consistency across the entire workspace

## Why Both Catalog and Overrides?

**The Problem:**
- Plugins declare `"@cesdk/cesdk-js": "^1.37.0"` in peerDependencies
- pnpm auto-installs peer dependencies (unlike npm)
- `^1.37.0` allows version 1.58.0, so pnpm might install it
- This creates version conflicts and TypeScript errors

**The Solution:**
- **Catalog**: Provides versions for example projects
- **Overrides**: Forces the entire monorepo to use the catalog version
- Together, they ensure single version resolution

## How to Update CESDK Versions

### Automated Method (Recommended)

Use the pnpm task in one of two ways:

#### Interactive Mode
```bash
pnpm cesdk:version
```
- Shows the current CESDK version
- Prompts for a new version
- Asks for confirmation before updating

#### Direct Mode
```bash
pnpm cesdk:version 1.50.0
```
- Immediately updates to the specified version

The script updates both the catalog and overrides automatically.

Note: You can also run the script directly with `./scripts/change-examples-cesdk-version.sh`

### Manual Method

1. Update the catalog in `pnpm-workspace.yaml`:
```yaml
catalog:
  '@cesdk/cesdk-js': 'NEW_VERSION'
  '@cesdk/engine': 'NEW_VERSION'
```

2. Update the overrides in root `package.json`:
```json
"pnpm": {
  "overrides": {
    "@cesdk/cesdk-js": "NEW_VERSION",
    "@cesdk/engine": "NEW_VERSION"
  }
}
```

3. Run `pnpm install` to update the lockfile

4. Run `pnpm check:types` to verify everything compiles

## Testing Different CESDK Versions

To test plugins with a different CESDK version:
1. Run `pnpm cesdk:version NEW_VERSION` (or use interactive mode with just `pnpm cesdk:version`)
2. Run `pnpm install`
3. Run `pnpm check:types` to verify compatibility
4. Run your tests

## Important Notes

- **Don't update plugin peerDependencies** unless changing minimum requirements
- **Always update both** catalog and overrides together
- The overrides ensure version consistency but don't affect published packages
- When plugins are published, only their peerDependencies matter to end users

## Troubleshooting

### "Multiple versions of @cesdk found"
- Ensure both catalog and overrides have the same version
- Run `rm -rf node_modules pnpm-lock.yaml && pnpm install`

### "Type errors after updating versions"
- The new CESDK version might have breaking changes
- Check CESDK changelog and update plugin code if needed

### "Script permission denied"
- Run `chmod +x scripts/change-examples-cesdk-version.sh`