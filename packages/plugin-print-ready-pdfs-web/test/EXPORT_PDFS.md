# Exporting Test PDFs from Archives

## Quick Start

### Step 1: Start CE.SDK Test Server

```bash
pnpm test:cesdk
```

This starts a local server at http://localhost:3001

### Step 2: Open Export Page

Open your browser and navigate to:
```
http://localhost:3001/export-archives.html
```

### Step 3: Export PDFs

The page will show 5 archives. Click "Export" button next to each one:

- test-minimal.zip → test-minimal.pdf
- test-vectors.zip → test-vectors.pdf
- test-text.zip → test-text.pdf
- test-images.zip → test-images.pdf
- test-complex.zip → test-complex.pdf

Each PDF will download to your Downloads folder.

### Step 4: Move PDFs to Fixtures

Move the downloaded PDFs to:
```bash
mv ~/Downloads/test-*.pdf test/fixtures/pdfs/
```

### Step 5: Run Tests

```bash
pnpm test:integration
```

## Troubleshooting

### Server Not Running
If you get "Failed to connect", make sure `pnpm test:cesdk` is running in another terminal.

### License Key Missing
If CE.SDK doesn't load, check that `VITE_CESDK_LICENSE_KEY` is set in `.env.local`.

### Export Fails
Check the browser console for errors. CE.SDK may need time to initialize (wait ~5 seconds after page load).

## Automated Export (Future)

An automated Playwright script (`test/generate-pdfs.mjs`) is available but currently has issues with CE.SDK initialization in headless mode. To fix this, we need to:

1. Resolve localStorage access in headless Chrome
2. Ensure CE.SDK loads correctly without user interaction
3. Handle download events properly in Playwright

For now, manual export via the browser UI is the recommended approach.