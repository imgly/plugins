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
  type: 'fill' | 'shape';
}

export interface PluginConfiguration {
  createdBlockType?: 'fill' | 'shape';
  addCheckboxForCreatedBlockType?: boolean;
}

export default (
  configuration: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  const { createdBlockType = 'shape', addCheckboxForCreatedBlockType = false } =
    configuration || {};

  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      const metadata = new Metadata<QrMetadata>(cesdk.engine, PLUGIN_ID);

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
          [`panel.${GENERATE_QR_PANEL_ID}.description`]:
            'Enter a URL to automatically generate a QR code for you to embed it in your design.',
          [`panel.${UPDATE_QR_PANEL_ID}`]: 'Update QR Code',
          [`panel.${UPDATE_QR_PANEL_ID}.description`]:
            'Update the URL to automatically refresh the QR code within your design.',

          [`panel.${UPDATE_QR_PANEL_ID}.asShape`]: 'As Shape?'
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
          const hasQRFill = engine.block.findAllSelected().every((block) => {
            if (!metadata.hasData(block)) return false;
            return metadata.get(block)?.type === 'fill';
          });
          if (hasQRFill) return false;
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
        'ly.img.update-qr.canvasMenu',
        ({ builder, engine }) => {
          const selectedBlocks = engine.block.findAllSelected();
          if (selectedBlocks.length !== 1) return;
          const selectedBlock = selectedBlocks[0];

          const canEdit = engine.block.isAllowedByScope(
            selectedBlock,
            'fill/change'
          );

          if (!canEdit) return;

          if (!metadata.hasData(selectedBlock)) return;

          builder.Button('ly.img.update-qr.dock', {
            label: 'common.edit',
            icon: '@imgly/plugin/qr',
            onClick: () => {
              cesdk.ui.openPanel(UPDATE_QR_PANEL_ID);
            }
          });
        }
      );

      cesdk.ui.setCanvasMenuOrder([
        'ly.img.update-qr.canvasMenu',
        ...cesdk.ui.getCanvasMenuOrder()
      ]);

      cesdk.ui.registerPanel(
        GENERATE_QR_PANEL_ID,
        ({ builder, engine, state }) => {
          const url = state<string>('url', '');
          const color = state<Color>('color', { r: 0, g: 0, b: 0, a: 1 });
          const asShape = state<boolean>(
            'asShape',
            createdBlockType === 'shape'
          );

          builder.Section('ly.img.generate-qr.section', {
            children: () => {
              builder.Text('ly.img.generate-qr.text', {
                content: `panel.${GENERATE_QR_PANEL_ID}.description`
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
                  inputLabel: `panel.${UPDATE_QR_PANEL_ID}.asShape`,
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
        if (!metadata.hasData(selectedBlock)) {
          if (cesdk.ui.isPanelOpen(UPDATE_QR_PANEL_ID))
            cesdk.ui.closePanel(UPDATE_QR_PANEL_ID);
        }
      });

      cesdk.ui.registerPanel(UPDATE_QR_PANEL_ID, ({ builder, engine }) => {
        const selectedBlocks = engine.block.findAllSelected();
        if (selectedBlocks.length !== 1) {
          builder.Section('ly.img.update-qr.only-one-block.section', {
            children: () => {
              builder.Text('ly.img.update-qr.only-one-block', {
                content: 'Please select only one block to update the QR code.'
              });
            }
          });
          return;
        }

        const selectedBlock = selectedBlocks[0];
        if (!metadata.hasData(selectedBlock)) {
          builder.Section('ly.img.update-qr.no-metadata.section', {
            children: () => {
              builder.Text('ly.img.update-qr.no-metadata', {
                content: 'Invalid QR code block selected. Missing metadata.'
              });
            }
          });
          return;
        }

        const { url, color, type } = metadata.get(selectedBlock) as QrMetadata;

        builder.Section('ly.img.update-qr.section', {
          children: () => {
            builder.Text('ly.img.update-qr.text', {
              content: `panel.${UPDATE_QR_PANEL_ID}.description`
            });

            builder.TextInput('ly.img.update-qr.url', {
              inputLabel: 'URL',
              inputLabelPosition: 'top',
              value: url,
              setValue: (value) => {
                metadata.set(selectedBlock, {
                  url: value,
                  color,
                  type
                });

                updateQR(cesdk, engine, selectedBlock, value, color, type);
              }
            });

            if (type === 'fill') {
              builder.ColorInput('ly.img.generate-qr.foregroundColor', {
                inputLabel: 'common.color',
                inputLabelPosition: 'top',
                value: hexToRgba(color),
                setValue: (value) => {
                  const colorAsHex = hexify(engine, value);
                  metadata.set(selectedBlock, {
                    url,
                    color: colorAsHex,
                    type
                  });

                  updateQR(cesdk, engine, selectedBlock, url, colorAsHex, type);
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
        kind: 'shape',
        vectorPath: path,
        height: size,
        width: size,
        shapeType: '//ly.img.ubq/shape/vector_path'
      },
      payload: {}
    });

    if (block != null) {
      // Set the fill color
      if (engine.block.supportsFill(block)) {
        const fill = engine.block.getFill(block);
        const fillType = engine.block.getType(fill);
        if (fillType === '//ly.img.ubq/fill/color') {
          engine.block.setColor(fill, 'fill/color/value', colorAsRgba);
        }
      }

      simplifyShape(engine, block);
    }
  } else {
    const svgDataURI = `data:text/plain;base64,${btoa(svg)}`;

    block = await engine.asset.defaultApplyAsset({
      id: 'qr-code',
      meta: {
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
    metadata.set(block, {
      url,
      color: colorAsHex,
      type: asShape ? 'shape' : 'fill'
    });
  }
  return block;
}

function updateQR(
  cesdk: CreativeEditorSDK,
  engine: CreativeEngine,
  block: number,
  url: string,
  color: string,
  type: 'fill' | 'shape'
) {
  const { path, svg, size } = generateQr(url, color);

  if (type === 'shape') {
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
    simplifyShape(engine, block);
  } else if (type === 'fill') {
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

function simplifyShape(engine: CreativeEngine, block: number): number {
  // Simplify the shape by intersecting with a rect shape
  const duplicate = engine.block.duplicate(block);
  const parent = engine.block.getParent(block);
  if (parent != null) {
    const rect = engine.block.create('graphic');
    engine.block.setShape(
      rect,
      engine.block.createShape('//ly.img.ubq/shape/rect')
    );
    engine.block.appendChild(parent, rect);
    engine.block.setPositionX(rect, engine.block.getPositionX(block));
    engine.block.setPositionY(rect, engine.block.getPositionY(block));
    engine.block.setWidth(rect, engine.block.getWidth(block));
    engine.block.setHeight(rect, engine.block.getHeight(block));

    const newBlock = engine.block.combine([duplicate, rect], 'Intersection');
    engine.block.setShape(block, engine.block.getShape(newBlock));
    engine.block.destroy(newBlock);
  }

  return block;
}
