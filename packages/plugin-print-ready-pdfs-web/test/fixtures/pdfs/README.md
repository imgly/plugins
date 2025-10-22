# Test PDF Fixtures

Place RGB PDFs exported from CE.SDK here for testing.

## Required PDFs

Export these from your CE.SDK archives:

### 1. `test-minimal.pdf`
- Source: `test/fixtures/archives/test-minimal.zip`
- Content: Single colored rectangle
- Purpose: Quick smoke test, basic conversion validation

### 2. `test-vectors.pdf`
- Source: `test/fixtures/archives/test-vectors.zip`
- Content: Multiple shapes (rectangles, circles, paths)
- Purpose: Verify vectors are not rasterized

### 3. `test-text.pdf`
- Source: `test/fixtures/archives/test-text.zip`
- Content: Multiple text blocks with 2-3 fonts
- Purpose: Verify text preservation and font embedding

### 4. `test-images.pdf`
- Source: `test/fixtures/archives/test-images.zip`
- Content: 2-3 embedded images
- Purpose: Verify images are preserved without re-encoding

### 5. `test-complex.pdf`
- Source: `test/fixtures/archives/test-complex.zip`
- Content: Mixed content (shapes + text + images)
- Purpose: Real-world complexity test

## How to Export

1. Open CE.SDK test server: `pnpm test:cesdk`
2. For each archive:
   - Load the archive
   - Export as PDF (RGB, standard CE.SDK export)
   - Save to this directory with the corresponding name

Or use the export script if available.