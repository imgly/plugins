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
  type Output
} from './provider';
import { CommonProviderConfiguration, UIOptions } from './types';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import getAssetResultForPlaceholder from './getAssetResultForPlaceholder';
import getAssetResultForGenerated from './getAssetResultForGenerated';
import { composeMiddlewares } from './middleware/middleware';
import loggingMiddleware from './middleware/loggingMiddleware';
import dryRunMiddleware from './middleware/dryRunMiddleware';

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
  config: CommonProviderConfiguration<I, O>,
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
    const composedMiddlewares = composeMiddlewares<I, O>([
      ...(provider.output.middleware ?? []),
      config.debug ? loggingMiddleware() : undefined,
      ...(config.middlewares ?? []),
      config.dryRun
        ? dryRunMiddleware({ kind: provider.kind, blockInputs })
        : undefined
    ]);

    const { result: output } = await composedMiddlewares(
      provider.output.generate
    )(inputs.input, {
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
        id: `${Date.now()}-${generatedAssetResult.id}`,
        label:
          generatedAssetResult.label != null
            ? {
                en: generatedAssetResult.label
              }
            : {},
        tags: {}
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

export default generate;
