export interface PDFX3Options {
  // Required
  outputProfile: 'gracol' | 'fogra39' | 'srgb' | 'custom';
  customProfile?: Blob;        // Only if outputProfile is 'custom'

  // Optional (with sensible defaults)
  title?: string;                        // Document title (default: use existing)
  outputConditionIdentifier?: string;    // OutputIntent identifier (e.g., "FOGRA39")
  outputCondition?: string;              // Human-readable condition description
}
