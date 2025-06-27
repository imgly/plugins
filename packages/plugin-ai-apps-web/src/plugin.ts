import CreativeEditorSDK, {
  AssetDefinition,
  AssetLibraryDockComponent,
  EditorPlugin
} from '@cesdk/cesdk-js';
import { getPanelId, ActionRegistry } from '@imgly/plugin-ai-generation-web';

import ImageGeneration from '@imgly/plugin-ai-image-generation-web';
import VideoGeneration from '@imgly/plugin-ai-video-generation-web';
import AudioGeneration from '@imgly/plugin-ai-audio-generation-web';
import TextGeneration from '@imgly/plugin-ai-text-generation-web';
import { AggregatedAssetSource } from '@imgly/plugin-utils';
import {
  createCustomAssetSource
} from './ActiveAssetSource';
import { PluginConfiguration, Providers } from './types';

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

      const { providers } = config;

      cesdk.addPlugin(
        TextGeneration({
          providers: {
            text2text: providers.text2text
          },
          debug: config.debug,
          dryRun: config.dryRun
        })
      );

      cesdk.addPlugin(
        ImageGeneration({
          providers: {
            text2image: providers.text2image,
            image2image: providers.image2image
          },
          debug: config.debug,
          dryRun: config.dryRun
        })
      );

      cesdk.addPlugin(
        VideoGeneration({
          providers: {
            text2video: providers.text2video,
            image2video: providers.image2video
          },
          debug: config.debug,
          dryRun: config.dryRun
        })
      );

      cesdk.addPlugin(
        AudioGeneration({
          providers: {
            text2speech: providers.text2speech,
            text2sound: providers.text2sound
          },
          debug: config.debug,
          dryRun: config.dryRun
        })
      );

      addTranslations(cesdk);
      initializeAppLibrary(cesdk, {
        ...config,
        baseURL:
          config.baseURL ??
          'https://cdn.img.ly/assets/plugins/plugin-ai-apps-web/v1/'
      });
    }
  };
};

function initializeAppLibrary(
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration
) {
  overrideAssetLibraryDockComponent(cesdk);

  const appAssetSource = registerAppAssetSource(cesdk, config);
  cesdk.engine.asset.addSource(appAssetSource);

  cesdk.ui.registerPanel(AI_APP_ID, ({ builder }) => {
    builder.Library(AI_APP_ID, {
      entries: [AI_APP_ID],
      onSelect: async (asset) => {
        ActionRegistry.get()
          .getBy({ id: asset.id })
          .forEach((action) => {
            action.execute();
          });
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

  const componentId = `${AI_APP_ID}.dock`;
  cesdk.ui.registerComponent(componentId, ({ builder, engine, experimental }) => {
    const sceneMode = engine.scene.getMode();
    const apps = appAssetSource.getCurrentAssets().filter((asset) => {
      if (asset?.meta?.sceneMode == null) return true;
      return asset?.meta?.sceneMode === sceneMode;
    });
    if (apps.length === 0) return;
    const singleAction =
      apps.length === 1
        ? ActionRegistry.get().getBy({ id: apps[0].id, type: 'plugin' })[0]
        : undefined;

    const panelId = singleAction?.meta?.panelId ?? AI_APP_ID;
    const isOpen = cesdk.ui.isPanelOpen(panelId);
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
          if (panel.startsWith('ly.img.ai/') && panel !== panelId) {
            cesdk.ui.closePanel(panel);
          }
          if (!isOpen && panel === '//ly.img.panel/assetLibrary') {
            cesdk.ui.closePanel(panel);
          }
        });

        if (singleAction != null) {
          singleAction.execute();
        } else {
          if (!isOpen) {
            cesdk.ui.openPanel(AI_APP_ID);
          } else {
            cesdk.ui.closePanel(AI_APP_ID);
          }
        }
      }
    });
  });
}

function registerAppAssetSource(
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration
) {
  const registry = ActionRegistry.get();

  const activeAssetSource = createCustomAssetSource(AI_APP_ID, cesdk, () => {
    return registry.getBy({ type: 'plugin' }).map(({ id, label, sceneMode }) => {
      const assetDefinition: AssetDefinition = {
        id,
        label: {
          en: label ?? id
        },
        meta: {
          sceneMode,
          thumbUri:
            config.baseURL != null
              ? getAppThumbnail(config.baseURL, id)
              : undefined,
          width: AI_APP_THUMBNAIL_WIDTH,
          height: AI_APP_THUMBNAIL_HEIGHT
        }
      };
      return assetDefinition;
    });
  });

  const dispose = registry.subscribeBy({ type: 'plugin' }, () => {
    if (cesdk?.engine?.asset?.assetSourceContentsChanged == null) {
      dispose();
      return;
    }
    cesdk.engine.asset.assetSourceContentsChanged(AI_APP_ID);
  });

  return activeAssetSource;
}

function getAppThumbnail(baseURL: string, appId: string): string {
  switch (appId) {
    case '@imgly/plugin-ai-image-generation-web': {
      return `${baseURL}GenerateImage.png`;
    }
    case '@imgly/plugin-ai-video-generation-web': {
      return `${baseURL}GenerateVideo.png`;
    }
    case '@imgly/plugin-ai-audio-generation-web/sound': {
      return `${baseURL}GenerateSound.png`;
    }
    case '@imgly/plugin-ai-audio-generation-web/speech': {
      return `${baseURL}AIVoice.png`;
    }
    default: {
      return `${baseURL}GenerateImage.png`;
    }
  }
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
        const entrySceneMode = entry.sceneMode;
        if (typeof entrySceneMode === 'string') {
          return (
            entry.sceneMode === sceneMode ||
            // Changes in the interface in CE.SDK version 1.51.0
            // We do not want to bump the version for this change.
            // @ts-ignore
            entry.sceneMode === 'All'
          );
        }
        if (typeof entrySceneMode === 'function') {
          return entry.sourceIds.some((sourceId) => {
            // Changes in the interface in CE.SDK version 1.51.0
            // We do not want to bump the version for this change.
            // In addition, 1.51.0 will only accept the sourceId as a string
            // and 1.52.0 onwards will accept an object with sourceId.
            // @ts-ignore
            const sourceSceneMode = entrySceneMode(
              cesdk.version.startsWith('1.51.') ? sourceId : { sourceId }
            );
            // @ts-ignore
            return sourceSceneMode === sceneMode || sourceSceneMode === 'All';
          });
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
  const text2image = undefined; // await providers.text2image?.({ cesdk });
  const image2image = undefined; // await providers.image2image?.({ cesdk });

  const aggregatedImageAssetSource = new AggregatedAssetSource(
    'ly.img.ai/image-generation.history',
    cesdk,
    [
      // text2image != null ? `${text2image.id}.history` : undefined,
      // image2image != null ? `${image2image?.id}.history` : undefined
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
  const text2video = undefined; // await providers.text2video?.({ cesdk });
  const image2video = undefined; // await providers.image2video?.({ cesdk });

  const aggregatedVideoAssetSource = new AggregatedAssetSource(
    'ly.img.ai/video-generation.history',
    cesdk,
    [
      // text2video != null ? `${text2video.id}.history` : undefined,
      // image2video != null ? `${image2video?.id}.history` : undefined
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
  const text2speech = undefined; // await providers.text2speech?.({ cesdk });
  const text2sound = undefined; // await providers.text2sound?.({ cesdk });

  const audioEntry = cesdk.ui.getAssetLibraryEntry('ly.img.audio');
  const generatedAudioSources = [
    // text2speech != null ? `${text2speech.id}.history` : undefined,
    // text2sound != null ? `${text2sound.id}.history` : undefined
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
