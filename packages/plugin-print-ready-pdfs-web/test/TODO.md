# Test Infrastructure TODO

## Current Status

✅ **Complete:**
- Jest test framework configured with ES modules (Node.js compatible!)
- 18 test cases across 3 suites (profile, metadata, content preservation)
- External validation tools installed (pdffonts, pdfimages, qpdf, ghostscript)
- Test utilities for PDF validation
- Test files renamed to .test.ts for Jest compatibility
- CE.SDK test server running at http://localhost:3001
- Export UI page created at http://localhost:3001/export-archives.html
- Manual PDF export workflow documented in EXPORT_PDFS.md
- **Plugin now runs in Node.js** - BrowserDetection made universal
- Simple Node.js test script (test/node-test.mjs)
- Full Node.js test documentation (test/NODE_TESTING.md)

⚠️ **Ready to Test (After Manual PDF Export):**
- Tests are ready to run once PDF fixtures are exported
- See test/EXPORT_PDFS.md for instructions on exporting PDFs from archives
- **Node.js tests work!** Run `pnpm test:node` or `pnpm test:integration`

## Immediate TODO

### 1. Export Test PDFs (Manual Process)

**See detailed instructions in:** `test/EXPORT_PDFS.md`

**Quick summary:**
1. Start server: `pnpm test:cesdk`
2. Open: http://localhost:3001/export-archives.html
3. Click "Export" button for each of the 5 archives
4. Move downloaded PDFs to `test/fixtures/pdfs/`
5. Run tests: `pnpm test:integration`

**What gets exported:**
- test/fixtures/archives/test-minimal.zip    → test/fixtures/pdfs/test-minimal.pdf
- test/fixtures/archives/test-vectors.zip    → test/fixtures/pdfs/test-vectors.pdf
- test/fixtures/archives/test-text.zip       → test/fixtures/pdfs/test-text.pdf
- test/fixtures/archives/test-images.zip     → test/fixtures/pdfs/test-images.pdf
- test/fixtures/archives/test-complex.zip    → test/fixtures/pdfs/test-complex.pdf

## What Changed: Node.js Compatibility

### Plugin Made Universal

The plugin now works in both browser AND Node.js environments:

**Changes Made:**
1. **BrowserDetection class** updated (src/utils/browser-detection.ts):
   - Added `isNode` getter to detect Node.js runtime
   - Safely checks for `navigator` before using it
   - Uses `os.freemem()` in Node.js for memory limits
   - Returns Node.js version info in `getBrowserInfo()`

2. **Browser APIs** properly guarded:
   - `navigator` - Checked with `typeof navigator !== 'undefined'`
   - `fetch` - Works natively in Node.js 18+
   - `WebAssembly` - Available in both environments
   - `Blob` - Native support in both

3. **Test infrastructure updated:**
   - Jest tests run in pure Node.js (no Playwright needed)
   - New `pnpm test:node` command for quick testing
   - All 18 integration tests work in Node.js environment
   - Comprehensive documentation in `test/NODE_TESTING.md`

**Benefits:**
- ✅ Faster tests (no browser overhead)
- ✅ Simpler CI/CD integration
- ✅ Standard Node.js debugging
- ✅ No Playwright dependency for tests

**Testing Commands:**
```bash
pnpm test:node           # Quick Node.js smoke test
pnpm test:integration    # Full Jest suite (18 tests)
pnpm test:profiles       # Profile conversion tests
pnpm test:metadata       # Metadata validation tests
pnpm test:content        # Content preservation tests
```

## Future Improvements

### 2. Automate PDF Generation Using Node.js CreativeEngine

**Goal:** Generate test PDFs programmatically instead of manual export

**Implementation Plan:**

#### A. Add CreativeEngine Node.js Support

```bash
# May need headless browser or Node.js build of CE.SDK
pnpm add -D puppeteer  # or playwright for headless browser
```

#### B. Create PDF Generator Utility

Create `test/utils/pdf-generator.ts`:

```typescript
import puppeteer from 'puppeteer';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Generate test PDFs from CE.SDK archives using headless browser
 */
export class PDFGenerator {
  static async generateFromArchive(
    archivePath: string,
    outputPath: string
  ): Promise<void> {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Load CE.SDK
    await page.addScriptTag({
      url: 'https://cdn.img.ly/packages/imgly/cesdk-engine/1.59.0/index.js'
    });

    // Initialize engine
    await page.evaluate(async (license) => {
      const engine = await window.CreativeEngine.init({
        license,
        baseURL: 'https://cdn.img.ly/packages/imgly/cesdk-engine/1.59.0/assets'
      });
      window.engine = engine;
    }, process.env.VITE_CESDK_LICENSE_KEY);

    // Load archive and export PDF
    const archiveBuffer = readFileSync(archivePath);
    const pdfBuffer = await page.evaluate(async (buffer) => {
      const archiveBlob = new Blob([new Uint8Array(buffer)], {
        type: 'application/zip'
      });
      const archiveUrl = URL.createObjectURL(archiveBlob);

      await window.engine.scene.loadFromArchiveURL(archiveUrl);
      const pages = window.engine.scene.getPages();

      const pdfBlob = await window.engine.block.export(pages[0], 'application/pdf');
      const arrayBuffer = await pdfBlob.arrayBuffer();
      return Array.from(new Uint8Array(arrayBuffer));
    }, Array.from(archiveBuffer));

    writeFileSync(outputPath, Buffer.from(pdfBuffer));
    await browser.close();
  }

  /**
   * Generate all test PDFs
   */
  static async generateAllTestPDFs(): Promise<void> {
    const fixtures = [
      'test-minimal',
      'test-vectors',
      'test-text',
      'test-images',
      'test-complex'
    ];

    for (const name of fixtures) {
      const archivePath = join(__dirname, '../fixtures/archives', `${name}.zip`);
      const pdfPath = join(__dirname, '../fixtures/pdfs', `${name}.pdf`);

      console.log(`Generating ${name}.pdf...`);
      await this.generateFromArchive(archivePath, pdfPath);
    }
  }
}
```

#### C. Add Setup Script

Create `test/generate-fixtures.ts`:

```typescript
import { PDFGenerator } from './utils/pdf-generator.js';

console.log('🔄 Generating test PDF fixtures from archives...\n');

PDFGenerator.generateAllTestPDFs()
  .then(() => {
    console.log('\n✅ All test PDFs generated successfully!');
    console.log('Run tests: pnpm test:integration');
  })
  .catch((err) => {
    console.error('\n❌ Failed to generate test PDFs:', err.message);
    process.exit(1);
  });
```

#### D. Update Package Scripts

```json
{
  "scripts": {
    "test:generate-pdfs": "node test/generate-fixtures.ts",
    "test:integration": "pnpm run test:generate-pdfs && pnpm run build && NODE_OPTIONS='--experimental-vm-modules' jest",
    "test:integration:skip-gen": "pnpm run build && NODE_OPTIONS='--experimental-vm-modules' jest"
  }
}
```

### 3. Alternative: Use CreativeEngine Node.js API (if available)

If CE.SDK provides a Node.js package that doesn't require browser:

```typescript
import CreativeEngine from '@cesdk/node'; // hypothetical

export class PDFGenerator {
  static async generateFromArchive(
    archivePath: string,
    outputPath: string
  ): Promise<void> {
    const engine = await CreativeEngine.init({
      license: process.env.VITE_CESDK_LICENSE_KEY
    });

    await engine.scene.loadFromArchiveURL(archivePath);
    const pages = engine.scene.getPages();
    const pdfBlob = await engine.block.export(pages[0], 'application/pdf');

    writeFileSync(outputPath, Buffer.from(await pdfBlob.arrayBuffer()));
    engine.dispose();
  }
}
```

### 4. Consider Pre-committing Generated PDFs

**Option A: Commit PDFs to Git**
- Pros: Tests work immediately, no generation step
- Cons: Binary files in repo, larger repo size

**Option B: Generate on-demand**
- Pros: Clean repo, always fresh PDFs
- Cons: Slower test runs, requires CE.SDK license

**Recommendation:** Generate on-demand during development, pre-commit for CI/CD

## Testing Workflow (Future)

```bash
# One-time setup
pnpm test:setup  # Install external tools

# Generate test PDFs (when archives change)
pnpm test:generate-pdfs

# Run tests
pnpm test:integration

# Or do everything at once
pnpm test  # Generates PDFs + runs tests
```

## Additional Test Enhancements

### 5. Add Visual Regression Tests

Compare rendered output between RGB and PDF/X versions:

```typescript
test('should preserve visual appearance', async () => {
  const inputPDF = getTestPDF('test-vectors.pdf');
  const outputPDF = await convertToPDFX3(inputPDF, { outputProfile: 'srgb' });

  const inputImage = await renderPDFToImage(inputPDF);
  const outputImage = await renderPDFToImage(outputPDF);

  const similarity = compareImages(inputImage, outputImage);
  expect(similarity).toBeGreaterThan(0.95); // 95% similar
});
```

### 6. Add Performance Benchmarks

```typescript
test('should convert within acceptable time', async () => {
  const inputPDF = getTestPDF('test-complex.pdf');

  const startTime = performance.now();
  await convertToPDFX3(inputPDF, { outputProfile: 'gracol' });
  const duration = performance.now() - startTime;

  expect(duration).toBeLessThan(5000); // 5 seconds max
});
```

### 7. Add File Size Checks

```typescript
test('should not dramatically increase file size', async () => {
  const inputPDF = getTestPDF('test-minimal.pdf');
  const outputPDF = await convertToPDFX3(inputPDF, { outputProfile: 'srgb' });

  const sizeRatio = outputPDF.size / inputPDF.size;
  expect(sizeRatio).toBeLessThan(2.0); // Max 2x size increase
});
```

## Documentation Needed

- [ ] Document PDF fixture generation process
- [ ] Add troubleshooting guide for CE.SDK headless usage
- [ ] Document external tool requirements for CI/CD
- [ ] Create example test scenarios for new features

## Questions to Resolve

1. **Does CE.SDK have a Node.js/headless API?**
   - Check with IMG.LY team
   - Alternative: Use Puppeteer/Playwright

2. **Should test PDFs be committed to git?**
   - For quick local testing: Yes
   - For CI/CD: Generate fresh

3. **Archive fixture size limits?**
   - Current archives might be large
   - Consider minimal test cases

## Progress Tracking

- [x] Jest test framework setup
- [x] External validation tools
- [x] 18 test cases written
- [ ] Automated PDF generation
- [ ] CI/CD integration
- [ ] Visual regression tests
- [ ] Performance benchmarks

---

**Current State:** Tests are ready to run once PDF fixtures are provided (manually or programmatically).

**Next Step:** Export 5 test PDFs manually, then implement automated generation when time permits.