/* eslint-disable no-console */
import type { AssetDefinition, AssetResult } from '@cesdk/cesdk-js';
import {
  addAssetToScene,
  isAbortError,
  isAsyncGenerator,
  uuid4
} from '../utils';
import type Provider from './provider';
import {
  type GetInput,
  type GetBlockInput,
  OutputKind,
  type Output,
  GetBlockInputResult,
  GenerationResult
} from './provider';
import { InitProviderConfiguration, UIOptions } from './types';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import getAssetResultForPlaceholder from './getAssetResultForPlaceholder';
import getDryRunOutput from './getDryRunOutput';
import getAssetResultForGenerated from './getAssetResultForGenerated';

type Result<O> = { status: 'success'; output: O } | { status: 'aborted' };

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
): Promise<Result<O>> {
  const { cesdk, createPlaceholderBlock, historyAssetSourceId } = options;

  let placeholderBlock: number | undefined;

  try {
    if (config.debug) console.group(`Starting Generation for '${kind}'`);

    const inputs = getInput();
    const blockInputs = await getBlockInput(inputs.input);
    const assetId = uuid4();
    let assetResult: AssetResult;

    // Create a placeholder block
    if (createPlaceholderBlock) {
      assetResult = getAssetResultForPlaceholder(assetId, kind, blockInputs);

      if (config.debug)
        console.log(
          'Adding as asset to scene:',
          JSON.stringify(assetResult, undefined, 2)
        );

      placeholderBlock = await addAssetToScene(cesdk, assetResult);
      // This is a workaround. The middleware in the video timeline
      // is calling APIs that will render the block in an error
      // state if it does not have an URI set. It's difficult to
      // recover from that. A bug report has been created for this.
      // As a workaround: Duplicating the block will remove the error state
      // but you will still see an error in the web console.
      // TODO: Remove this workaround when the bug is fixed.
      if (placeholderBlock != null && provider.kind === 'video') {
        const positionX = cesdk.engine.block.getPositionX(placeholderBlock);
        const positionY = cesdk.engine.block.getPositionY(placeholderBlock);
        const duplicated = cesdk.engine.block.duplicate(placeholderBlock);
        cesdk.engine.block.setPositionX(duplicated, positionX);
        cesdk.engine.block.setPositionY(duplicated, positionY);
        cesdk.engine.block.destroy(placeholderBlock);
        placeholderBlock = duplicated;
      }
      // placeholderBlock = await options.engine.asset.defaultApplyAsset(
      //   assetResult
      // );

      if (checkAbortSignal(cesdk, abortSignal, placeholderBlock))
        return { status: 'aborted' };

      if (placeholderBlock == null)
        throw new Error('Could not create placeholder block');

      cesdk.engine.block.setState(placeholderBlock, {
        type: 'Pending',
        progress: 0
      });
    }

    // Trigger the generation
    const output: GenerationResult<O> = config.dryRun
      ? ((await dryRun(kind, blockInputs)) as O)
      : await provider.output.generate(inputs.input, {
          abortSignal,
          engine: options.engine,
          cesdk
        });

    if (isAsyncGenerator(output)) {
      throw new Error('Streaming generation is not supported yet from a panel');
    }

    if (checkAbortSignal(cesdk, abortSignal, placeholderBlock))
      return { status: 'aborted' };

    if (output == null) throw new Error('Generation failed');

    if (config.debug)
      console.log('Generated output:', JSON.stringify(output, undefined, 2));

    let generatedAssetResult: AssetResult | undefined;
    if (
      placeholderBlock != null &&
      cesdk.engine.block.isValid(placeholderBlock)
    ) {
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

    if (checkAbortSignal(cesdk, abortSignal, placeholderBlock))
      return { status: 'aborted' };

    if (historyAssetSourceId != null) {
      if (generatedAssetResult == null) {
        generatedAssetResult = await getAssetResultForGenerated(
          assetId,
          kind,
          blockInputs,
          output
        );
        if (checkAbortSignal(cesdk, abortSignal, placeholderBlock))
          return { status: 'aborted' };
      }
      const assetDefinition: AssetDefinition = {
        ...generatedAssetResult,
        label:
          generatedAssetResult.label != null
            ? {
                en: generatedAssetResult.label
              }
            : {},
        tags: {},
        meta: {
          ...generatedAssetResult.meta,
          insertedAt: Date.now()
        }
      };

      cesdk.engine.asset.addAssetToSource(
        historyAssetSourceId,
        assetDefinition
      );
    }

    if (
      placeholderBlock != null &&
      cesdk.engine.block.isValid(placeholderBlock)
    ) {
      cesdk.engine.block.setState(placeholderBlock, {
        type: 'Ready'
      });
    }
    return { status: 'success', output };
  } catch (error) {
    if (
      placeholderBlock != null &&
      cesdk.engine.block.isValid(placeholderBlock)
    ) {
      if (isAbortError(error)) {
        cesdk.engine.block.destroy(placeholderBlock);
      } else {
        cesdk.engine.block.setState(placeholderBlock, {
          type: 'Error',
          error: 'Unknown'
        });
      }
    }
    throw error;
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
  await wait(3000);
  return output;
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default generate;
