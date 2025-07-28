# Ghostscript Integration Implementation Plan

## Phase 1: ps-wasm Proof of Concept (Week 1)

### Goals
- Validate PDF/X-3 conversion capability
- Understand Ghostscript command requirements
- Measure performance and bundle impact

### Implementation Steps

1. **Install ps-wasm**
   ```bash
   pnpm add ps-wasm
   ```

2. **Create Basic Integration**
   ```typescript
   // src/ghostscript.ts
   import initGhostscript from 'ps-wasm';
   
   export async function convertToPDFX3(
     pdfData: Uint8Array,
     iccProfile: Uint8Array,
     options: PDFX3Options
   ): Promise<Uint8Array> {
     const gs = await initGhostscript();
     
     // Write files to virtual filesystem
     gs.FS.writeFile('input.pdf', pdfData);
     gs.FS.writeFile('profile.icc', iccProfile);
     
     // Create PDFX_def.ps
     const pdfxDef = createPDFXDefinition(options);
     gs.FS.writeFile('PDFX_def.ps', pdfxDef);
     
     // Run Ghostscript
     const args = [
       '-dPDFX',
       '-dBATCH',
       '-dNOPAUSE',
       '-sProcessColorModel=DeviceCMYK',
       '-sColorConversionStrategy=CMYK',
       '-sOutputICCProfile=profile.icc',
       '-sDEVICE=pdfwrite',
       '-sOutputFile=output.pdf',
       'PDFX_def.ps',
       'input.pdf'
     ];
     
     await gs.run(args);
     
     // Read output
     return gs.FS.readFile('output.pdf');
   }
   ```

3. **Test with Sample PDFs**
   - RGB test patterns
   - Text and images
   - Transparency handling
   - Multi-page documents

4. **Measure Performance**
   - Bundle size impact
   - Conversion time
   - Memory usage
   - WASM loading time

## Phase 2: Production Integration (Week 2)

### If ps-wasm Works Well

1. **Error Handling**
   - Parse Ghostscript output
   - Provide user-friendly messages
   - Handle edge cases

2. **Optimization**
   - Lazy loading strategy
   - Progress reporting
   - Memory management

3. **Testing Suite**
   - Unit tests
   - Integration tests
   - PDF/X-3 compliance validation

### If ps-wasm Has Limitations

Consider alternatives:
1. **Fork ps-wasm** - Add missing features
2. **Try ghostscript-wasm** - Different implementation
3. **WebWorker wrapper** - Use Laurent Meyer's approach with ps-wasm

## Phase 3: Performance Optimization (Week 3-4)

1. **Bundle Size Reduction**
   - Dynamic imports
   - Code splitting
   - WASM compression

2. **WebWorker Integration**
   - Non-blocking conversion
   - Progress callbacks
   - Concurrent limits

3. **Caching Strategy**
   - Cache WASM module
   - Cache ICC profiles
   - Service Worker integration

## Technical Decisions

### Start Simple
- Direct browser usage first
- Add WebWorker if needed
- Optimize based on real usage

### PDFX Definition Strategy
```typescript
function createPDFXDefinition(options: PDFX3Options): string {
  return `
%!PS-Adobe-3.0
%%BeginResource: procset PDFX_def.ps
/PDFX_def <<
  /PDFXVersion (PDF/X-3:2003)
  /OutputConditionIdentifier (${options.outputIntent || 'Custom'})
  /Info (Creator: IMGLY PDFX Plugin)
  /OutputCondition (Print)
  /RegistryName (http://www.color.org)
>> def
%%EndResource
  `;
}
```

### Error Recovery
- Detect already-compliant PDFs
- Fallback for unsupported features
- Clear error messaging

## Success Metrics

1. **Functionality**
   - ✓ Converts RGB to CMYK
   - ✓ Embeds ICC profiles
   - ✓ Creates valid PDF/X-3

2. **Performance**
   - < 5s for 10MB PDF
   - < 100MB memory overhead
   - < 10MB bundle addition

3. **Developer Experience**
   - Simple API
   - Good error messages
   - TypeScript support

## Next Steps

1. Create branch for ps-wasm integration
2. Install dependencies
3. Implement basic conversion
4. Test with sample PDFs
5. Evaluate results and decide on path forward