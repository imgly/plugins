# Node.js Testing Guide

The plugin is now fully compatible with Node.js! This means you can run all tests in a pure Node.js environment without requiring a browser or Playwright.

## Benefits of Node.js Testing

✅ **Faster** - No browser startup overhead
✅ **Simpler** - No Playwright/browser dependencies
✅ **CI-Friendly** - Easier to run in CI/CD pipelines
✅ **Debuggable** - Standard Node.js debugging works

## Quick Start

### 1. Simple Node.js Test

Test the plugin in pure Node.js:

```bash
pnpm test:node
```

This runs `test/node-test.mjs` which:
- Loads the plugin in Node.js
- Converts a test PDF with GRACoL profile
- Validates the output
- Saves the result

**Note:** Requires test PDFs to be exported first (see below).

### 2. Full Integration Tests (Jest)

Run the complete test suite:

```bash
pnpm test:integration
```

This runs 18 tests across 3 suites:
- **Profile conversion** - Tests preset and custom ICC profiles
- **Metadata validation** - Validates PDF/X-3 compliance
- **Content preservation** - Ensures vectors, text, and images aren't rasterized

### 3. Run Specific Test Suites

```bash
pnpm test:profiles    # ICC profile tests only
pnpm test:metadata    # Metadata validation only
pnpm test:content     # Content preservation only
```

## Test Requirements

### Export Test PDFs

Tests require 5 test PDFs exported from CE.SDK archives:

1. **Start CE.SDK server:**
   ```bash
   pnpm test:cesdk
   ```

2. **Open export page:**
   ```
   http://localhost:3001/export-archives.html
   ```

3. **Export all 5 archives:**
   - Click "Export" for each archive
   - PDFs download to your Downloads folder

4. **Move PDFs to fixtures:**
   ```bash
   mv ~/Downloads/test-*.pdf test/fixtures/pdfs/
   ```

5. **Run tests:**
   ```bash
   pnpm test:integration
   ```

## How It Works

### Node.js Compatibility

The plugin detects the runtime environment and adapts:

```typescript
// In src/utils/browser-detection.ts
get isNode(): boolean {
  return typeof process !== 'undefined' &&
         process.versions?.node != null;
}
```

**Browser APIs** are safely guarded:
- `navigator` - Checked with `typeof navigator !== 'undefined'`
- `fetch` - Native support in Node.js 18+
- `WebAssembly` - Available in both environments
- `Blob` - Node.js has native Blob support

### Test Architecture

```
test/
├── node-test.mjs              # Simple Node.js smoke test
├── integration/               # Jest test suites (Node.js)
│   ├── profile-conversion.test.ts
│   ├── metadata-validation.test.ts
│   └── content-preservation.test.ts
├── utils/                     # Test utilities (Node.js)
│   ├── external-validators.ts # Wrappers for PDF tools
│   └── ...
└── fixtures/
    ├── archives/              # CE.SDK archives (.zip)
    └── pdfs/                  # Exported test PDFs
```

### External Validation Tools

Tests use standard PDF tools installed via `test/setup.sh`:

- **pdffonts** - Check font embedding
- **pdfimages** - Detect rasterization
- **pdfinfo** - Validate metadata
- **pdftotext** - Test text extraction
- **qpdf** - Validate PDF structure
- **ghostscript** - PDF/X compliance

These run as child processes from Node.js.

## CI/CD Integration

To enable in CI:

```yaml
# Install PDF tools
- name: Install PDF validation tools
  run: |
    sudo apt-get update
    sudo apt-get install -y poppler-utils qpdf ghostscript

# Export test PDFs (manual or automated)
- name: Setup test fixtures
  run: |
    # Option 1: Download pre-exported PDFs
    curl -o test/fixtures/pdfs/test-minimal.pdf https://...

    # Option 2: Generate via CE.SDK (requires license)
    # pnpm test:generate-pdfs

# Run tests
- name: Run integration tests
  run: pnpm test:integration
```

## Troubleshooting

### Tests Fail with "Test PDF not found"

Export PDFs from CE.SDK first:
```bash
pnpm test:cesdk
# Then visit http://localhost:3001/export-archives.html
```

### "External tool not found" errors

Install validation tools:
```bash
cd test && ./setup.sh
```

### Jest module errors

Make sure you're using Node.js 18+ with native ESM support:
```bash
node --version  # Should be 18.0.0 or higher
```

## Comparison: Browser vs Node.js

### Browser Tests (Playwright)
- ✅ Tests CE.SDK integration
- ✅ Tests in real browser environment
- ❌ Slower (browser startup)
- ❌ More complex setup
- ❌ Harder to debug

### Node.js Tests (Jest)
- ✅ Fast execution
- ✅ Simple setup
- ✅ Standard debugging
- ✅ CI-friendly
- ❌ Doesn't test browser integration

**Best Practice:** Use both!
- **Node.js tests** for plugin conversion logic
- **Browser tests** for CE.SDK integration

## Next Steps

1. Export test PDFs (one-time setup)
2. Run `pnpm test:node` to verify setup
3. Run `pnpm test:integration` for full suite
4. Add to CI/CD pipeline

For more details, see:
- `test/README.md` - Complete test documentation
- `test/EXPORT_PDFS.md` - PDF export instructions
- `jest.config.js` - Jest configuration