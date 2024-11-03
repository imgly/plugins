import CreativeEditorSDK, { EditorPlugin } from '@cesdk/cesdk-js';
import type CreativeEngine from '@cesdk/engine';
import { fal } from '@fal-ai/client';

import { Metadata } from '@imgly/plugin-utils';

export const PLUGIN_ID = '@imgly/plugin-fal-ai-web';

const GENERATE_PANEL_ID = '//ly.img.panel/generate-fal.ai';
const UPDATE_PANEL_ID = '//ly.img.panel/update-fal.ai';

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
        update.logs.map((log) => log.message).forEach(console.log);
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
          [`panel.${GENERATE_PANEL_ID}`]: 'Generate fal.ai',
          [`panel.${UPDATE_PANEL_ID}`]: 'Update fal.ai'
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

      cesdk.ui.registerComponent(
        'ly.img.generate-fal-ai.dock',
        ({ builder }) => {
          const isOpen = cesdk.ui.isPanelOpen(GENERATE_PANEL_ID);
          builder.Button('ly.img.generate-fal-ai.dock', {
            label: 'fal.ai',
            icon: '@imgly/plugin/fal-ai',
            isSelected: isOpen,
            onClick: () => {
              if (isOpen) {
                cesdk.ui.closePanel(GENERATE_PANEL_ID);
              } else {
                cesdk.ui.openPanel(GENERATE_PANEL_ID);
              }
            }
          });
        }
      );

      cesdk.ui.registerComponent(
        'ly.img.update-fal-ai.canvasMenu',
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

          builder.Button('ly.img.update-fal-ai.dock', {
            label: 'common.edit',
            icon: '@imgly/plugin/fal-ai',
            onClick: () => {
              cesdk.ui.openPanel(UPDATE_PANEL_ID);
            }
          });
        }
      );

      cesdk.ui.setCanvasMenuOrder([
        'ly.img.update-fal-ai.canvasMenu',
        ...cesdk.ui.getCanvasMenuOrder()
      ]);

      cesdk.ui.registerPanel(
        GENERATE_PANEL_ID,
        ({ builder, engine, state }) => {
          const prompt = state<string>('prompt', '');
          const generating = state<boolean>('generating', false);

          builder.Section('ly.img.generate-fal-ai.inputs.section', {
            children: () => {
              builder.TextArea('ly.img.generate-fal-ai.prompt', {
                inputLabel: 'Prompt',
                ...prompt
              });
            }
          });

          builder.Section('ly.img.generate-fal-ai.button.section', {
            children: () => {
              builder.Button('ly.img.generate-fal-ai.generate', {
                label: 'Generate',
                isDisabled: prompt.value === '',
                isLoading: generating.value,
                color: 'accent',
                onClick: async () => {
                  generating.setValue(true);
                  await createFalAiBlock(cesdk, engine, prompt.value, metadata);
                  generating.setValue(false);
                  cesdk.ui.closePanel(GENERATE_PANEL_ID);
                }
              });
            }
          });
        }
      );

      /**
       * Close the panel if the selected block is not a fal-ai block.
       */
      cesdk.engine.block.onSelectionChanged(() => {
        const selectedBlocks = cesdk.engine.block.findAllSelected();
        if (selectedBlocks.length !== 1) {
          if (cesdk.ui.isPanelOpen(UPDATE_PANEL_ID))
            cesdk.ui.closePanel(UPDATE_PANEL_ID);
          return;
        }
        const selectedBlock = selectedBlocks[0];
        if (!metadata.hasData(selectedBlock)) {
          if (cesdk.ui.isPanelOpen(UPDATE_PANEL_ID))
            cesdk.ui.closePanel(UPDATE_PANEL_ID);
        }
      });

      cesdk.ui.registerPanel(UPDATE_PANEL_ID, ({ builder, engine, state }) => {
        const selectedBlocks = engine.block.findAllSelected();
        if (selectedBlocks.length !== 1) {
          builder.Section('ly.img.update-fal-ai.only-one-block.section', {
            children: () => {
              builder.Text('ly.img.update-fal-ai.only-one-block', {
                content:
                  'Please select only one block to update generative assets.'
              });
            }
          });
          return;
        }

        const selectedBlock = selectedBlocks[0];
        if (!metadata.hasData(selectedBlock)) {
          builder.Section('ly.img.update-fal-ai.no-metadata.section', {
            children: () => {
              builder.Text('ly.img.update-fal-ai.no-metadata', {
                content: 'Invalid fal.ai block selected. Missing metadata.'
              });
            }
          });
          return;
        }

        const { prompt: promptFromMetadata } = metadata.get(
          selectedBlock
        ) as FalAiMetadata;

        const prompt = state<string>('prompt', promptFromMetadata);

        builder.Section('ly.img.update-fal-ai.section', {
          children: () => {
            builder.TextArea('ly.img.update-fal-ai.prompt', {
              inputLabel: 'Prompt',
              ...prompt
            });
          }
        });
      });
    }
  };
};
