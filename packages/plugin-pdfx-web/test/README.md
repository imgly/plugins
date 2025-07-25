# PDF/X-3 Conversion Test

This directory contains test scripts for evaluating the PDF/X-3 conversion functionality.

## Test Scripts

### 1. Generate Sample PDF
```bash
pnpm run test:generate
```
Creates a simple RGB PDF with colored rectangles for testing conversion.

### 2. Test Conversion
```bash
pnpm run test:convert [input.pdf] [output.pdf]
```
Tests the PDF/X-3 conversion function with the sample PDF (or custom input).

### 3. Run All Tests
```bash
pnpm run test
```
Builds the plugin, generates sample PDF, and runs conversion test.

## Files

- `generate-sample.mjs` - Creates a test PDF with RGB colors
- `convert-test.mjs` - Tests the conversion function
- `sample.pdf` - Generated test PDF (created by test:generate)
- `output-x3.pdf` - Output from conversion test

## Usage

1. First build the plugin:
   ```bash
   pnpm run build
   ```

2. Run the complete test:
   ```bash
   pnpm run test
   ```

3. Check the output files:
   - `test/sample.pdf` - Original RGB PDF
   - `test/output-x3.pdf` - Converted PDF (currently identical since it's a dummy implementation)

## Test Output

The test script will show:
- Input/output file paths
- Conversion timing
- File sizes
- Console logs from the conversion function

Currently, since this is a dummy implementation, the output PDF will be identical to the input PDF. Once the Ghostscript WASM integration is implemented, the output will be a true PDF/X-3 compliant file.