/* eslint-disable no-console */
import type { AssetResult } from '@cesdk/cesdk-js';
import { uuid4 } from '../utils';
import type Provider from './provider';
import {
  type GetInput,
  type GetBlockInput,
  OutputKind,
  type Output,
  GetBlockInputResult
} from './provider';
import { InitProviderConfiguration, UIOptions } from './types';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import getAssetResultForPlaceholder from './getAssetResultForPlaceholder';
import getDryRunOutput from './getDryRunOutput';
import getAssetResultForGenerated from './getAssetResultForGenerated';

/**
 * Generate content using the provider with the given input
 */
async function generate<K extends OutputKind, I, O extends Output>(
  kind: K,
  getInput: GetInput<I>,
  getBlockInput: GetBlockInput<K, I>,
  provider: Provider<K, I, O>,
  options: UIOptions & {
    createPlaceholderBlock?: boolean;
  },
  config: InitProviderConfiguration,
  abortSignal: AbortSignal
): Promise<void> {
  const { cesdk, createPlaceholderBlock, historyAssetSourceId } = options;

  try {
    if (config.debug) console.group(`Starting Generation for '${kind}'`);

    const inputs = getInput();
    const blockInputs = await getBlockInput(inputs.input);
    const assetId = uuid4();
    let assetResult: AssetResult;

    let placeholderBlock: number | undefined;

    // Create a placeholder block
    if (createPlaceholderBlock) {
      assetResult = getAssetResultForPlaceholder(assetId, kind, blockInputs);

      if (config.debug)
        console.log(
          'Adding as asset to scene:',
          JSON.stringify(assetResult, undefined, 2)
        );

      placeholderBlock = await cesdk.engine.asset.defaultApplyAsset(
        assetResult
      );

      if (checkAbortSignal(cesdk, abortSignal, placeholderBlock)) return;

      if (placeholderBlock == null)
        throw new Error('Could not create placeholder block');

      cesdk.engine.block.setState(placeholderBlock, {
        type: 'Pending',
        progress: 0
      });
    }

    console.log('blockInputs', blockInputs);
    // Trigger the generation
    const output = config.dryRun
      ? await dryRun(kind, blockInputs)
      : await provider.output.generate(inputs.input, {
          abortSignal,
          engine: options.engine,
          cesdk
        });

    if (checkAbortSignal(cesdk, abortSignal, placeholderBlock)) return;

    if (output == null) throw new Error('Generation failed');

    if (config.debug)
      console.log('Generated output:', JSON.stringify(output, undefined, 2));

    let generatedAssetResult: AssetResult | undefined;
    if (placeholderBlock != null) {
      generatedAssetResult = await getAssetResultForGenerated(
        assetId,
        kind,
        blockInputs,
        output
      );
      if (config.debug)
        console.log(
          'Updating asset in scene:',
          JSON.stringify(generatedAssetResult, undefined, 2)
        );

      await cesdk.engine.asset.defaultApplyAssetToBlock(
        generatedAssetResult,
        placeholderBlock
      );
    }

    if (checkAbortSignal(cesdk, abortSignal, placeholderBlock)) return;

    if (historyAssetSourceId != null) {
      if (generatedAssetResult == null) {
        generatedAssetResult = await getAssetResultForGenerated(
          assetId,
          kind,
          blockInputs,
          output
        );
      }
      cesdk.engine.asset.addAssetToSource(historyAssetSourceId, {
        ...generatedAssetResult,
        label: {},
        tags: {}
      });
    }

    if (
      placeholderBlock != null &&
      cesdk.engine.block.isValid(placeholderBlock)
    ) {
      cesdk.engine.block.setState(placeholderBlock, {
        type: 'Ready'
      });
    }
  } finally {
    if (config.debug) console.groupEnd();
  }
}

/**
 * Check the given abort signal and destroy the placeholder block if it is aborted.
 * @returns `true` if the signal is aborted, `false` otherwise.
 */
function checkAbortSignal(
  cesdk: CreativeEditorSDK,
  abortSignal: AbortSignal,
  placeholderBlock?: number
) {
  if (abortSignal.aborted) {
    if (
      placeholderBlock != null &&
      cesdk.engine.block.isValid(placeholderBlock)
    ) {
      cesdk.engine.block.destroy(placeholderBlock);
    }
    return true;
  }
  return false;
}

/**
 * Simulate the generation of the output without actually generating it.
 */
async function dryRun<K extends OutputKind>(
  kind: K,
  blockInputs: GetBlockInputResult<K>
): Promise<Output> {
  console.log(
    `[DRY RUN]: Requesting dummy AI generation with block inputs: `,
    JSON.stringify(blockInputs, undefined, 2)
  );
  const output = getDryRunOutput(kind, blockInputs);
  await wait(2000);
  return output;
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default generate;
