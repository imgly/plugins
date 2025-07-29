import { EditorPlugin } from '@cesdk/cesdk-js';

import { convertToPDF } from './pdfx';

export { PLUGIN_ID } from './constants';

export default (): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      cesdk.ui.registerComponent('pdfx.export', ({ builder, engine }) => {
        builder.Button('pdf.export.button', {
          icon: '@imgly/Download',
          color: 'accent',
          size: 'large',
          label: 'Export to PDF/X',
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

              // Convert to PDF/X-3 using our plugin
              // Note: This requires an ICC profile to be configured
              const convertedBlobs = await convertToPDF([pdfBlob]);

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
        });
      });
    },
  };
};
