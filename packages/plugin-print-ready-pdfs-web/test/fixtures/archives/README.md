# Test Archive Fixtures

Place CE.SDK archive files (`.zip`) here for testing.

## Required Archives

Create these designs in CE.SDK and export as archives:

### 1. `test-minimal.zip`
**Purpose:** Quick smoke test, basic conversion validation
**Content:**
- Single colored rectangle (any color)

### 2. `test-vectors.zip`
**Purpose:** Verify vectors are not rasterized
**Content:**
- Multiple shapes (rectangles, circles, paths)
- Different colors and fills
- Various stroke widths
- Gradients (optional)

### 3. `test-text.zip`
**Purpose:** Verify text preservation and font embedding
**Content:**
- Multiple text blocks
- 2-3 different fonts
- Various sizes
- Some body text for searchability testing

### 4. `test-images.zip`
**Purpose:** Verify images are preserved without re-encoding
**Content:**
- 2-3 embedded images
- Mix of sizes

### 5. `test-complex.zip`
**Purpose:** Real-world complexity test
**Content:**
- Combination of: shapes + text + images
- Layered elements
- Represents typical design output

## Creating Archives

1. Open CE.SDK editor
2. Create design matching the requirements above
3. Export as archive (`.zip` file)
4. Copy to this directory

## Archive Format

CE.SDK archives are ZIP files containing the scene JSON and all assets (fonts, images, etc.).

They can be loaded via:
```typescript
await engine.scene.loadFromArchiveURL(archiveUrl);
```

The test infrastructure will:
1. Load each archive
2. Export to PDF using CE.SDK
3. Convert to PDF/X-3
4. Validate the output