import { type Color, type RGBAColor } from '@cesdk/engine';

import { EditorPlugin } from '@cesdk/cesdk-js';

import qrcodegen from './lib/qrcodegen';

export const PLUGIN_ID = '@imgly/plugin-qr-code-web';

const GENERATE_QR_PANEL_ID = 'ly.img.generate-qr.panel';
const UPDATE_QR_PANEL_ID = 'ly.img.update-qr.panel';

const METADATA_KEY = 'ly.img.qr';

export interface PluginConfiguration {
}

export default (
  pluginConfiguration: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      console.log('Initializing QR code plugin...');
      if (cesdk == null) return;

      cesdk.ui.addIconSet(
        '@imgly/plugin/qr',
        `
        <svg>
          <symbol
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            id="@imgly/plugin/qr"
          >
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 3H11V11H3V3ZM5 5H9V9H5V5Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 13H11V21H3V13ZM5 15H9V19H5V15Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13 3V11H21V3H13ZM19 5H15V9H19V5Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 13H13V15H15V17H13V21H17V19H19V21H21V19H19V17H21V13H17V15H15V13ZM17 17H15V19H17V17ZM17 17V15H19V17H17Z" fill="currentColor"/>
          </symbol>
        </svg>
      `
      );

      cesdk.setTranslations({
        en: {
          'panel.ly.img.generate-qr.panel': 'Generate QR Code',
          'panel.ly.img.update-qr.panel': 'Update QR Code'
        },
        de: {
          'panel.ly.img.generate-qr.panel': 'QR-Code generieren',
          'panel.ly.img.update-qr.panel': 'QR Code editieren'
        }
      });

      [
        'ly.img.replace',
        'ly.img.crop',
        'ly.img.fill',
        'ly.img.adjustment',
        'ly.img.shape.options'
      ].forEach((key) => {
        cesdk.feature.enable(key, ({ isPreviousEnable, engine }) => {
          const hasQRKind = engine.block.findAllSelected().every((block) => {
            return engine.block.getKind(block) === 'qr';
          });
          if (hasQRKind) return false;
          return isPreviousEnable();
        });
      });

      cesdk.ui.registerComponent('ly.img.generate-qr.dock', ({ builder }) => {
        builder.Button('ly.img.generate-qr.dock', {
          label: 'QR Code',
          icon: '@imgly/plugin/qr',
          onClick: () => {
            cesdk.ui.openPanel(GENERATE_QR_PANEL_ID);
          }
        });
      });

      cesdk.ui.registerComponent(
        'ly.img.update-qr.dock',
        ({ builder, engine }) => {
          const selectedBlocks = engine.block.findAllSelected();
          if (selectedBlocks.length !== 1) return;
          const selectedBlock = selectedBlocks[0];
          const kind = engine.block.getKind(selectedBlock);
          if (kind !== 'qr') return;

          builder.Button('ly.img.update-qr.dock', {
            label: 'Edit',
            icon: '@imgly/plugin/qr',
            onClick: () => {
              cesdk.ui.openPanel(UPDATE_QR_PANEL_ID);
            }
          });
        }
      );

      cesdk.ui.setCanvasMenuOrder([
        'ly.img.update-qr.dock',
        ...cesdk.ui.getCanvasMenuOrder()
      ]);

      cesdk.ui.registerPanel(
        GENERATE_QR_PANEL_ID,
        ({ builder, engine, state }) => {
          const url = state<string>('url', '');
          const color = state<Color>('color', { r: 0, g: 0, b: 0, a: 1 });
          const asShape = state<boolean>('asShape', false);

          builder.Section('ly.img.generate-qr.section', {
            children: () => {
              builder.Text('ly.img.generate-qr.text', {
                content: `Add a URL and we’ll create a QR code for you to add to your design.
              People can scan the QR code to reach the URL.`
              });

              builder.TextInput('ly.img.generate-qr.url', {
                inputLabel: 'URL',
                inputLabelPosition: 'top',
                ...url
              });
              builder.ColorInput('ly.img.generate-qr.foregroundColor', {
                label: 'Foreground Color',
                inputLabel: 'Color',
                inputLabelPosition: 'top',
                ...color
              });
              builder.Checkbox('ly.img.generate-qr.asShape', {
                inputLabel: 'As Shape?',
                ...asShape
              });

              builder.Button('ly.img.generate-qr.generate', {
                label: 'Generate QR Code',
                isDisabled: url.value === '',
                color: 'accent',
                onClick: async () => {
                  // TODO: Generate QR code

                  const code = qrcodegen.QrCode.encodeText(
                    url.value,
                    qrcodegen.QrCode.Ecc.HIGH
                  );

                  let block: number | undefined;
                  if (asShape.value) {
                    const path = toSvgPath(code);
                    block = await engine.asset.defaultApplyAsset({
                      id: 'qr-code',
                      meta: {
                        vectorPath:path ,
                        height: code.size,
                        width: code.size,
                        kind: 'shape',
                        shapeType: '//ly.img.ubq/shape/vector_path',
                      },
                      payload: {}
                    });
                  } else {
                    const svg = toSvgString(
                      code,
                      rgbaToHex(color.value as RGBAColor)
                    );

                    const svgDataURI = `data:text/plain;base64,${btoa(svg)}`;

                    block = await engine.asset.defaultApplyAsset({
                      id: 'qr-code',
                      meta: {
                        kind: 'qr',
                        fillType: '//ly.img.ubq/fill/image',
                        width: code.size,
                        height: code.size
                      },
                      payload: {
                        sourceSet: [
                          {
                            uri: svgDataURI,
                            width: code.size,
                            height: code.size
                          }
                        ]
                      }
                    });
                  }

                  if (block == null) {
                    // TODO: Show error notification
                  } else {
                    engine.block.setMetadata(
                      block,
                      METADATA_KEY,
                      JSON.stringify({ url: url.value, color: color.value })
                    );

                    cesdk.ui.closePanel(GENERATE_QR_PANEL_ID);
                  }
                }
              });
            }
          });
        }
      );

      cesdk.engine.block.onSelectionChanged(() => {
        const selectedBlocks = cesdk.engine.block.findAllSelected();
        if (selectedBlocks.length !== 1) {
          if (cesdk.ui.isPanelOpen(UPDATE_QR_PANEL_ID))
            cesdk.ui.closePanel(UPDATE_QR_PANEL_ID);
          return;
        }
        const selectedBlock = selectedBlocks[0];
        const kind = cesdk.engine.block.getKind(selectedBlock);
        if (kind !== 'qr') {
          if (cesdk.ui.isPanelOpen(UPDATE_QR_PANEL_ID))
            cesdk.ui.closePanel(UPDATE_QR_PANEL_ID);
        }
      });

      cesdk.ui.registerPanel(
        UPDATE_QR_PANEL_ID,
        ({ builder, engine, state }) => {
          const selectedBlocks = engine.block.findAllSelected();
          if (selectedBlocks.length !== 1) {
            // TODO: Show message that only one block can be selected
            return;
          }

          const selectedBlock = selectedBlocks[0];
          const kind = engine.block.getKind(selectedBlock);
          if (kind !== 'qr') {
            // TODO: Show message that only QR codes can be updated
            return;
          }

          if (!engine.block.hasMetadata(selectedBlock, METADATA_KEY)) {
            // TODO: Show message that the selected block has no metadata
            return;
          }

          const metadata = JSON.parse(
            engine.block.getMetadata(selectedBlock, METADATA_KEY)
          );

          builder.Section('ly.img.update-qr.section', {
            children: () => {
              builder.Text('ly.img.update-qr.text', {
                content: `Update the URL and we’ll create a new QR code for you to add to your design.
              People can scan the QR code to reach the URL.`
              });

              builder.TextInput('ly.img.update-qr.url', {
                inputLabel: 'URL',
                inputLabelPosition: 'top',
                value: metadata.url,
                setValue: (value) => {
                  engine.block.setMetadata(
                    selectedBlock,
                    METADATA_KEY,
                    JSON.stringify({ url: value, color: metadata.color })
                  );
                }
              });
              builder.ColorInput('ly.img.generate-qr.foregroundColor', {
                label: 'Foreground Color',
                inputLabel: 'Color',
                inputLabelPosition: 'top',
                value: metadata.color,
                setValue: (value) => {
                  engine.block.setMetadata(
                    selectedBlock,
                    METADATA_KEY,
                    JSON.stringify({ url: metadata.url, color: value })
                  );
                }
              });
            }
          });
        }
      );
    }
  };
};

// Returns a string of SVG code for an image depicting the given QR Code, with the given number
// of border modules. The string always uses Unix newlines (\n), regardless of the platform.
function toSvgString(qr: qrcodegen.QrCode, darkColor: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${qr.size} ${
    qr.size
  }" stroke="none">
	<path d="${toSvgPath(qr)}" fill="${darkColor}"/>
</svg>
`;
}

function toSvgPath(qr: qrcodegen.QrCode) {
  const parts: Array<string> = [];
  for (let y = 0; y < qr.size; y++) {
    for (let x = 0; x < qr.size; x++) {
      if (qr.getModule(x, y)) parts.push(`M${x},${y}h1v1h-1z`);
    }
  }

  return parts.join(' ');
}

export const rgbaToHex = (rgba: RGBAColor, includeAlpha = false): string => {
  const { r, g, b, a } = rgba;
  const rByte = Math.round(255 * r);
  const gByte = Math.round(255 * g);
  const bByte = Math.round(255 * b);
  const aByte = Math.round(255 * a);
  const byteToHex = (byte: number) => {
    return byte.toString(16).padStart(2, '0');
  };
  return `#${byteToHex(rByte)}${byteToHex(gByte)}${byteToHex(bByte)}${
    includeAlpha ? byteToHex(aByte) : ''
  }`;
};
