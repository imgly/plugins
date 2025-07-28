# Ghostscript WASM Integration Plan

## Overview

This document outlines the implementation strategy for integrating Ghostscript WebAssembly to enable PDF/X-3 conversion in the browser, starting with ps-wasm as the initial approach.

## Selected Approach: ps-wasm First

After evaluating multiple options, we're starting with ps-wasm for rapid prototyping and validation, with the flexibility to optimize or switch approaches based on real-world requirements.

## Implementation Phases

### Phase 1: ps-wasm Proof of Concept (Week 1)

**Goal**: Validate PDF/X-3 conversion capability with minimal complexity

#### Day 1-2: Basic Integration
1. **Setup ps-wasm**
   ```bash
   pnpm add ps-wasm
   ```

2. **Create Ghostscript wrapper** (`src/ghostscript.ts`)
   - Initialize ps-wasm
   - Handle virtual filesystem
   - Execute Ghostscript commands
   - Return converted PDF

3. **Integrate with existing API** (`src/pdfx.ts`)
   - Replace dummy implementation
   - Convert Blob to Uint8Array
   - Call Ghostscript wrapper
   - Handle errors gracefully

#### Day 3-4: PDF/X-3 Specifics
1. **Create PDFX_def.ps generator**
   - Dynamic PostScript generation
   - Support different OutputIntents
   - Handle custom profiles

2. **Test color conversion**
   - RGB to CMYK conversion
   - ICC profile embedding
   - Rendering intent application

3. **Validate compliance**
   - Use PDF/X-3 validators
   - Check color spaces
   - Verify OutputIntent

#### Day 5: Performance Testing
1. **Measure metrics**
   - Bundle size impact
   - WASM loading time
   - Conversion performance
   - Memory usage

2. **Identify bottlenecks**
   - Large file handling
   - Multiple conversions
   - Memory leaks

### Phase 2: Production Readiness (Week 2)

#### Error Handling & UX
1. **Parse Ghostscript errors**
   ```typescript
   function parseGhostscriptError(stderr: string): string {
     // Convert technical errors to user-friendly messages
     if (stderr.includes('Unable to open ICC profile')) {
       return 'Invalid ICC profile provided';
     }
     // ... more error mappings
   }
   ```

2. **Progress reporting**
   - Estimate conversion time
   - Provide status updates
   - Handle cancellation

3. **Validation layer**
   - Check input PDF validity
   - Verify ICC profile format
   - Detect already-compliant PDFs

#### Optimization
1. **Lazy loading strategy**
   ```typescript
   async function convertToPDF(blobs: Blob[], options?: PDFConversionOptions) {
     if (!options?.pdfx3) {
       return blobs; // No conversion needed
     }
     
     // Only load WASM when needed
     const { convertToPDFX3 } = await import('./ghostscript');
     return convertToPDFX3(blobs, options.pdfx3);
   }
   ```

2. **Memory management**
   - Clean up virtual filesystem
   - Process PDFs sequentially
   - Implement size limits

### Phase 3: Advanced Features (Week 3-4)

#### WebWorker Integration (if needed)
1. **Create worker wrapper**
   - Move Ghostscript to worker
   - Implement message protocol
   - Handle file transfers

2. **Benefits**
   - Non-blocking UI
   - Better memory isolation
   - Concurrent processing

#### Alternative Approaches (if ps-wasm insufficient)
1. **Option A: Fork ps-wasm**
   - Add missing features
   - Optimize for our use case
   - Maintain compatibility

2. **Option B: Custom build**
   - Use Emscripten directly
   - Strip unused features
   - Optimize size

3. **Option C: Server fallback**
   - For extreme cases only
   - Privacy-preserving design
   - Optional deployment

## Technical Implementation Details

### Ghostscript Command Construction
```typescript
interface GhostscriptArgs {
  pdfx: boolean;
  processColorModel: 'DeviceCMYK' | 'DeviceRGB';
  colorConversionStrategy: 'CMYK' | 'RGB' | 'Gray';
  outputICCProfile: string;
  renderIntent: number;
  preserveBlack: number;
  device: 'pdfwrite';
  outputFile: string;
  inputFiles: string[];
}

function buildGhostscriptCommand(options: PDFX3Options): string[] {
  return [
    '-dPDFX',
    '-dBATCH',
    '-dNOPAUSE',
    '-dNOOUTERSAVE',
    '-sProcessColorModel=DeviceCMYK',
    '-sColorConversionStrategy=CMYK',
    `-sOutputICCProfile=/tmp/profile.icc`,
    `-dRenderIntent=${getRenderIntent(options.renderingIntent)}`,
    `-dKPreserve=${options.preserveBlack ? 1 : 0}`,
    '-sDEVICE=pdfwrite',
    '-sOutputFile=/tmp/output.pdf',
    '/tmp/PDFX_def.ps',
    '/tmp/input.pdf'
  ];
}
```

### PDFX Definition File
```typescript
function createPDFXDefinition(options: PDFX3Options): string {
  const outputCondition = getOutputCondition(options);
  
  return `
%!PS-Adobe-3.0
%%BeginResource: procset PDFX_def 1.0 0
%%Version: 1.0
/PDFX_def <<
  /PDFXVersion (PDF/X-${options.pdfxVersion || '3'}:2003)
  /OutputConditionIdentifier (${outputCondition.identifier})
  /OutputCondition (${outputCondition.condition})
  /Info (Title: Document)
  /RegistryName (http://www.color.org)
  /Trapped /False
>> def
%%EndResource
  `;
}
```

### Virtual Filesystem Management
```typescript
class VirtualFileSystem {
  constructor(private gs: any) {}
  
  async writeFile(path: string, data: Uint8Array): Promise<void> {
    this.gs.FS.writeFile(path, data);
  }
  
  async readFile(path: string): Promise<Uint8Array> {
    return this.gs.FS.readFile(path);
  }
  
  cleanup(): void {
    // Remove temporary files
    ['input.pdf', 'output.pdf', 'profile.icc', 'PDFX_def.ps']
      .forEach(file => {
        try {
          this.gs.FS.unlink(`/tmp/${file}`);
        } catch (e) {
          // File might not exist
        }
      });
  }
}
```

## Bundle Strategy

### Dynamic Imports
```typescript
// src/index.ts
export { convertToPDF } from './pdfx';
export type { PDFConversionOptions, PDFX3Options } from './types';

// Ghostscript loaded only when needed
```

### Webpack/Vite Configuration
```javascript
// Handle WASM files
{
  test: /\.wasm$/,
  type: 'asset/resource',
  generator: {
    filename: 'wasm/[name].[hash][ext]'
  }
}
```

## Testing Strategy

### Unit Tests
1. **PDFX definition generation**
2. **Error parsing**
3. **Option mapping**

### Integration Tests
1. **Simple RGB conversion**
2. **Multi-page documents**
3. **Large file handling**
4. **Error scenarios**

### Compliance Tests
1. **PDF/X-3 validators**
   - Adobe Acrobat Preflight
   - callas pdfToolbox
   - Online validators

2. **Color accuracy**
   - Compare color values
   - Verify ICC profile embedding
   - Check rendering intents

## Success Metrics

### Phase 1 Success
- ✓ Basic RGB to CMYK conversion works
- ✓ ICC profiles properly embedded
- ✓ Output validates as PDF/X-3

### Phase 2 Success
- ✓ < 10MB bundle size increase
- ✓ < 5 second conversion for 10MB PDF
- ✓ Clear error messages
- ✓ No memory leaks

### Phase 3 Success
- ✓ WebWorker integration (if needed)
- ✓ 95% browser compatibility
- ✓ Production deployment ready

## Risk Mitigation

### ps-wasm Limitations
- **Risk**: Missing features or bugs
- **Mitigation**: Early testing, fallback plan ready

### Bundle Size
- **Risk**: Too large for web delivery
- **Mitigation**: Lazy loading, user communication

### Performance
- **Risk**: Slow conversion times
- **Mitigation**: WebWorker, progress indication

### Browser Compatibility
- **Risk**: WASM support issues
- **Mitigation**: Feature detection, graceful degradation

## Next Steps

1. **Create feature branch**
   ```bash
   git checkout -b feature/ghostscript-integration
   ```

2. **Install ps-wasm**
   ```bash
   pnpm add ps-wasm
   ```

3. **Implement basic wrapper**
   - Start with minimal functionality
   - Test with sample PDFs
   - Iterate based on results

4. **Validate approach**
   - Performance acceptable?
   - Features sufficient?
   - Size manageable?

5. **Decide on optimization**
   - Continue with ps-wasm?
   - Need WebWorker?
   - Consider alternatives?

This phased approach allows us to validate the core functionality quickly while maintaining flexibility to optimize or pivot based on real-world requirements.