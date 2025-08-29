export interface PDFX3Options {
  // Required
  outputProfile: 'gracol' | 'fogra39' | 'srgb' | 'custom';
  customProfile?: Blob;        // Only if outputProfile is 'custom'
  
  // Optional (with sensible defaults)
  title?: string;              // Document title (default: use existing)
}
