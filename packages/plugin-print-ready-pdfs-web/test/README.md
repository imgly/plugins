# PDF/X Test Suite - Node.js

Comprehensive test suite for validating PDF/X-3 conversion quality and compliance. **Tests run in pure Node.js using Jest** - no browser or Playwright required.

## Quick Start

### 1. Install External Tools

```bash
cd test
chmod +x setup.sh
./setup.sh
```

This installs PDF validation tools:
- **Poppler** (`pdffonts`, `pdfimages`, `pdfinfo`, `pdftotext`)
- **QPDF** (PDF structure validation)
- **Ghostscript** (PDF/X validation)

### 2. Run Tests

Test PDFs are included in the repository - no additional setup needed.

```bash
# Quick smoke test
pnpm test:node

# Full integration suite (18 tests)
pnpm test:integration

# Specific test suites
pnpm test:profiles       # ICC profile tests
pnpm test:metadata       # Metadata validation
pnpm test:content        # Content preservation
```

## Test Architecture

**Runtime:** Pure Node.js (no browser required)
**Framework:** Jest with ES modules
**External Tools:** Poppler, QPDF, Ghostscript (spawned as child processes)

```
test/
├── integration/                      # Jest integration tests
│   ├── profile-conversion.test.ts   # ICC profile conversion
│   ├── metadata-validation.test.ts  # PDF/X metadata checks
│   └── content-preservation.test.ts # Content integrity tests
├── utils/                            # Test utilities
│   └── external-validators.ts       # PDF tool wrappers
├── fixtures/
│   ├── archives/                    # CE.SDK archives (.zip)
│   └── pdfs/                        # Exported test PDFs
├── node-test.mjs                    # Quick smoke test
└── setup.sh                         # Install external tools
```

### Node.js Compatibility

The plugin and test suite work in both **browser** and **Node.js** environments:

- **Browser**: Uses `navigator`, `fetch`, browser Blob API
- **Node.js**: Uses `process`, `fs`, native Blob (Node 18+)

Runtime detection is automatic - no configuration needed.

## Test Coverage

### A. ICC Profile Tests (`profile-conversion.spec.ts`)
- ✅ Preset profiles (GRACoL, FOGRA39, sRGB)
- ✅ Custom ICC profiles
- ✅ Profile validation
- ✅ OutputIntent metadata

### B. Metadata Validation (`metadata-validation.spec.ts`)
- ✅ PDF/X version (PDF/X-3:2003)
- ✅ Trapped field (`/False`)
- ✅ Custom title preservation
- ✅ OutputIntent structure
- ✅ OutputConditionIdentifier
- ✅ Custom metadata overrides

### C. Content Preservation (`content-preservation.spec.ts`)
- ✅ Vector graphics (not rasterized)
- ✅ Text searchability
- ✅ Font embedding
- ✅ Object count (detect flattening)
- ✅ Image preservation
- ✅ Mixed content

## Test Utilities

### ExternalValidators

Wraps external PDF tools:

```typescript
// Font validation
const fonts = await ExternalValidators.validateFonts(pdfBlob);
const allEmbedded = fonts.every(f => f.embedded);

// Image extraction
const images = await ExternalValidators.listImages(pdfBlob);

// Text extraction
const text = await ExternalValidators.extractText(pdfBlob);

// Structure validation
const result = await ExternalValidators.validateStructure(pdfBlob);

// PDF/X validation
const pdfxValid = await ExternalValidators.validatePDFX(pdfBlob);

// Check tool availability
const tools = await ExternalValidators.checkToolsAvailable();
```

## Development Workflow

### Standard Node.js Testing

```bash
# 1. Make changes to src/
# 2. Run tests
pnpm test:integration

# 3. Debug with Node.js tools
node --inspect-brk test/node-test.mjs
```

### Watch Mode

```bash
# Run tests in watch mode (auto-rerun on changes)
pnpm test:integration -- --watch
```

### Debugging

Use standard Node.js debugging:

```bash
# Node.js inspector
node --inspect-brk node_modules/.bin/jest

# VS Code debugger
# Add breakpoints in test files, press F5

# Console logging
console.log('Debug output here')
```

### Benefits Over Browser Testing

- ✅ **Faster** - No browser startup (2-3s saved per run)
- ✅ **Simpler** - Standard Node.js debugging tools
- ✅ **Parallel** - Jest runs tests concurrently
- ✅ **CI-friendly** - No browser binaries required

## Troubleshooting

### Tools Not Found

```bash
# Check which tools are available
pdffonts -v
qpdf --version
gs --version

# Reinstall if needed
./test/setup.sh
```

### Tests Failing

1. Check CE.SDK license key in `.env.local`
2. Verify test archives exist in `fixtures/archives/`
3. Check console output for specific errors
4. Run single test for detailed output:

```bash
pnpm test:integration -- --grep "should not rasterize"
```

### Archive Loading Issues

Ensure archives are valid CE.SDK ZIP format:
```bash
# List archive contents
unzip -l fixtures/archives/test-minimal.zip
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test PDF/X Plugin

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install PDF tools
        run: |
          sudo apt-get update
          sudo apt-get install -y poppler-utils qpdf ghostscript

      - name: Install dependencies
        run: pnpm install

      - name: Run tests
        run: pnpm test:integration
        env:
          VITE_CESDK_LICENSE_KEY: ${{ secrets.CESDK_LICENSE_KEY }}
```

### Docker Testing

```dockerfile
FROM node:18-alpine

RUN apk add --no-cache \
    poppler-utils \
    qpdf \
    ghostscript

WORKDIR /app
COPY . .
RUN pnpm install
RUN pnpm test:integration
```

## External Tools Reference

| Tool | Command | Purpose |
|------|---------|---------|
| `pdffonts` | `pdffonts file.pdf` | List fonts, check embedding |
| `pdfimages` | `pdfimages -list file.pdf` | List images |
| `pdfinfo` | `pdfinfo file.pdf` | Show metadata |
| `pdftotext` | `pdftotext file.pdf -` | Extract text |
| `qpdf` | `qpdf --check file.pdf` | Validate structure |
| `gs` | `gs -dPDFX -dNODISPLAY file.pdf` | PDF/X validation |

## Troubleshooting

### Node.js Version

Requires Node.js 18+ for native `fetch` and `Blob` support:

```bash
node --version  # Should be >= 18.0.0
```

### Jest ESM Issues

If you see "Cannot use 'import.meta' outside a module":

```bash
# Use experimental VM modules flag
NODE_OPTIONS='--experimental-vm-modules' jest
```

This is already configured in package.json scripts.

### External Tools Not Found

```bash
# Verify tools are installed
pdffonts -v
qpdf --version
gs --version

# Reinstall if needed
cd test && ./setup.sh
```

## Further Reading

- [Node.js Testing Guide](./NODE_TESTING.md) - Complete Node.js test documentation
- [PDF/X-3 Specification](https://www.iso.org/standard/39940.html)
- [Ghostscript PDF/X Documentation](https://www.ghostscript.com/doc/current/VectorDevices.htm#PDFX)
- [Jest Documentation](https://jestjs.io/docs/getting-started)