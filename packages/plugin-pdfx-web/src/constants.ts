export const PLUGIN_ID = '@imgly/plugin-pdfx-web';

export const PDF_EXPORT_PANEL_ID = '//ly.img.panel/pdf-export';
export const PDF_SETTINGS_PANEL_ID = '//ly.img.panel/pdf-settings';

export const DEFAULT_PDF_OPTIONS = {
  format: 'A4' as const,
  orientation: 'portrait' as const,
  quality: 90,
  includeMetadata: true,
  preserveEditability: false
};