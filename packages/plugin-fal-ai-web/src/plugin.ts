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
            viewBox="0 0 24 24"
            id="@imgly/plugin/fal-ai"
          >
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 3H11V11H3V3ZM5 5H9V9H5V5Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M3 13H11V21H3V13ZM5 15H9V19H5V15Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M13 3V11H21V3H13ZM19 5H15V9H19V5Z" fill="currentColor"/>
            <path fill-rule="evenodd" clip-rule="evenodd" d="M15 13H13V15H15V17H13V21H17V19H19V21H21V19H19V17H21V13H17V15H15V13ZM17 17H15V19H17V17ZM17 17V15H19V17H17Z" fill="currentColor"/>
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
