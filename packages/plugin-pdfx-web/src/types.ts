export interface PDFX3Options {
  iccProfile: Blob;
  renderingIntent?: 'perceptual' | 'relative' | 'absolute' | 'saturation';
  preserveBlack?: boolean;
  pdfxVersion?: 'X-3' | 'X-4';
  outputIntent?: 'auto' | 'FOGRA39' | 'GRACoL2006' | 'SWOP' | 'custom';
  outputIntentProfile?: Blob;
  ghostscriptArgs?: string[];
}

export interface PDFConversionOptions {
  // Existing options (kept for compatibility)
  format?: 'A4' | 'A3' | 'Letter' | 'Legal' | 'Custom';
  orientation?: 'portrait' | 'landscape';
  quality?: number;
  includeMetadata?: boolean;
  preserveEditability?: boolean;
  customWidth?: number;
  customHeight?: number;
  dpi?: number;
  
  // PDF/X-3 specific options
  pdfx3?: PDFX3Options;
}

export interface PluginConfiguration {
  defaultOptions?: PDFConversionOptions;
  enableUIControls?: boolean;
  allowedFormats?: PDFConversionOptions['format'][];
}