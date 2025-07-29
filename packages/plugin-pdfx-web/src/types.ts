// Import all types from the types directory
export * from './types/pdfx';
export * from './types/ghostscript';

// Legacy compatibility types (kept for backward compatibility)
export interface PluginConfiguration {
  defaultOptions?: import('./types/pdfx').PDFConversionOptions;
  enableUIControls?: boolean;
  allowedFormats?: ('A4' | 'A3' | 'Letter' | 'Legal' | 'Custom')[];
}