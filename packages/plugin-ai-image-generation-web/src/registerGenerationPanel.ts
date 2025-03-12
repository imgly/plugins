import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { PluginConfiguration, Provider } from './types';
import { AssetResult, type CreativeEngine } from '@cesdk/cesdk-js';
import { fetchImageBlob, uploadBlob, uuid } from '@imgly/plugin-utils';
import previewUri from './previewUri';
import { getHistoryAssetSourceId } from './history';

/**
 * Register the main panel for the image generation plugin.
 */
function registerGenerationPanel<I>(
  provider: Provider<I>,
  options: {
    cesdk: CreativeEditorSDK;
    config: PluginConfiguration<I>;
    providerId: string;
  }
) {
  const { cesdk, config, providerId } = options;
  const panelId = providerId;

  cesdk.ui.registerPanel(panelId, (context) => {
    const { builder, state } = context;

    const getInput = provider.renderPanel(context, {
      config,
      cesdk,
      engine: context.engine
    });

    builder.Section(`${providerId}.generate.section`, {
      children: () => {
        const generating = state('generating', false);

        builder.Button(`${providerId}.generate`, {
          label: `panel.${panelId}.generate`,
          isLoading: generating.value,
          color: 'accent',
          onClick: async () => {
            try {
              generating.setValue(true);
              const { input, imageSize } = getInput();
              await generate(input, provider, {
                providerId,
                imageSize,
                config,
                cesdk,
                engine: context.engine
              });
            } finally {
              generating.setValue(false);
            }
          }
        });
      }
    });
    if (cesdk.ui.getAssetLibraryEntry(`${providerId}.history.entry`)) {
      builder.Library(`${providerId}.history.library`, {
        entries: [`${providerId}.history.entry`]
      });
    }
  });
}

async function generate<I>(
  input: I,
  provider: Provider<I>,
  options: {
    providerId: string;
    imageSize: { width: number; height: number };
    config: PluginConfiguration<I>;
    cesdk: CreativeEditorSDK;
    engine: CreativeEngine;
  }
) {
  const { config, cesdk, imageSize, providerId } = options;
  if (config.debug)
    // eslint-disable-next-line no-console
    console.group('Starting Image Generation');

  // eslint-disable-next-line no-console
  console.log('Generating with inputs:', JSON.stringify(input ?? {}, null, 2));

  let block: number | undefined;

  try {
    if (config.debug)
      // eslint-disable-next-line no-console
      console.log('Creating placeholder block with image size:', imageSize);

    const assetResult: AssetResult = {
      id: uuid(),
      meta: {
        // previewUri,
        fillType: '//ly.img.ubq/fill/image',
        kind: 'image',

        width: imageSize.width,
        height: imageSize.height
      },
      payload: {
        sourceSet: [
          {
            // Adding a previewUri to the source set for now. The engine
            // has a bug where the replaced image will be distorted if the
            // aspect ratio is different from the preview image.
            // This will be fixed in a future release and we can use
            // `meta.previewUri` again.
            uri: previewUri,
            width: 256,
            height: 256
          }
        ]
      }
    };

    if (config.debug)
      // eslint-disable-next-line no-console
      console.log(
        'Adding as asset to scene:',
        JSON.stringify(assetResult, undefined, 2)
      );

    block = await cesdk.engine.asset.defaultApplyAsset(assetResult);
    if (block == null) throw new Error('Could not create block');
    const fill = cesdk.engine.block.getFill(block);

    cesdk.engine.block.setState(block, {
      type: 'Pending',
      progress: 0
    });

    let url: string = config.dryRun
      ? await generateAsDryRun(input, imageSize)
      : await provider.generate(input, options);

    if (config.debug)
      // eslint-disable-next-line no-console
      console.log('Generated URL:', url);

    if (config.uploadGeneratedAsset != null) {
      // Re-using the existing CE.SDK upload
      if (config.uploadGeneratedAsset === 'configured') {
        const blob = await fetchImageBlob(url);
        url = await uploadBlob(blob, url, cesdk);
      } else if (typeof config.uploadGeneratedAsset === 'function') {
        url = await config.uploadGeneratedAsset(url);
      }

      if (config.debug)
        // eslint-disable-next-line no-console
        console.log('Reuploaded with URL:', url);
    }

    const source = {
      uri: url,
      width: imageSize.width,
      height: imageSize.height
    };
    const sourceSet = [source];

    cesdk.engine.block.setSourceSet(fill, 'fill/image/sourceSet', sourceSet);

    const meta = {
      uri: url,
      thumbUri: url,
      fillType: '//ly.img.ubq/fill/image',
      kind: 'image',

      width: source.width,
      height: source.height
    };

    const payload = {
      sourceSet
    };

    const historyAssetSourceId = getHistoryAssetSourceId({
      config,
      providerId
    });
    if (historyAssetSourceId != null) {
      const historyAsset = {
        id: uuid(),
        meta,
        payload
      };

      if (config.debug)
        // eslint-disable-next-line no-console
        console.log(
          'Adding asset to history:',
          JSON.stringify(historyAsset, undefined, 2)
        );

      cesdk.engine.asset.addAssetToSource(historyAssetSourceId, historyAsset);
    }

    cesdk.engine.block.setState(block, { type: 'Ready' });
  } catch (e: any) {
    let message = (e as any).toString();
    if ('body' in e && 'detail' in e.body) {
      message = e.body.detail;
    }
    if (config.onError != null) {
      config.onError(e);
    } else {
      // eslint-disable-next-line no-console
      console.log(e);
      cesdk.ui.showNotification({
        type: 'error',
        message
      });
    }
    if (block != null && cesdk.engine.block.isValid(block)) {
      cesdk.engine.block.setState(block, {
        type: 'Error',
        error: 'Unknown'
      });
    }
  }

  provider.generate(input, options);

  // eslint-disable-next-line no-console
  console.groupEnd();
}

async function generateAsDryRun<I>(
  input: I,
  imageSize: {
    width: number;
    height: number;
  }
): Promise<string> {
  // eslint-disable-next-line no-console
  console.log(`[DRY RUN]: Requesting dummy AI generation`);
  await wait(2000);
  // If the input has a prompt field, use it to generate a placeholder image
  const prompt: string =
    input != null &&
    typeof input === 'object' &&
    'prompt' in input &&
    typeof input.prompt === 'string'
      ? input.prompt
      : 'AI Generated Image';

  const placeholderURL = `https://placehold.co/${imageSize.width}x${
    imageSize.height
  }/000000/FFF?text=${prompt.replace(' ', '+').replace('\n', '+')}`;
  return placeholderURL;
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default registerGenerationPanel;
