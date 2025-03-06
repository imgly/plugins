import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type AssetResult } from '@cesdk/engine';
import { fal } from '@fal-ai/client';
import { HISTORY_ASSET_SOURCE_ID, PREFIX } from './constants';
import { getImageDimensions } from './imageSize';
import previewUri from './previewUri';
import { PluginConfiguration } from './types';

export interface Input {
  prompt: string;
  style: string;
  image_size:
    | string
    | {
        width: number;
        height: number;
      };
}

type GenerateAsset = (modelPath: string, input: Input) => Promise<string>;

let counter = 0;

async function generate(
  cesdk: CreativeEditorSDK,
  config: PluginConfiguration,
  input: Input
) {
  const modelPath = 'fal-ai/recraft-v3';
  let block: number | undefined;

  try {
    const imageSize =
      input.image_size != null && typeof input.image_size === 'string'
        ? getImageDimensions(input.image_size)
        : input.image_size;

    if (config.debug)
      // eslint-disable-next-line no-console
      console.log('Creating block with image size:', imageSize);

    const assetResult: AssetResult = {
      id: `${PREFIX}/generated/${counter++}`,
      meta: {
        previewUri,
        fillType: '//ly.img.ubq/fill/image',
        kind: 'image',

        width: imageSize.width,
        height: imageSize.height
      }
    };

    if (config.debug)
      // eslint-disable-next-line no-console
      console.log(
        'Adding asset to scene:',
        JSON.stringify(assetResult, undefined, 2)
      );

    block = await cesdk.engine.asset.defaultApplyAsset(assetResult);
    if (block == null) throw new Error('Could not create block');
    const fill = cesdk.engine.block.getFill(block);

    cesdk.engine.block.setState(block, {
      type: 'Pending',
      progress: 0
    });

    const generateAsset: GenerateAsset = config.dryRun
      ? generateWithDry
      : generateWithFal;

    const url = await generateAsset(modelPath, input);

    if (config.debug)
      // eslint-disable-next-line no-console
      console.log('Generated URL:', JSON.stringify(url, undefined, 2));

    await cesdk.engine.block.addImageFileURIToSourceSet(
      fill,
      'fill/image/sourceSet',
      url
    );
    cesdk.engine.block.setContentFillMode(block, 'Cover');

    const sourceSet = cesdk.engine.block.getSourceSet(
      fill,
      'fill/image/sourceSet'
    );
    const [source] = sourceSet;

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

    const historyAsset = {
      id: url,
      groups: [],
      tags: {
        en: ['fal.ai']
      },
      meta,
      payload
    };

    if (config.debug)
      // eslint-disable-next-line no-console
      console.log(
        'Adding asset to history:',
        JSON.stringify(historyAsset, undefined, 2)
      );

    cesdk.engine.asset.addAssetToSource(HISTORY_ASSET_SOURCE_ID, historyAsset);

    cesdk.engine.block.setState(block, { type: 'Ready' });
  } catch (e: any) {
    let message = (e as any).toString();
    if ('body' in e && 'detail' in e.body) {
      message = e.body.detail;
    }
    if (config.onError != null) {
      config.onError(e);
    } else {
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
}

async function generateWithFal(
  modelPath: string,
  input: Input
): Promise<string> {
  const response = await fal.subscribe(modelPath, {
    input,
    logs: true
  });
  const images = response?.data?.images;
  if (images != null && Array.isArray(images)) {
    const image = images[0];
    const url = image?.url;
    if (url != null) return url;
  }

  throw new Error('Could not generate image');
}

async function generateWithDry(
  modelPath: string,
  input: Input
): Promise<string> {
  const imageSize =
    input.image_size != null && typeof input.image_size === 'string'
      ? getImageDimensions(input.image_size)
      : input.image_size;
  // eslint-disable-next-line no-console
  console.log(
    `[DRY RUN]: Requesting AI generation on path '${modelPath}' with input:`,
    JSON.stringify(input, undefined, 2)
  );
  await wait(2000);
  // @ts-ignore
  const prompt: string = input.prompt;
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

export default generate;
