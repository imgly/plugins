# Product Requirements Document (PRD) - PDFX Plugin

## Overview

The PDFX plugin enhances CE.SDK with PDF/X-3 compatible export capabilities. It converts CE.SDK's default RGB PDF exports to PDF/X-3 compliant files using Ghostscript via WebAssembly, enabling print-ready PDF generation with custom ICC profiles.

## Background

CE.SDK exports PDF files with RGB colors by default. Professional printing workflows require PDF/X-3 compliance with CMYK color spaces and specific ICC profiles. This plugin bridges that gap by providing automatic conversion to print-ready PDFs.

## Goals

1. **PDF/X-3 Compliance**: Convert RGB PDFs to PDF/X-3 standard for professional printing
2. **ICC Profile Support**: Allow custom ICC profiles for tailored color conversion
3. **Drop-in Replacement**: Match CE.SDK's export signature for seamless integration
4. **No UI Required**: Programmatic API for integrators to handle export configuration

## Core Features

### 1. PDF/X-3 Conversion
- **Function**: `convertToPDF(pdfBlobs: Blob[], options?: PDFConversionOptions): Promise<Blob[]>`
- **Purpose**: Converts RGB PDF blobs to PDF/X-3 compliant files using Ghostscript WASM
- **Processing**: Each blob in the array is processed separately
- **Compliance**: Does nothing if PDF is already PDF/X-3 compliant

### 2. Ghostscript WebAssembly Integration
- **Library**: Uses ps-wasm (AGPL licensed) as initial implementation
- **Loading**: Lazy-loaded on first use to optimize initial bundle size
- **Bundling**: WASM file included in NPM package
- **Architecture**: Direct integration first, WebWorker if performance requires

### 3. Configuration Options
```typescript
interface PDFX3Options {
  iccProfile: Blob;                    // Required: ICC profile for color conversion
  renderingIntent?: 'perceptual' | 'relative' | 'absolute' | 'saturation';
  preserveBlack?: boolean;             // K-channel preservation
  pdfxVersion?: 'X-3' | 'X-4';       // X-4 allows transparency
  outputIntent?: 'auto' | 'FOGRA39' | 'GRACoL2006' | 'SWOP' | 'custom';
  outputIntentProfile?: Blob;          // Required if outputIntent is 'custom'
  ghostscriptArgs?: string[];          // Advanced: raw Ghostscript arguments
}

interface PDFConversionOptions {
  // Existing options (kept for compatibility)
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  
  // PDF/X-3 specific options
  pdfx3?: PDFX3Options;
}
```

### 4. Color Space Handling
- **RGB to CMYK**: Converts all RGB content using the provided ICC profile
- **Spot Colors**: Preserved and forwarded as-is
- **Transparency**: Flattened for PDF/X-3 (preserved for PDF/X-4)
- **Rendering Intents**: Full support for all standard ICC rendering intents
- **Black Preservation**: Option to preserve K-channel in CMYK conversions

## Technical Architecture

### Plugin Structure
- Standard IMG.LY plugin architecture  
- Ghostscript WASM integration via ps-wasm
- TypeScript for type safety
- Lazy-loading for WASM resources

### Integration Points
1. **Direct Function Import**: Use `convertToPDF` as drop-in replacement for CE.SDK export
2. **Export Callback**: Direct integration with `onExport` callback
3. **No UI Components**: Pure programmatic API

## Usage Examples

### PDF/X-3 Export Integration
```typescript
import { convertToPDF } from '@imgly/plugin-pdfx-web';

// Load ICC profile
const iccProfileBlob = await fetch('/profiles/FOGRA39.icc').then(r => r.blob());

// Set up export handler
cesdk.engine.editor.onExport = async (blobs, options) => {
  if (options.mimeType === 'application/pdf') {
    return convertToPDF(blobs, {
      pdfx3: {
        iccProfile: iccProfileBlob,
        renderingIntent: 'relative',
        preserveBlack: true,
        pdfxVersion: 'X-3',
        outputIntent: 'auto'
      }
    });
  }
  return blobs;
};
```

### Direct Conversion
```typescript
import { convertToPDF } from '@imgly/plugin-pdfx-web';

const pdfx3Blobs = await convertToPDF(pdfBlobs, {
  pdfx3: {
    iccProfile: customICCProfile,
    renderingIntent: 'perceptual',
    pdfxVersion: 'X-4' // Allows transparency
  }
});
```

## Error Handling

- **Invalid ICC Profile**: Clear error message indicating profile format issues
- **Conversion Failures**: Descriptive messages suitable for end-user display
- **WASM Loading Errors**: Fallback behavior and initialization error messages
- **Already Compliant**: Silent pass-through without processing

## Performance Considerations

- **WASM Loading**: Lazy-loaded on first use to reduce initial bundle impact
- **Memory Management**: Process blobs sequentially to manage memory usage
- **Progress Feedback**: Optional progress callbacks for large files (future)
- **Web Worker**: Optional offloading to worker thread (future)

## Dependencies

- `@cesdk/cesdk-js`: For plugin integration
- `@imgly/plugin-utils`: For shared plugin utilities  
- `ps-wasm`: Ghostscript WebAssembly build (AGPL licensed)
- TypeScript: For type safety and better developer experience

## Constraints

1. **License Compatibility**: AGPL license from ps-wasm must be considered
2. **Browser Support**: Modern browsers with WebAssembly support required
3. **WASM Size**: Ghostscript WASM expected to be several MB
4. **No UI**: Plugin provides no UI components, integrators handle user interaction

## Implementation Notes

- **CMYK Handling**: CE.SDK converts CMYK to RGB before export, so all colors treated as RGB input
- **OutputIntent**: Automatically matched to ICC profile when set to 'auto'
- **Spot Colors**: Passed through without conversion
- **Default Values**: 
  - renderingIntent: 'relative'
  - preserveBlack: true
  - pdfxVersion: 'X-3'
  - outputIntent: 'auto'

## Implementation Strategy

1. **Phase 1**: ps-wasm integration for proof of concept
2. **Phase 2**: Performance optimization and error handling
3. **Phase 3**: Advanced features and potential custom WASM build
4. **Validation**: Use professional PDF/X-3 compliance tools throughout