# @imgly/plugin-pdfx-web

**Print-Ready PDF Export Plugin for CE.SDK**

Transform CE.SDK's standard PDF exports into professional print-ready files that meet industry printing standards. Hook directly into CE.SDK's export process to automatically convert PDFs for commercial printing workflows.

## Key Features

- **Zero Server Dependencies**: All processing happens in the browser
- **Industry Standard Profiles**: US Commercial, European Commercial, and Digital output profiles included
- **Custom Profile Support**: Load any ICC color profile for specialized printing requirements
- **Drop-in Integration**: Single function call that works seamlessly with CE.SDK
- **Production Ready**: Handles large files with comprehensive error handling

## Installation

```bash
npm install @imgly/plugin-pdfx-web
```

## Quick Start

```javascript
import { convertToPDFX3 } from '@imgly/plugin-pdfx-web';

// Convert a PDF to US commercial print standard
const printReadyPDF = await convertToPDFX3(pdfBlob, {
  outputProfile: 'gracol',
  title: 'My Print-Ready Document',
});
```

## CE.SDK Integration

Add print-ready export to your CE.SDK editor:

```javascript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { convertToPDFX3 } from '@imgly/plugin-pdfx-web';

const config = {
  license: 'your-cesdk-license',
  ui: {
    elements: {
      navigation: {
        action: {
          custom: [
            {
              label: 'Export Print-Ready PDF',
              iconName: '@imgly/icons/Essentials/Download',
              callback: async () => {
                const sceneId = cesdk.engine.scene.get();
                const pdfBlob = await cesdk.engine.block.export(
                  sceneId,
                  'application/pdf'
                );
                const printReadyBlob = await convertToPDFX3(pdfBlob, {
                  outputProfile: 'fogra39',
                  title: 'Print-Ready Export',
                });

                // Download
                const url = URL.createObjectURL(printReadyBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'design-print-ready.pdf';
                link.click();
                URL.revokeObjectURL(url);
              },
            },
          ],
        },
      },
    },
  },
};

const cesdk = await CreativeEditorSDK.create('#editor', config);
```

## API Reference

### `convertToPDFX3(pdf, options)`

Converts a standard PDF to print-ready format.

**Parameters:**

- `pdf` (Blob): Input PDF file as a Blob object
- `options` (PDFX3Options): Conversion configuration

**Returns:** Promise<Blob> - The print-ready PDF file

```typescript
interface PDFX3Options {
  outputProfile: 'gracol' | 'fogra39' | 'srgb' | 'custom';
  customProfile?: Blob; // Required only if outputProfile is 'custom'
  title?: string; // Optional document title
}
```

### Print Profiles

| Profile     | Best For                     | Region/Standard      | Size  |
| ----------- | ---------------------------- | -------------------- | ----- |
| `'gracol'`  | Commercial printing (coated) | US (GRACoL 2013)     | 2.6MB |
| `'fogra39'` | Commercial printing (coated) | Europe (FOGRA39)     | 1.8MB |
| `'srgb'`    | Digital displays, web output | International (sRGB) | 3KB   |
| `'custom'`  | Specialized printing needs   | User-defined         | -     |

## Usage Examples

### Basic Conversion

```javascript
import { convertToPDFX3 } from '@imgly/plugin-pdfx-web';

// US Commercial Printing
const printReady = await convertToPDFX3(pdfBlob, {
  outputProfile: 'gracol',
  title: 'My Brochure - Print Ready',
});

// European Commercial Printing
const printReady = await convertToPDFX3(pdfBlob, {
  outputProfile: 'fogra39',
  title: 'My Magazine - Print Ready',
});

// Digital/Web Output
const webReady = await convertToPDFX3(pdfBlob, {
  outputProfile: 'srgb',
  title: 'My Document - Web Ready',
});
```

### Custom Color Profile

For specialized printing requirements:

```javascript
// Load a custom ICC color profile
const customProfile = await fetch(
  'https://color.org/profiles/sRGB2014.icc'
).then((r) => r.blob());

const customResult = await convertToPDFX3(pdfBlob, {
  outputProfile: 'custom',
  customProfile: customProfile,
  title: 'Custom Profile Export',
});
```

### Batch Processing

Convert multiple PDFs at once:

```javascript
const printReadyPDFs = await Promise.all(
  pdfBlobs.map((pdf) =>
    convertToPDFX3(pdf, {
      outputProfile: 'gracol',
      title: 'Batch Export',
    })
  )
);
```

## Testing

Test the integration with a complete CE.SDK example:

```bash
# Start the test server
npm run test:cesdk

# Open http://localhost:3001 in your browser
# Create designs and export with different print profiles
```

The test interface includes:

- Live CE.SDK editor
- Navigation bar with print-ready export options
- Real-time conversion and download

## Known Limitations

- **Spot Colors**: Currently, spot colors (Pantone, custom inks) are converted to CMYK during the PDF/X-3 conversion process. This is a limitation of the current Ghostscript WASM implementation. If preserving spot colors is critical for your workflow, consider server-side PDF processing solutions.

## License Considerations

This plugin uses Ghostscript WebAssembly (AGPL-3.0 licensed) with **client-side browser execution**:

### How It Works
- Ghostscript WASM loads dynamically in the user's browser
- All PDF processing happens client-side on the user's device
- No AGPL code runs on your servers
- Similar to users installing a browser extension

### Usage Guidelines

✅ **Generally Safe For:**
- Open source projects
- Internal/private applications
- Commercial websites (processing happens in user's browser)
- SaaS applications (no server-side AGPL code execution)

⚠️ **Considerations:**
- If you bundle/modify the WASM module directly
- If you prevent users from accessing the source
- If you process PDFs server-side

### Why Browser Execution Matters
Since the AGPL-licensed Ghostscript runs entirely in the end user's browser rather than as a network service:
1. Your servers never execute AGPL code
2. You're not providing a "network service" under AGPL terms
3. The architecture is similar to CDN-delivered JavaScript libraries

For specific legal guidance, consult with legal counsel. For technical questions, contact IMG.LY support.

## Support

For questions about CE.SDK integration or print workflows:

- [CE.SDK Documentation](https://img.ly/docs)
- [GitHub Issues](https://github.com/imgly/plugins/issues)
- [IMG.LY Support](https://img.ly/support)
