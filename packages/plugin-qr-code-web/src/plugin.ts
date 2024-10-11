import type CreativeEngine from '@cesdk/engine';
import { type Color } from '@cesdk/engine';

import CreativeEditorSDK, { EditorPlugin } from '@cesdk/cesdk-js';

import { Metadata, hexToRgba, rgbaToHex } from '@imgly/plugin-utils';

import { generateQr } from './qr';

export const PLUGIN_ID = '@imgly/plugin-qr-code-web';

const GENERATE_QR_PANEL_ID = '//ly.img.panel/generate-qr';
const UPDATE_QR_PANEL_ID = '//ly.img.panel/update-qr';

interface QrMetadata {
  url: string;
  color: string;
}

export interface PluginConfiguration {
  createdBlockType?: 'fill' | 'shape';
  addCheckboxForCreatedBlockType?: boolean;
}

export default (
  configuration: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  const { createdBlockType = 'shape', addCheckboxForCreatedBlockType = true } =
    configuration || {};

  return {
    initialize({ cesdk }) {
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
          [`panel.${GENERATE_QR_PANEL_ID}`]: 'Generate QR Code',
          [`panel.${UPDATE_QR_PANEL_ID}`]: 'Update QR Code'
        },
        de: {
          [`panel.${GENERATE_QR_PANEL_ID}`]: 'QR-Code generieren',
          [`panel.${UPDATE_QR_PANEL_ID}`]: 'QR Code editieren'
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
            return engine.block.getKind(block) === 'qr-fill';
          });
          if (hasQRKind) return false;
          return isPreviousEnable();
        });
      });

      cesdk.ui.registerComponent('ly.img.generate-qr.dock', ({ builder }) => {
        const isOpen = cesdk.ui.isPanelOpen(GENERATE_QR_PANEL_ID);
        builder.Button('ly.img.generate-qr.dock', {
          label: 'QR Code',
          icon: '@imgly/plugin/qr',
          isSelected: isOpen,
          onClick: () => {
            if (isOpen) {
              cesdk.ui.closePanel(GENERATE_QR_PANEL_ID);
            } else {
              cesdk.ui.openPanel(GENERATE_QR_PANEL_ID);
            }
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
          if (kind !== 'qr-fill' && kind !== 'qr-shape') return;

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
          const metadata = new Metadata<QrMetadata>(engine, PLUGIN_ID);

          const url = state<string>('url', '');
          const color = state<Color>('color', { r: 0, g: 0, b: 0, a: 1 });
          const asShape = state<boolean>(
            'asShape',
            createdBlockType === 'shape'
          );

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

              builder.Button('ly.img.generate-qr.generate', {
                label: 'Generate QR Code',
                isDisabled: url.value === '',
                color: 'accent',
                onClick: async () => {
                  const block = await createQRBlock(
                    cesdk,
                    engine,
                    url.value,
                    color.value,
                    metadata,
                    asShape.value
                  );
                  if (block != null) {
                    cesdk.ui.closePanel(GENERATE_QR_PANEL_ID);
                  }
                }
              });

              if (addCheckboxForCreatedBlockType) {
                builder.Checkbox('ly.img.generate-qr.asShape', {
                  inputLabel: 'As Shape?',
                  ...asShape
                });
              }
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

      cesdk.ui.registerPanel(UPDATE_QR_PANEL_ID, ({ builder, engine }) => {
        const metadata = new Metadata<QrMetadata>(engine, PLUGIN_ID);

        const selectedBlocks = engine.block.findAllSelected();
        if (selectedBlocks.length !== 1) {
          builder.Text('ly.img.update-qr.only-one-block', {
            content: 'Please select only one block to update the QR code.'
          });
          return;
        }

        const selectedBlock = selectedBlocks[0];
        const kind = engine.block.getKind(selectedBlock);
        if (kind !== 'qr-fill' && kind !== 'qr-shape') {
          builder.Text('ly.img.update-qr.only-qr-blocks', {
            content: 'Only QR code blocks can be updated.'
          });
          return;
        }

        if (!metadata.hasData(selectedBlock)) {
          builder.Text('ly.img.update-qr.no-metadata', {
            content: 'Invalid QR code block selected. Missing metadata.'
          });
          return;
        }

        const { url, color } = metadata.get(selectedBlock) as QrMetadata;

        builder.Section('ly.img.update-qr.section', {
          children: () => {
            builder.Text('ly.img.update-qr.text', {
              content: `Update the URL and we’ll create a new QR code for you to add to your design.
              People can scan the QR code to reach the URL.`
            });

            builder.TextInput('ly.img.update-qr.url', {
              inputLabel: 'URL',
              inputLabelPosition: 'top',
              value: url,
              setValue: (value) => {
                updateQR(cesdk, engine, selectedBlock, value, color);
                metadata.set(selectedBlock, {
                  url: value,
                  color
                });
              }
            });

            if (kind === 'qr-fill') {
              builder.ColorInput('ly.img.generate-qr.foregroundColor', {
                label: 'Foreground Color',
                inputLabel: 'Color',
                inputLabelPosition: 'top',
                value: hexToRgba(color),
                setValue: (value) => {
                  const colorAsHex = hexify(engine, value);
                  updateQR(cesdk, engine, selectedBlock, url, colorAsHex);

                  metadata.set(selectedBlock, {
                    url,
                    color: colorAsHex
                  });
                }
              });
            }
          }
        });
      });
    }
  };
};

function hexify(engine: CreativeEngine, color: Color | string) {
  const isColorString = typeof color === 'string';

  let colorAsHex;
  if (isColorString) {
    colorAsHex = color;
  } else {
    const colorAsRgba = engine.editor.convertColorToColorSpace(color, 'sRGB');
    colorAsHex = rgbaToHex(colorAsRgba);
  }

  return colorAsHex;
}

async function createQRBlock(
  cesdk: CreativeEditorSDK,
  engine: CreativeEngine,
  url: string,
  color: Color,
  metadata: Metadata<QrMetadata>,
  asShape: boolean
): Promise<number | undefined> {
  const colorAsRgba = engine.editor.convertColorToColorSpace(color, 'sRGB');
  const colorAsHex = rgbaToHex(colorAsRgba);
  const { path, svg, size } = generateQr(url, colorAsHex);

  let block: number | undefined;
  if (asShape) {
    block = await engine.asset.defaultApplyAsset({
      id: 'qr-code',
      meta: {
        vectorPath: path,
        height: size,
        width: size,
        kind: 'qr-shape',
        shapeType: '//ly.img.ubq/shape/vector_path'
      },
      payload: {}
    });
  } else {
    const svgDataURI = `data:text/plain;base64,${btoa(svg)}`;

    block = await engine.asset.defaultApplyAsset({
      id: 'qr-code',
      meta: {
        kind: 'qr-fill',
        fillType: '//ly.img.ubq/fill/image',
        width: size,
        height: size
      },
      payload: {
        sourceSet: [
          {
            uri: svgDataURI,
            width: size,
            height: size
          }
        ]
      }
    });
  }

  if (block == null) {
    cesdk.ui.showNotification({
      type: 'error',
      message: 'Failed to create QR code block.'
    });
  } else {
    metadata.set(block, { url, color: colorAsHex });
  }
  return block;
}

function updateQR(
  cesdk: CreativeEditorSDK,
  engine: CreativeEngine,
  block: number,
  url: string,
  color: string
) {
  const { path, svg, size } = generateQr(url, color);
  const kind = engine.block.getKind(block);

  if (kind === 'qr-shape') {
    if (!engine.block.supportsShape(block)) {
      cesdk.ui.showNotification({
        type: 'error',
        message: 'Invalid state with no shape found.'
      });
      return;
    }

    const shape = engine.block.getShape(block);
    engine.block.setString(shape, 'shape/vector_path/path', path);
    engine.block.setFloat(shape, 'shape/vector_path/height', size);
    engine.block.setFloat(shape, 'shape/vector_path/width', size);
  } else if (kind === 'qr-fill') {
    if (!engine.block.supportsFill(block)) {
      cesdk.ui.showNotification({
        type: 'error',
        message: 'Invalid state with no fill found.'
      });
      return;
    }
    const fill = engine.block.getFill(block);

    const svgDataURI = `data:text/plain;base64,${btoa(svg)}`;

    engine.block.setSourceSet(fill, 'fill/image/sourceSet', [
      {
        uri: svgDataURI,
        width: size,
        height: size
      }
    ]);
  }
}
