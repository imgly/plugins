# Ghostscript WASM Integration Plan

## Overview

This document outlines the implementation strategy for integrating Ghostscript WebAssembly to enable PDF/X-3 conversion in the browser.

## Investigated Options

### Option 1: Laurent Meyer's ghostscript-pdf-compress.wasm (RECOMMENDED)

**✅ Pros:**
- **Proven Working Implementation**: Live demo at https://laurentmmeyer.github.io/ghostscript-pdf-compress.wasm/
- **WebWorker Integration**: Non-blocking main thread, can handle large PDFs
- **Modern Bundling**: Uses Vite for lazy-loading the 18MB WASM
- **Client-side Security**: All processing happens locally, no server roundtrips
- **Real-world Tested**: Already compresses PDFs successfully

**❌ Cons:**
- **Size Impact**: ~18MB WASM (6x larger than native 3MB Ghostscript)
- **License**: AGPL-3.0 (viral copyleft)
- **Chrome Dependency**: Based on ochachacha's build which targets Chrome primarily

### Option 2: Build Custom Ghostscript WASM

**✅ Pros:**
- **Full Control**: Optimize for PDF/X-3 specific use case
- **Size Optimization**: Strip unnecessary features, potentially reduce from 18MB
- **License Flexibility**: Could explore different licensing approaches
- **Browser Compatibility**: Target all modern browsers, not just Chrome

**❌ Cons:**
- **High Complexity**: Emscripten build process, C/PostScript expertise needed
- **Time Investment**: Weeks/months vs days for adaptation approach
- **Maintenance Burden**: Need to track Ghostscript updates and security patches
- **Risk**: Potential build/compatibility issues

### Option 3: Alternative WASM PDF Libraries

**Assessment**: No viable alternatives found with PDF/X-3 capabilities
- **PDF.js**: Great for viewing, limited for conversion/processing
- **jsscheller/ghostscript-wasm**: Less mature, minimal documentation
- **jerbob92/ghostscript-wasm**: Similar limitations

### Option 4: Hybrid Server-Client Architecture

**❌ Rejected**: Against requirements for client-side processing
- Privacy concerns with server-side PDF handling
- Infrastructure complexity
- Network latency vs instant client-side processing

## RECOMMENDED APPROACH: Phased Implementation

### Phase 1: Adapt Laurent Meyer's Implementation (Immediate - 1-2 weeks)

1. **Fork/Clone** his ghostscript-pdf-compress.wasm project
2. **Modify Ghostscript Commands** from compression to PDF/X-3 conversion:
   ```javascript
   const pdfxCommand = [
     '-dPDFX',
     '-dBATCH',
     '-dNOPAUSE', 
     '-sProcessColorModel=DeviceCMYK',
     '-sColorConversionStrategy=CMYK',
     `-sOutputICCProfile=${iccProfile}`,
     `-dRenderIntent=${renderingIntentMap[options.renderingIntent]}`,
     `-dKPreserve=${options.preserveBlack ? 1 : 0}`,
     '-sDEVICE=pdfwrite',
     '-sOutputFile=output.pdf',
     'PDFX_def.ps',
     'input.pdf'
   ];
   ```

3. **Create PDFX Definition Files** as virtual files in WASM filesystem
4. **Bundle ICC Profiles** in WASM virtual filesystem
5. **Integrate WebWorker** into our plugin architecture
6. **Test & Validate** PDF/X-3 compliance with professional tools

### Phase 2: Optimization & Polish (Medium-term - 1 month)

1. **Size Optimization**:
   - Strip unused Ghostscript features
   - Compress ICC profiles
   - Bundle splitting for different profiles

2. **Performance Enhancement**:
   - Implement progress callbacks
   - Memory management for large PDFs
   - Concurrent processing limits

3. **Error Handling**:
   - Parse Ghostscript error messages
   - User-friendly error reporting
   - Fallback strategies

### Phase 3: Advanced Features (Long-term - 2-3 months)

1. **Custom WASM Build**: If size/performance becomes critical
2. **Multiple Browser Support**: Test and fix Chrome-specific issues
3. **Advanced PDF/X Features**: PDF/X-4, spot color handling
4. **Preflight Validation**: Check compliance before/after conversion

## Technical Implementation Strategy

### Integration Architecture

```typescript
class GhostscriptWASM {
  private static instance: Promise<GhostscriptWASM>;
  private worker: Worker;
  
  static async getInstance(): Promise<GhostscriptWASM> {
    if (!this.instance) {
      this.instance = this.loadWASM();
    }
    return this.instance;
  }
  
  private static async loadWASM(): Promise<GhostscriptWASM> {
    // Lazy load 18MB WASM only when needed
    const { default: WorkerUrl } = await import('./ghostscript-worker.js?worker&url');
    return new GhostscriptWASM(new Worker(WorkerUrl));
  }
  
  async convertToPDFX3(
    pdfBlob: Blob, 
    iccProfile: Blob, 
    options: PDFX3Options
  ): Promise<Blob> {
    // Implementation using WebWorker
  }
}
```

### Ghostscript Command Mapping

```typescript
// Map our options to Ghostscript parameters
const renderingIntentMap = {
  'perceptual': 0,
  'relative': 1, 
  'saturation': 2,
  'absolute': 3
};

const outputIntentMap = {
  'FOGRA39': 'ISOcoated_v2_300_bas.icc',
  'GRACoL2006': 'GRACoL2006_Coated1v2.icc',
  'SWOP': 'USWebCoatedSWOP.icc'
};
```

### Bundle Strategy

- **Dynamic Import**: Load WASM only when `options.pdfx3` is provided
- **Service Worker Caching**: Cache WASM for subsequent uses
- **Progressive Loading**: Show loading states for first-time users

## Risk Assessment & Mitigation

### High Risk: 18MB Bundle Size
- **Mitigation**: Lazy loading, clear user communication about first-load delay
- **Alternative**: Provide server-side option for size-sensitive applications

### Medium Risk: AGPL License
- **Mitigation**: Ensure compliance, consider commercial licensing if needed
- **Alternative**: Build custom WASM with more permissive base (if legal)

### Low Risk: Browser Compatibility
- **Mitigation**: Feature detection, graceful degradation
- **Testing**: Comprehensive cross-browser testing plan

## Key Ghostscript PDF/X-3 Parameters

Based on research, essential command line options:

```bash
gs -dPDFX \
   -dBATCH \
   -dNOPAUSE \
   -dNOOUTERSAVE \
   -sProcessColorModel=DeviceCMYK \
   -sColorConversionStrategy=CMYK \
   -sColorConversionStrategyForImages=CMYK \
   -sOutputICCProfile=profile.icc \
   -dRenderIntent=1 \
   -dKPreserve=1 \
   -sDEVICE=pdfwrite \
   -sOutputFile=output.pdf \
   PDFX_def.ps \
   input.pdf
```

## Files to Create/Modify

### New Files:
- `src/ghostscript-wasm.ts` - WASM interface wrapper
- `src/ghostscript-worker.ts` - WebWorker implementation  
- `src/pdfx-definitions.ts` - PDF/X definition files
- `assets/icc-profiles/` - Bundled ICC profile files

### Modified Files:
- `src/pdfx.ts` - Replace dummy implementation
- `package.json` - Add WASM dependencies
- `esbuild/config.mjs` - Handle WASM bundling

## Success Criteria

1. **Functional**: Convert RGB PDF to valid PDF/X-3 with custom ICC profile
2. **Performance**: Handle PDFs up to 50MB without blocking UI
3. **Compatibility**: Work in Chrome, Firefox, Safari, Edge
4. **Bundle**: Initial load under 30 seconds on average connection
5. **Validation**: Output passes PDF/X-3 compliance checks

## Next Steps

1. Clone Laurent Meyer's repository
2. Set up development environment with Emscripten
3. Modify compression commands to PDF/X-3 conversion
4. Create test suite with professional PDF/X validation tools
5. Integrate into our plugin architecture

This phased approach balances speed-to-market with long-term optimization opportunities.