import { EditorPlugin } from '@cesdk/cesdk-js';

import {
  PLUGIN_ID,
  PDF_EXPORT_PANEL_ID,
  PDF_SETTINGS_PANEL_ID,
  DEFAULT_PDF_OPTIONS
} from './constants';
import type { PluginConfiguration, PDFConversionOptions } from './types';
import { convertToPDF } from './pdfx';

export { PLUGIN_ID } from './constants';
export type { PluginConfiguration } from './types';

interface PDFMetadata {
  lastExportOptions: PDFConversionOptions;
  exportCount: number;
}

export default (
  configuration: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  const {
    defaultOptions = DEFAULT_PDF_OPTIONS,
    enableUIControls = true,
    allowedFormats = ['A4', 'A3', 'Letter', 'Legal', 'Custom']
  } = configuration;

  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;
    }
  };
};