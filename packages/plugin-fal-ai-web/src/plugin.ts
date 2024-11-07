import CreativeEditorSDK, { EditorPlugin } from '@cesdk/cesdk-js';
import type CreativeEngine from '@cesdk/engine';
import { type RGBAColor } from '@cesdk/engine';
import { fal } from '@fal-ai/client';

import { Metadata } from '@imgly/plugin-utils';

export const PLUGIN_ID = '@imgly/plugin-fal-ai-web';

const FAL_AI_PANEL_ID = '//ly.img.panel/fal.ai';

const IMAGE_SIZES: { id: string; label: string | string[] }[] = [
  { id: 'square_hd', label: 'Square HD' },
  { id: 'square', label: 'Square' },
  { id: 'portrait_4_3', label: 'Portrait 4:3' },
  { id: 'portrait_16_9', label: 'Portrait 16:9' },
  { id: 'landscape_4_3', label: 'Landscape 4:3' },
  { id: 'landscape_16_9', label: 'Landscape 16:9' },
  { id: 'custom', label: 'Custom' }
];

const ImageSizeEnumToSize: Record<string, { width: number; height: number }> = {
  square_hd: { width: 1024, height: 1024 },
  square: { width: 512, height: 512 },
  portrait_4_3: { width: 768, height: 1024 },
  portrait_16_9: { width: 720, height: 1280 },
  landscape_4_3: { width: 1024, height: 768 },
  landscape_16_9: { width: 1280, height: 720 }
};

// prettier-ignore
const STYLES: { id: string; label: string | string[] }[] = [
  { id: 'any', label: 'Any' },
  { id: 'realistic_image', label: 'Realistic Image' },
  { id: 'digital_illustration', label: 'Digital Illustration' },
  { id: 'vector_illustration', label: 'Vector Illustration' },
  { id: 'realistic_image/b_and_w', label: 'Realistic Image: Black & White' },
  { id: 'realistic_image/hard_flash', label: 'Realistic Image: Hard Flash' },
  { id: 'realistic_image/hdr', label: 'Realistic Image: HDR' },
  { id: 'realistic_image/natural_light', label: 'Realistic Image: Natural Light' },
  { id: 'realistic_image/studio_portrait', label: 'Realistic Image: Studio Portrait' },
  { id: 'realistic_image/enterprise', label: 'Realistic Image: Enterprise' },
  { id: 'realistic_image/motion_blur', label: 'Realistic Image: Motion Blur' },
  { id: 'digital_illustration/pixel_art', label: 'Digital Illustration: Pixel Art' },
  { id: 'digital_illustration/hand_drawn', label: 'Digital Illustration: Hand Drawn' },
  { id: 'digital_illustration/grain', label: 'Digital Illustration: Grain' },
  { id: 'digital_illustration/infantile_sketch', label: 'Digital Illustration: Infantile Sketch' },
  { id: 'digital_illustration/2d_art_poster', label: 'Digital Illustration: 2D Art Poster' },
  { id: 'digital_illustration/handmade_3d', label: 'Digital Illustration: Handmade 3D' },
  { id: 'digital_illustration/hand_drawn_outline', label: 'Digital Illustration: Hand Drawn Outline' },
  { id: 'digital_illustration/engraving_color', label: 'Digital Illustration: Engraving Color' },
  { id: 'digital_illustration/2d_art_poster_2', label: 'Digital Illustration: 2D Art Poster 2' },
  { id: 'vector_illustration/engraving', label: 'Vector Illustration: Engraving' },
  { id: 'vector_illustration/line_art', label: 'Vector Illustration: Line Art' },
  { id: 'vector_illustration/line_circuit', label: 'Vector Illustration: Line Circuit' },
  { id: 'vector_illustration/linocut', label: 'Vector Illustration: Linocut' },
];

interface FalAiMetadata {
  prompt: string;
}

export interface PluginConfiguration {}

async function createFalAiBlock(
  cesdk: CreativeEditorSDK,
  engine: CreativeEngine,
  prompt: string,
  metadata: Metadata<FalAiMetadata>
): Promise<number | undefined> {
  const width = 1024;
  const height = 1024;

  const result: any = await fal.subscribe('fal-ai/recraft-v3', {
    input: {
      prompt,
      image_size: 'square'
    },
    logs: true,
    onQueueUpdate: (update) => {
      if (update.status === 'IN_PROGRESS') {
        console.log('In progress...', update);
      }
    }
  });

  const url = result.data.images[0].url;
  const block = await engine.asset.defaultApplyAsset({
    id: 'fal.ai',
    meta: {
      fillType: '//ly.img.ubq/fill/image',
      width,
      height
    },
    payload: {
      sourceSet: [
        {
          uri: url,
          width,
          height
        }
      ]
    }
  });

  if (block == null) {
    cesdk.ui.showNotification({
      type: 'error',
      message: 'Failed to create fal.ai block.'
    });
  } else {
    metadata.set(block, {
      prompt
    });
  }
  return block;
}

export default (
  _configuration: PluginConfiguration = {}
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    initialize({ cesdk }) {
      if (cesdk == null) return;

      fal.config({
        proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
      });

      cesdk.setTranslations({
        en: {
          [`panel.${FAL_AI_PANEL_ID}`]: 'fal.ai'
        }
      });

      const metadata = new Metadata<FalAiMetadata>(cesdk.engine, PLUGIN_ID);

      cesdk.ui.addIconSet(
        '@imgly/plugin/fal-ai',
        `
        <svg>
          <symbol
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 170 171"
            id="@imgly/plugin/fal-ai"
          >
<path fill-rule="evenodd" clip-rule="evenodd" d="M109.571 0.690002C112.515 0.690002 114.874 3.08348 115.155 6.01352C117.665 32.149 138.466 52.948 164.603 55.458C167.534 55.7394 169.927 58.0985 169.927 61.042V110.255C169.927 113.198 167.534 115.557 164.603 115.839C138.466 118.349 117.665 139.148 115.155 165.283C114.874 168.213 112.515 170.607 109.571 170.607H60.3553C57.4116 170.607 55.0524 168.213 54.7709 165.283C52.2608 139.148 31.4601 118.349 5.32289 115.839C2.39266 115.557 -0.000976562 113.198 -0.000976562 110.255V61.042C-0.000976562 58.0985 2.39267 55.7394 5.3229 55.458C31.4601 52.948 52.2608 32.149 54.7709 6.01351C55.0524 3.08348 57.4116 0.690002 60.3553 0.690002H109.571ZM34.1182 85.5045C34.1182 113.776 57.0124 136.694 85.2539 136.694C113.495 136.694 136.39 113.776 136.39 85.5045C136.39 57.2332 113.495 34.3147 85.2539 34.3147C57.0124 34.3147 34.1182 57.2332 34.1182 85.5045Z" fill="currentColor"/>
          </symbol>
        </svg>
      `
      );

      cesdk.ui.registerComponent('ly.img.fal-ai.dock', ({ builder }) => {
        const isOpen = cesdk.ui.isPanelOpen(FAL_AI_PANEL_ID);
        builder.Button('ly.img.fal-ai.dock', {
          label: 'fal.ai',
          icon: '@imgly/plugin/fal-ai',
          isSelected: isOpen,
          onClick: () => {
            if (isOpen) {
              cesdk.ui.closePanel(FAL_AI_PANEL_ID);
            } else {
              cesdk.ui.openPanel(FAL_AI_PANEL_ID);
            }
          }
        });
      });

      cesdk.ui.registerPanel(FAL_AI_PANEL_ID, ({ builder, engine, state }) => {
        const prompt = state<string>('prompt', '');
        const image_size = state('image_size', IMAGE_SIZES[0]);
        const customWidth = state<number>('width', 1024);
        const customHeight = state<number>('height', 1024);
        const style = state('style', STYLES[0]);
        const preferrableColors = state<{ r: number; g: number; b: number }[]>(
          'preferrableColors',
          []
        );

        const generating = state<boolean>('generating', false);

        builder.Section('ly.img.fal-ai.inputs.section', {
          children: () => {
            builder.TextArea('ly.img.fal-ai.prompt', {
              inputLabel: 'Prompt',
              ...prompt
            });
          }
        });

        builder.Section('ly.img.fal-ai.parameter.section', {
          children: () => {
            builder.Select('ly.img.fal-ai.style', {
              inputLabel: 'Style',
              inputLabelPosition: 'top',
              ...style,
              values: Array.from(STYLES)
            });

            builder.Select('ly.img.fal-ai.image_size', {
              ...image_size,
              values: Array.from(IMAGE_SIZES)
            });

            if (image_size.value.id === 'custom') {
              builder.NumberInput('ly.img.fal-ai.width', {
                inputLabel: 'Width',
                ...customWidth
              });

              builder.NumberInput('ly.img.fal-ai.height', {
                inputLabel: 'Height',
                ...customHeight
              });
            }
          }
        });

        builder.Section('ly.img.fal-ai.colors.section', {
          title: 'Preferrable Colors',
          children: () => {
            preferrableColors.value.forEach((color, index) => {
              builder.ColorInput(`ly.img.fal-ai.color.${index}`, {
                value: { ...color, a: 1 },
                setValue: (value) => {
                  let rgb: { r: number; g: number; b: number } | null = null;

                  if (isRGBAColor(value)) {
                    rgb = {
                      r: value.r,
                      g: value.g,
                      b: value.b
                    };
                  }

                  if (rgb == null) return;

                  preferrableColors.setValue([
                    ...preferrableColors.value.slice(0, index),
                    { r: rgb.r, g: rgb.g, b: rgb.b },
                    ...preferrableColors.value.slice(index + 1)
                  ]);
                }
              });
            });
            builder.Button('ly.img.fal-ai.addColor', {
              label: 'Add Color',
              onClick: () => {
                preferrableColors.setValue([
                  ...preferrableColors.value,
                  { r: 0, g: 0, b: 0 }
                ]);
              }
            });
          }
        });

        builder.Section('ly.img.fal-ai.button.section', {
          children: () => {
            builder.Button('ly.img.fal-ai.generate', {
              label: 'Generate',
              isDisabled: prompt.value === '',
              isLoading: generating.value,
              color: 'accent',
              onClick: async () => {
                generating.setValue(true);
                await generate(
                  engine,
                  prompt.value,
                  style.value.id,
                  image_size.value.id,
                  customWidth.value,
                  customHeight.value,
                  preferrableColors.value
                );

                generating.setValue(false);
              }
            });
          }
        });
      });
    }
  };
};

async function generate(
  engine: CreativeEngine,
  prompt: string,
  style: string,
  imageSize: string,
  width: number,
  height: number,
  preferrableColors: { r: number; g: number; b: number }[]
): Promise<number | undefined> {
  const currentWidth =
    imageSize === 'custom' ? width : ImageSizeEnumToSize[imageSize]?.width;
  const currentHeight =
    imageSize === 'custom' ? height : ImageSizeEnumToSize[imageSize]?.height;

  const block = await createBlock(engine, {
    width: currentWidth,
    height: currentHeight
  });

  // TODO: Show error message if block is undefined
  if (block == null) return;

  const fillId = engine.block.getFill(block);
  engine.block.setState(fillId, {
    type: 'Pending',
    progress: 0
  });

  const input = {

      prompt,
      style,
      image_size:
        imageSize === 'custom'
          ? { width: currentWidth, height: currentHeight }
          : imageSize,
      colors: preferrableColors.map((color) => {
        return {
          r: Math.round(color.r * 255),
          g: Math.round(color.g * 255),
          b: Math.round(color.b * 255)
        };
      })
  };

  const result: any = await fal.subscribe('fal-ai/recraft-v3', {
    input,
    logs: true
  });

  const url = result.data.images[0].url;

  if (engine.block.isValid(fillId)) {
    engine.block.setState(fillId, { type: 'Ready' });
    engine.block.addImageFileURIToSourceSet(
      fillId,
      'fill/image/sourceSet',
      url
    );
  }

  // TODO set metadata

  return block;
}

async function createBlock(
  engine: CreativeEngine,
  parameter: {
    url?: string;
    width: number;
    height: number;
  }
): Promise<number | undefined> {
  const { url, width, height } = parameter;

  const block = await engine.asset.defaultApplyAsset({
    id: 'fal.ai',
    meta: {
      fillType: '//ly.img.ubq/fill/image',
      width,
      height
    },
    payload: {
      sourceSet:
        url != null
          ? [
              {
                uri: url,
                width,
                height
              }
            ]
          : []
    }
  });

  return block;
}

function isRGBAColor(color: Color): color is RGBAColor {
  return (
    'r' in color &&
    'a' in color &&
    color.r !== undefined &&
    color.a !== undefined
  );
}
