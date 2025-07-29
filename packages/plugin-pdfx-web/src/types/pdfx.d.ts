export type PDFXVersion = 'PDF/X-1a' | 'PDF/X-3' | 'PDF/X-4';

export type RenderingIntent = 
  | 'perceptual' 
  | 'relative-colorimetric' 
  | 'saturation' 
  | 'absolute-colorimetric';

export type ColorSpace = 'RGB' | 'CMYK';

export interface OutputCondition {
  identifier: string;
  condition: string;
  registry: string;
  info: string;
}

export interface PDFX3Options {
  version?: PDFXVersion;
  colorSpace?: ColorSpace;
  iccProfile?: Blob;
  iccProfilePath?: string;
  renderingIntent?: RenderingIntent;
  outputCondition?: string | OutputCondition;
  preserveBlack?: boolean;
  preserveOverprint?: boolean;
  title?: string;
  creator?: string;
  subject?: string;
  keywords?: string[];
  trapped?: boolean;
  bleedBox?: [number, number, number, number];
  trimBox?: [number, number, number, number];
}

export interface PDFConversionOptions {
  mimeType?: string;
  pdfx3?: PDFX3Options;
}

export interface ConversionMetadata {
  originalSize: number;
  convertedSize: number;
  conversionTime: number;
  compressionRatio: number;
  pdfxVersion: string;
  outputCondition: string;
  isCompliant: boolean;
}

export interface ConversionResult {
  blob: Blob;
  metadata: ConversionMetadata;
}

export type ConversionStage = 'initializing' | 'validating' | 'converting' | 'verifying' | 'completed';

export interface ConversionProgress {
  stage: ConversionStage;
  progress: number; // 0-100
  message: string;
}