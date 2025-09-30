# @imgly/plugin-print-ready-pdfs-web

**Transform CE.SDK PDFs into Print-Ready CMYK Files**

Convert CE.SDK's standard PDF exports into fully **PDF/X-3 compliant, CMYK-based print-ready files** with embedded ICC output intents. This plugin hooks directly into CE.SDK's export process, ensuring your designs are automatically prepared for professional commercial printing workflows.

## The Problem

Your users design beautiful materials in CE.SDK. But professional printing requires specific PDF standards:

- CMYK color space instead of RGB
- PDF/X-3 or PDF/X-4 compliance
- Embedded ICC color profiles for accurate color reproduction

## The Solution

This plugin automatically converts CE.SDK's RGB PDFs into print-ready files that meet professional printing requirements:

- ✅ **CMYK Color Space**: Converts RGB to CMYK using professional ICC profiles
- ✅ **PDF/X Standards**: Generates PDF/X-3 compliant files for commercial printing
- ✅ **Color Profile Support**: Embeds industry-standard or custom ICC profiles
- ✅ **100% Client-Side**: Everything runs in the browser—zero backend infrastructure
- ✅ **Drop-in Integration**: One function call transforms any PDF

## Key Features

- **Drop-in Replacement**: Works seamlessly with CE.SDK's existing export functionality
- **100% Client-Side**: All processing happens in the browser—no server infrastructure required
- **Industry Profiles Included**: Ships with FOGRA39 (Europe), GRACoL 2013 (US), and sRGB profiles
- **Custom Profile Support**: Bring your own ICC profile to match sophisticated print pipelines
- **PDF/X-3 Compliant**: Generates files that meet commercial printing standards

## Installation

```bash
npm install @imgly/plugin-print-ready-pdfs-web
```

## Quick Start

Just one function call transforms any PDF into a print-ready file:

```javascript
import { convertToPDFX3 } from '@imgly/plugin-print-ready-pdfs-web';

// Convert CE.SDK's RGB PDF to print-ready CMYK
const printReadyPDF = await convertToPDFX3(pdfBlob, {
  outputProfile: 'fogra39', // European printing standard
  title: 'My Print Document',
});

// That's it! The PDF is now ready for professional printing
```

## Drop-in CE.SDK Integration

Add print-ready export to your existing CE.SDK implementation with minimal code changes:

```javascript
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { convertToPDFX3 } from '@imgly/plugin-print-ready-pdfs-web';

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
  // Required
  outputProfile: 'gracol' | 'fogra39' | 'srgb' | 'custom';

  // Optional
  customProfile?: Blob;                   // Required only if outputProfile is 'custom'
  title?: string;                         // Document title
  outputConditionIdentifier?: string;     // ICC profile identifier for OutputIntent
  outputCondition?: string;               // Human-readable output condition description
}
```

**OutputIntent Metadata:**

The `outputConditionIdentifier` and `outputCondition` fields control the PDF/X-3 OutputIntent metadata:

- **Built-in profiles** (fogra39, gracol, srgb): Use preset values automatically (e.g., "FOGRA39", "ISO Coated v2 (ECI)")
- **Custom profiles**: Specify your own identifiers and descriptions
- Both fields are optional and have sensible defaults

### Included Color Profiles

The plugin ships with industry-standard ICC profiles for immediate use:

| Profile     | Purpose                         | Standard                                          |
| ----------- | ------------------------------- | ------------------------------------------------- |
| `'fogra39'` | European CMYK printing standard | FOGRA39 (ISO Coated v2) - Offset printing profile |
| `'gracol'`  | US CMYK printing standard       | GRACoL 2013 - Commercial printing profile         |
| `'srgb'`    | Digital/web distribution        | sRGB - When CMYK conversion isn't required        |
| `'custom'`  | Specific color requirements     | Load any ICC profile for exact color matching     |

## Real-World Usage

### Professional Printing Requirements

```javascript
import { convertToPDFX3 } from '@imgly/plugin-print-ready-pdfs-web';

// Your user designed materials in CE.SDK
const designPDF = await cesdk.engine.block.export(sceneId, 'application/pdf');

// Convert to print-ready format with CMYK and PDF/X-3 compliance
const printReadyPDF = await convertToPDFX3(designPDF, {
  outputProfile: 'fogra39', // Industry-standard CMYK profile
  title: 'Marketing Materials - Q4 2024',
});

// PDF now meets professional printing requirements
```

### Regional Color Standards

```javascript
// US Commercial Printing Standard
const usPrintReady = await convertToPDFX3(pdfBlob, {
  outputProfile: 'gracol', // GRACoL 2013 CMYK profile
  title: 'US Print Production',
});

// European Printing Standard
const euPrintReady = await convertToPDFX3(pdfBlob, {
  outputProfile: 'fogra39', // FOGRA39 CMYK profile
  title: 'EU Print Production',
});
```

### Custom Color Profiles

Bring your own ICC profile for specialized printing requirements:

```javascript
// Load a specific ICC profile for exact color requirements
const customProfile = await fetch('/profiles/custom-cmyk-profile.icc').then(
  (r) => r.blob()
);

const printReadyPDF = await convertToPDFX3(pdfBlob, {
  outputProfile: 'custom',
  customProfile: customProfile,
  title: 'Specialized Print Output',
  outputConditionIdentifier: 'Custom_Newsprint_CMYK',
  outputCondition: 'Custom newsprint profile for high-speed web press'
});

// PDF now uses your exact CMYK color profile with custom metadata
```

**Override Built-in Profile Metadata:**

You can also override the metadata for built-in profiles:

```javascript
const printReadyPDF = await convertToPDFX3(pdfBlob, {
  outputProfile: 'fogra39',
  title: 'Custom FOGRA39 Variant',
  outputConditionIdentifier: 'FOGRA39_Modified',
  outputCondition: 'Modified ISO Coated v2 for specific press'
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

## PDF/X-3 Compliance Details

The plugin ensures full PDF/X-3:2003 compliance by:

### OutputIntent

Every converted PDF includes a properly configured OutputIntent entry with:
- **DestOutputProfile**: The embedded ICC profile data
- **OutputConditionIdentifier**: Standard identifier (e.g., "FOGRA39", "GRACoL 2013")
- **OutputCondition**: Human-readable description of the printing condition
- **S**: Set to `/GTS_PDFX` for PDF/X-3 standard

### Trapped Entry

The `/Trapped` field is automatically set to `/False` in the PDF document info dictionary, indicating that trapping operations have not been performed. This is the correct value since the plugin performs color conversion but does not apply trapping.

Per the PDF/X-3 specification, this field must be set to either `/True` or `/False` (not `/Unknown`).

### Text and Vector Preservation

Text and vector graphics are preserved in their original vector format during conversion. Only the color space is converted from RGB to CMYK—no rasterization occurs.

## Known Limitations

- **Spot Colors**: Currently, spot colors (Pantone, custom inks) are converted to CMYK during the PDF/X-3 conversion process. This is a limitation of the current Ghostscript WASM implementation. If preserving spot colors is critical for your workflow, consider server-side PDF processing solutions.
- Only supports PDF/X-3 (not X-1a or X-4 yet)

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
