// Import all types from the types directory
export * from './types/pdfx';

// Plugin configuration
export interface PluginConfiguration {
  iccProfile?: Blob; // Direct ICC profile blob to use for conversion
}
