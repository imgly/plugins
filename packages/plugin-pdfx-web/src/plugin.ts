import { EditorPlugin } from '@cesdk/cesdk-js';

import { convertToPDF } from './pdfx';
import { getDefaultCMYKProfile } from './assets/default-cmyk-profile';
import type { PluginConfiguration } from './types';

export { PLUGIN_ID } from './constants';
export type { PluginConfiguration } from './types';

export default (
  config: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      cesdk.ui.registerComponent('pdfx.export', ({ builder, engine }) => {
        builder.Dropdown('pdf.export.dropdown', {
          label: 'Export for Print',
          color: 'accent',
          icon: '@imgly/Download',
          
          children: () => [
            builder.Button('pdf.export.button', {
              icon: '@imgly/Download',
              label: 'PDF/X-3 (PSOCoated v3)',
              onClick: async () => {
              try {
                const sceneId = engine.scene.get();
                if (sceneId == null) {
                  return;
                }

                // Export as PDF using CE.SDK
                const pdfBlob = await engine.block.export(
                  sceneId,
                  'application/pdf' as any
                );

                // Use provided ICC profile or fallback to default
                const iccProfile = config.iccProfile || getDefaultCMYKProfile();

                // Convert to PDF/X-3 using our plugin
                const convertedBlobs = await convertToPDF([pdfBlob], { iccProfile });

                // We can safely assume that the conversion will return at most one
                // blob, as pages get consolidated into a single PDF during the initial export.
                const convertedBlob = convertedBlobs[0];

                // Trigger download
                const url = URL.createObjectURL(convertedBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `design-pdfx3-${Date.now()}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (error) {
                cesdk.ui.showNotification({
                  type: 'error',
                  message: 'Failed to export PDF/X. Please try again.',
                });
              }
              },
            }),
            builder.Button('pdf.export.button.no-icc', {
              icon: '@imgly/Download',
              label: 'PDF/X-3 (No ICC Profile)',
              onClick: async () => {
              try {
                const sceneId = engine.scene.get();
                if (sceneId == null) {
                  return;
                }

                // Export as PDF using CE.SDK
                const pdfBlob = await engine.block.export(
                  sceneId,
                  'application/pdf' as any
                );

                // Convert to PDF/X-3 without ICC profile
                const convertedBlobs = await convertToPDF([pdfBlob], {});

                // We can safely assume that the conversion will return at most one
                // blob, as pages get consolidated into a single PDF during the initial export.
                const convertedBlob = convertedBlobs[0];

                // Trigger download
                const url = URL.createObjectURL(convertedBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `design-pdfx3-no-icc-${Date.now()}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (error) {
                cesdk.ui.showNotification({
                  type: 'error',
                  message: 'Failed to export PDF/X. Please try again.',
                });
              }
              },
            }),
            builder.Button('pdf.export.button.device-cmyk', {
              icon: '@imgly/Download',
              label: 'PDF/X-3 (Device CMYK)',
              onClick: async () => {
              try {
                const sceneId = engine.scene.get();
                if (sceneId == null) {
                  return;
                }

                // Export as PDF using CE.SDK
                const pdfBlob = await engine.block.export(
                  sceneId,
                  'application/pdf' as any
                );

                // Convert with device CMYK - no color management
                const convertedBlobs = await convertToPDF([pdfBlob], {
                  colorConversionStrategy: 'CMYK',
                  overrideICC: false,
                  preserveBlack: true
                });

                const convertedBlob = convertedBlobs[0];

                // Trigger download
                const url = URL.createObjectURL(convertedBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `design-pdfx3-device-cmyk-${Date.now()}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (error) {
                cesdk.ui.showNotification({
                  type: 'error',
                  message: 'Failed to export PDF/X. Please try again.',
                });
              }
              },
            }),
            builder.Button('pdf.export.button.ucr-gcr', {
              icon: '@imgly/Download',
              label: 'PDF/X-3 (High GCR/UCR)',
              onClick: async () => {
              try {
                const sceneId = engine.scene.get();
                if (sceneId == null) {
                  return;
                }

                // Export as PDF using CE.SDK
                const pdfBlob = await engine.block.export(
                  sceneId,
                  'application/pdf' as any
                );

                // Convert with high black generation and under color removal
                const convertedBlobs = await convertToPDF([pdfBlob], {
                  blackGeneration: 'High',
                  underColorRemoval: 'High',
                  preserveBlack: true
                });

                const convertedBlob = convertedBlobs[0];

                // Trigger download
                const url = URL.createObjectURL(convertedBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `design-pdfx3-high-gcr-${Date.now()}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (error) {
                cesdk.ui.showNotification({
                  type: 'error',
                  message: 'Failed to export PDF/X. Please try again.',
                });
              }
              },
            }),
            builder.Button('pdf.export.button.leave-unchanged', {
              icon: '@imgly/Download',
              label: 'PDF/X-3 (Leave Color Unchanged)',
              onClick: async () => {
              try {
                const sceneId = engine.scene.get();
                if (sceneId == null) {
                  return;
                }

                // Export as PDF using CE.SDK
                const pdfBlob = await engine.block.export(
                  sceneId,
                  'application/pdf' as any
                );

                // Convert with LeaveColorUnchanged strategy
                const convertedBlobs = await convertToPDF([pdfBlob], {
                  colorConversionStrategy: 'LeaveColorUnchanged'
                });

                const convertedBlob = convertedBlobs[0];

                // Trigger download
                const url = URL.createObjectURL(convertedBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `design-pdfx3-unchanged-${Date.now()}.pdf`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
              } catch (error) {
                cesdk.ui.showNotification({
                  type: 'error',
                  message: 'Failed to export PDF/X. Please try again.',
                });
              }
              },
            })
          ]
        });
      });
    },
  };
};
