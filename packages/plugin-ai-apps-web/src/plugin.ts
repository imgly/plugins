import CreativeEditorSDK, {
  AssetLibraryDockComponent,
  EditorPlugin
} from '@cesdk/cesdk-js';
import {
  Middleware,
  OutputKind,
  getPanelId,
  Output
} from '@imgly/plugin-ai-generation-web';

import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import AudioGeneration from '@imgly/plugin-ai-audio-generation-web';
import TextGeneration from '@imgly/plugin-ai-text-generation-web';
import { AggregatedAssetSource } from '@imgly/plugin-utils';
import CustomAssetSource, {
  createCustomAssetSource
} from './ActiveAssetSource';
import { GetProvider, PluginConfiguration, Providers } from './types';

export { PLUGIN_ID } from './constants';

const AI_APP_ID = getPanelId('apps');
const AI_APP_THUMBNAIL_WIDTH = 512;
const AI_APP_THUMBNAIL_HEIGHT = 128;

export default (
  config: PluginConfiguration
): Omit<EditorPlugin, 'name' | 'version'> => {
  return {
    async initialize({ cesdk }) {
      if (cesdk == null) return;
      const isVideoMode = cesdk.engine.scene.getMode() === 'Video';

      const {
        providers,
        baseURL = 'https://cdn.img.ly/assets/plugins/plugin-ai-apps-web/v1/'
      } = config;

      const { activeAssetSource } = await addAiAppDockMenu(cesdk, {
        isVideoMode,
        baseURL,
        debug: config.debug
      });

      const text2text = await extendProvider(
        cesdk,
        activeAssetSource,
        providers.text2text
      );
      const text2image = await extendProvider(
        cesdk,
        activeAssetSource,
        providers.text2image
      );
      const image2image = await extendProvider(
        cesdk,
        activeAssetSource,
        providers.image2image
      );

      let text2video: GetProvider<'video'> | undefined;
      let image2video: GetProvider<'video'> | undefined;
      let text2speech: GetProvider<'audio'> | undefined;
      let text2sound: GetProvider<'audio'> | undefined;

      if (isVideoMode) {
        text2video = await extendProvider(
          cesdk,
          activeAssetSource,
          providers.text2video
        );
        image2video = await extendProvider(
          cesdk,
          activeAssetSource,
          providers.image2video
        );
        text2speech = await extendProvider(
          cesdk,
          activeAssetSource,
          providers.text2speech
        );
        text2sound = await extendProvider(
          cesdk,
          activeAssetSource,
          providers.text2sound
        );

        cesdk.addPlugin(
          VideoGeneration({ text2video, image2video, debug: config.debug })
        );
        cesdk.addPlugin(
          AudioGeneration({ text2speech, text2sound, debug: config.debug })
        );
      }

      if (text2text != null)
        cesdk.addPlugin(
          TextGeneration({ provider: text2text, debug: config.debug })
        );

      cesdk.addPlugin(
        ImageGeneration({ text2image, image2image, debug: config.debug })
      );

      addAggregatedAssetSources(
        cesdk,
        {
          text2text,
          text2image,
          image2image,
          text2video,
          image2video,
          text2speech,
          text2sound
        },
        isVideoMode
      );

      addTranslations(cesdk);
    }
  };
};

async function extendProvider<K extends OutputKind, I, O extends Output>(
  cesdk: CreativeEditorSDK,
  activeAssetSource?: CustomAssetSource,
  getProvider?: GetProvider<K>
): Promise<undefined | GetProvider<K>> {
  if (getProvider == null) return undefined;

  const provider = await getProvider({ cesdk });

  if (activeAssetSource != null) {
    const markAiAppWithActiveStateMiddleware: Middleware<I, O> = async (
      input,
      options,
      next
    ) => {
      let aiAppAssetId = `${provider.kind}-generation`;
      if (provider.kind === 'audio') {
        if (provider.id.includes('sound')) {
          aiAppAssetId = 'audio-generation/sound';
        } else if (provider.id.includes('speech')) {
          aiAppAssetId = 'audio-generation/speech';
        }
      }

      cesdk.ui.experimental.setGlobalStateValue(
        `${AI_APP_ID}.isGenerating`,
        true
      );
      // activeAssetSource.setAssetActive(appAssetId);
      activeAssetSource.setAssetLoading(aiAppAssetId, true);
      cesdk.engine.asset.assetSourceContentsChanged(AI_APP_ID);

      try {
        const result = await next(input, options);

        return result;
      } finally {
        cesdk.engine.asset.assetSourceContentsChanged(AI_APP_ID);
        activeAssetSource.setAssetLoading(aiAppAssetId, false);
        // activeAssetSource.setAssetInactive(appAssetId);
        cesdk.ui.experimental.setGlobalStateValue(
          `${AI_APP_ID}.isGenerating`,
          false
        );
      }
    };

    provider.output.middleware = [
      ...(provider.output.middleware ?? []),
      markAiAppWithActiveStateMiddleware
    ];
  }
  return () => Promise.resolve(provider);
}

async function addAiAppDockMenu(
  cesdk: CreativeEditorSDK,
  options: {
    isVideoMode: boolean;
    baseURL: string;
    debug?: boolean;
  }
): Promise<{
  activeAssetSource?: CustomAssetSource;
}> {
  const { isVideoMode, debug, baseURL } = options;
  overrideAssetLibraryDockComponent(cesdk);

  let activeAssetSource: CustomAssetSource | undefined;
  if (isVideoMode) {
    activeAssetSource = createCustomAssetSource(AI_APP_ID, cesdk, [
      {
        id: 'image-generation',
        label: {
          en: 'Generate Image'
        },
        meta: {
          label: 'Generate Image',
          thumbUri: `${baseURL}GenerateImage.png`,
          width: AI_APP_THUMBNAIL_WIDTH,
          height: AI_APP_THUMBNAIL_HEIGHT
        }
      },
      {
        id: 'video-generation',
        label: {
          en: 'Generate Video'
        },
        meta: {
          label: 'Generate Video',
          thumbUri: `${baseURL}GenerateVideo.png`,
          width: AI_APP_THUMBNAIL_WIDTH,
          height: AI_APP_THUMBNAIL_HEIGHT
        }
      },
      {
        id: 'audio-generation/sound',
        label: {
          en: 'Generate Sound'
        },
        meta: {
          label: 'Generate Sound',
          thumbUri: `${baseURL}GenerateSound.png`,
          width: AI_APP_THUMBNAIL_WIDTH,
          height: AI_APP_THUMBNAIL_HEIGHT
        }
      },
      {
        id: 'audio-generation/speech',
        label: {
          en: 'AI Voice'
        },
        meta: {
          label: 'AI Voice',
          thumbUri: `${baseURL}AIVoice.png`,
          width: AI_APP_THUMBNAIL_WIDTH,
          height: AI_APP_THUMBNAIL_HEIGHT
        }
      }
    ]);

    cesdk.engine.asset.addSource(activeAssetSource);

    cesdk.ui.registerPanel(AI_APP_ID, ({ builder }) => {
      builder.Library(AI_APP_ID, {
        entries: [AI_APP_ID],
        onSelect: async (asset) => {
          cesdk.ui.openPanel(getPanelId(asset.id));
          // activeAssetSource.setAssetActive(asset.id, true);
        }
      });
    });

    cesdk.ui.addAssetLibraryEntry({
      id: AI_APP_ID,
      sourceIds: [AI_APP_ID],
      gridColumns: 1,
      gridItemHeight: 'auto',
      gridBackgroundType: 'cover',
      cardLabel: ({ label }) => label,
      cardLabelPosition: () => 'inside'
    });
  }

  const componentId = `${AI_APP_ID}.dock`;
  if (isVideoMode) {
    // eslint-disable-next-line no-console
    if (debug) console.log('Registering AI App Dock Button', componentId);

    cesdk.ui.registerComponent(componentId, ({ builder, experimental }) => {
      const isOpen = cesdk.ui.isPanelOpen(AI_APP_ID);
      const isGeneratingState = experimental.global<boolean>(
        `${AI_APP_ID}.isGenerating`,
        false
      );

      builder.Button(`${AI_APP_ID}.dock.button`, {
        label: 'AI',
        isSelected: isOpen,
        icon: isGeneratingState.value
          ? '@imgly/LoadingSpinner'
          : '@imgly/Sparkle',
        onClick: () => {
          cesdk.ui.findAllPanels().forEach((panel) => {
            if (panel.startsWith('ly.img.ai/')) {
              cesdk.ui.closePanel(panel);
            }
            if (!isOpen && panel === '//ly.img.panel/assetLibrary') {
              cesdk.ui.closePanel(panel);
            }
          });

          if (!isOpen) {
            cesdk.ui.openPanel(AI_APP_ID);
          } else {
            cesdk.ui.closePanel(AI_APP_ID);
          }
        }
      });
    });
  } else {
    cesdk.ui.registerComponent(componentId, ({ builder, experimental }) => {
      const panelId = getPanelId('image-generation');

      const isGeneratingState = experimental.global<boolean>(
        `${AI_APP_ID}.isGenerating`,
        false
      );
      const isOpen = cesdk.ui.isPanelOpen(panelId);

      builder.Button(`${AI_APP_ID}.dock.button`, {
        label: 'AI',
        isSelected: isOpen,
        icon: isGeneratingState.value
          ? '@imgly/LoadingSpinner'
          : '@imgly/Sparkle',
        onClick: () => {
          if (!isOpen) {
            cesdk.ui.openPanel(panelId);
          } else {
            cesdk.ui.closePanel(panelId);
          }
        }
      });
    });
  }
  return {
    activeAssetSource
  };
}

/**
 * Override `ly.img.assetLibrary.dock` to close the AI panel
 * when opening another asset library panel.
 */
function overrideAssetLibraryDockComponent(cesdk: CreativeEditorSDK) {
  cesdk.ui.registerComponent<AssetLibraryDockComponent>(
    'ly.img.assetLibrary.dock',
    ({ builder: { Button }, engine, payload }) => {
      const usage = `\n\nPlease provide a payload with entries, e.g. \n\`\`\`\n{ id: 'ly.img.assetLibrary.dock', entries: ['ly.img.image', 'ly.img.video'] }\n\`\`\``;

      if (!payload || payload.id !== 'ly.img.assetLibrary.dock') {
        // eslint-disable-next-line no-console
        console.warn(`No payload found for 'ly.img.assetLibrary.dock'${usage}`);
        return;
      }
      const {
        id,
        key,
        label: payloadLabel,
        icon: payloadIcon,
        entries: payloadEntryIds
      } = payload;
      if (payloadEntryIds == null || !Array.isArray(payloadEntryIds)) {
        // eslint-disable-next-line no-console
        console.warn(
          `No valid entries value found for 'ly.img.assetLibrary.dock'${usage}`
        );
        return;
      }

      if (payloadEntryIds.some((entryId) => typeof entryId !== 'string')) {
        // eslint-disable-next-line no-console
        console.warn(
          `Entries value for 'ly.img.assetLibrary.dock' need to be all strings referring to asset library entries${usage}`
        );
        return;
      }

      if (payloadLabel != null && typeof payloadLabel !== 'string') {
        // eslint-disable-next-line no-console
        console.warn(
          `Label for 'ly.img.assetLibrary.dock' must be a string if provided`
        );
      }

      const sceneMode = engine.scene.getMode();

      const entryIds = payloadEntryIds.filter((entryId) => {
        const entry = cesdk.ui.getAssetLibraryEntry(entryId);
        if (entry == null) return false;

        if (entry.sceneMode != null) {
          return entry.sceneMode === sceneMode;
        }

        return true;
      });

      if (entryIds.length === 0) return;

      let label: string | string[] | undefined = payloadLabel;
      if (label == null) {
        label = `libraries.${id}.label`;
      }
      const assetLibraryOpen = cesdk.ui.isPanelOpen(
        '//ly.img.panel/assetLibrary',
        {
          payload: {
            entries: entryIds,
            title: label
          }
        }
      );
      const replaceLibraryOpen = cesdk.ui.isPanelOpen(
        '//ly.img.panel/assetLibrary.replace'
      );

      let icon: string | undefined = payloadIcon;
      if (icon == null && entryIds.length === 1) {
        const entry = cesdk.ui.getAssetLibraryEntry(entryIds[0]);
        icon = entry?.icon as string;
      }

      Button(key ?? id, {
        label,
        icon,
        isDisabled: replaceLibraryOpen,
        isSelected: assetLibraryOpen,
        onClick: () => {
          if (assetLibraryOpen) {
            cesdk.ui.closePanel('//ly.img.panel/assetLibrary');
          } else {
            cesdk.ui.findAllPanels().forEach((panel) => {
              if (panel === AI_APP_ID || panel.startsWith('ly.img.ai/')) {
                cesdk.ui.closePanel(panel);
              }
            });
            cesdk.ui.openPanel('//ly.img.panel/assetLibrary', {
              payload: {
                entries: entryIds,
                title: label
              }
            });
          }
        }
      });
    }
  );
}

async function addAggregatedAssetSources(
  cesdk: CreativeEditorSDK,
  providers: Providers,
  isVideoMode: boolean
) {
  // IMAGE
  const text2image = await providers.text2image?.({ cesdk });
  const image2image = await providers.image2image?.({ cesdk });

  const aggregatedImageAssetSource = new AggregatedAssetSource(
    'ly.img.ai/image-generation.history',
    cesdk,
    [
      text2image != null ? `${text2image.id}.history` : undefined,
      image2image != null ? `${image2image?.id}.history` : undefined
    ].filter(Boolean) as string[]
  );
  cesdk.engine.asset.addSource(aggregatedImageAssetSource);
  const imageEntry = cesdk.ui.getAssetLibraryEntry('ly.img.image');
  if (imageEntry != null) {
    cesdk.ui.updateAssetLibraryEntry('ly.img.image', {
      sourceIds: [...imageEntry.sourceIds, 'ly.img.ai/image-generation.history']
    });
  }

  if (!isVideoMode) return;

  // VIDEO
  const text2video = await providers.text2video?.({ cesdk });
  const image2video = await providers.image2video?.({ cesdk });

  const aggregatedVideoAssetSource = new AggregatedAssetSource(
    'ly.img.ai/video-generation.history',
    cesdk,
    [
      text2video != null ? `${text2video.id}.history` : undefined,
      image2video != null ? `${image2video?.id}.history` : undefined
    ].filter(Boolean) as string[]
  );
  cesdk.engine.asset.addSource(aggregatedVideoAssetSource);

  const videoEntry = cesdk.ui.getAssetLibraryEntry('ly.img.video');
  if (videoEntry != null) {
    cesdk.ui.updateAssetLibraryEntry('ly.img.video', {
      sourceIds: [...videoEntry.sourceIds, 'ly.img.ai/video-generation.history']
    });
  }

  // AUDIO
  const text2speech = await providers.text2speech?.({ cesdk });
  const text2sound = await providers.text2sound?.({ cesdk });

  const audioEntry = cesdk.ui.getAssetLibraryEntry('ly.img.audio');
  const generatedAudioSources = [
    text2speech != null ? `${text2speech.id}.history` : undefined,
    text2sound != null ? `${text2sound.id}.history` : undefined
  ].filter(Boolean) as string[];
  if (audioEntry != null) {
    cesdk.ui.updateAssetLibraryEntry('ly.img.audio', {
      sourceIds: [...audioEntry.sourceIds, ...generatedAudioSources]
    });
  }
}

function addTranslations(cesdk: CreativeEditorSDK) {
  cesdk.i18n.setTranslations({
    en: {
      // TODO: Use keys based on the used providers
      'panel.ly.img.ai.generation.confirmCancel.content':
        'Are you sure you want to cancel the generation?',
      'panel.ly.img.ai.generation.confirmCancel.confirm': 'Cancel Generation',
      'panel.ly.img.ai/apps': 'AI',
      'panel.ly.img.ai/fal-ai/gemini-flash-edit.imageSelection':
        'Select Image To Change',
      'panel.gpt-image-1.imageSelection': 'Select Image To Change',
      'panel.ly.img.ai/elevenlabs': 'AI Voice',
      'panel.ly.img.ai/demo.video': 'Generate Video',
      'panel.ly.img.ai/demo.image': 'Generate Image',
      'panel.fal-ai/minimax/video-01-live/image-to-video.imageSelection':
        'Select Image To Generate',
      'panel.ly.img.ai/fal-ai/minimax/video-01-live/image-to-video.imageSelection':
        'Select Image To Generate',
      'panel.fal-ai/gemini-flash-edit.imageSelection':
        'Select Image To Generate',
      'libraries.ly.img.ai/fal-ai/recraft-v3.history.label':
        'Generated From Text',
      'libraries.ly.img.ai/fal-ai/gemini-flash-edit.history.label':
        'Generated From Image',
      'libraries.ly.img.ai/fal-ai/pixverse/v3.5/text-to-video.history.label':
        'Generated From Text',
      'libraries.ly.img.ai/fal-ai/minimax/video-01-live/image-to-video.history.label':
        'Generated From Image',
      'libraries.elevenlabs/monolingual/v1.history.label': 'AI Voice',
      'libraries.elevenlabs/sound-generation.history.label': 'Generated Sound',

      'libraries.ly.img.ai/image-generation.history.label':
        'AI Generated Images',
      'libraries.ly.img.ai/video-generation.history.label':
        'AI Generated Videos'
    }
  });
}
