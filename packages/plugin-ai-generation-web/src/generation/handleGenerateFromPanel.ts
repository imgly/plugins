import type { AssetDefinition } from '@cesdk/cesdk-js';
import { addAssetToScene, isAbortError, uuid4 } from '../utils/utils';
import { type GetBlockInput, OutputKind, type Output } from '../core/provider';
import { Generate, Result } from './createGenerateFunction';
import getAssetResultForPlaceholder from '../assets/getAssetResultForPlaceholder';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import { Middleware } from '../middleware/middleware';
import getAssetResultForGenerated from '../assets/getAssetResultForGenerated';

type PanelGenerationOptions<K extends OutputKind, I, O extends Output> = {
  /**
   * The kind to generate.
   */
  kind: K;

  /**
   * Initialized generate function
   */
  generate: Generate<I, O>;

  /**
   * The user flow for the generation process.
   */
  userFlow: 'placeholder' | 'generation-only';

  /**
   * Function to get block input from the generated input.
   */
  getBlockInput: GetBlockInput<K, I>;

  /**
   * Asset source id of the history library where a generated asset
   * will be added.
   */
  historyAssetSourceId?: string;

  /**
   * Additional middlewares added to the generation process.
   */
  middlewares?: Middleware<I, O>[];

  /**
   * Print debug information to the console.
   */
  debug?: boolean;

  /**
   * Enable dry run mode for testing.
   */
  dryRun?: boolean;

  /**
   * Signal to check if process was aborted.
   */
  abortSignal: AbortSignal;

  cesdk: CreativeEditorSDK;
};

/**
 * Handler for generating content from a panel interface.
 * Creates placeholder blocks and manages the generation process.
 */
function handleGenerateFromPanel<K extends OutputKind, I, O extends Output>(
  options: PanelGenerationOptions<K, I, O>
): (input: I) => Promise<Result<O>> {
  switch (options.userFlow) {
    case 'placeholder':
      return handleGeneratePlaceholderUserFlow(options);
    case 'generation-only':
      return handleGenerateGenerationOnlyUserFlow(options);
    default:
      throw new Error(
        `Unknown user flow: ${options.userFlow}. Expected 'placeholder' or 'generation-only'.`
      );
  }
}

function handleGenerateGenerationOnlyUserFlow<
  K extends OutputKind,
  I,
  O extends Output
>(options: PanelGenerationOptions<K, I, O>): (input: I) => Promise<Result<O>> {
  const { cesdk, abortSignal } = options;

  return async (input: I) => {
    try {
      const kind = options.kind;
      const blockInputs = await options.getBlockInput(input);

      if (checkAbortSignal(cesdk, abortSignal)) return { status: 'aborted' };

      const result = await options.generate(input, {
        middlewares: [...(options.middlewares ?? [])],
        debug: options.debug,
        dryRun: options.dryRun,
        abortSignal
      });

      if (checkAbortSignal(cesdk, abortSignal)) return { status: 'aborted' };

      if (result.status !== 'success') {
        return result;
      }

      if (result.type === 'async') {
        // If the result is an async generator, we need to handle it differently.
        // This is a placeholder for handling sync results.
        // You might want to implement logic to handle async results here.
        throw new Error(
          'Async generation is not supported in this context yet.'
        );
      }

      if (checkAbortSignal(cesdk, abortSignal)) return { status: 'aborted' };

      if (options.historyAssetSourceId != null) {
        const assetId = uuid4();
        const generatedAssetResult = await getAssetResultForGenerated(
          assetId,
          kind,
          blockInputs,
          result.output
        );
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
          options.historyAssetSourceId,
          assetDefinition
        );
      } else {
        if (options.debug) {
          // eslint-disable-next-line no-console
          console.log(
            'No asset source ID found in history and generation only was requested. Doing nothing. If no middleware is adding functionality this could be a bug.'
          );
        }
      }

      return result;
    } catch (error) {
      return {
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      };
    }
  };
}

/**
 * Handles generation from a panel with a placeholder block.
 */
function handleGeneratePlaceholderUserFlow<
  K extends OutputKind,
  I,
  O extends Output
>(options: PanelGenerationOptions<K, I, O>): (input: I) => Promise<Result<O>> {
  const { cesdk, abortSignal } = options;

  let placeholderBlock: number | undefined;
  return async (input: I) => {
    try {
      const kind = options.kind;
      const blockInputs = await options.getBlockInput(input);

      if (checkAbortSignal(cesdk, abortSignal)) return { status: 'aborted' };

      const assetId = uuid4();
      const assetResult = getAssetResultForPlaceholder(
        assetId,
        kind,
        blockInputs
      );

      placeholderBlock = await addAssetToScene(cesdk, assetResult);
      if (checkAbortSignal(cesdk, abortSignal, placeholderBlock))
        return { status: 'aborted' };
      // This is a workaround. The middleware in the video timeline
      // is calling APIs that will render the block in an error
      // state if it does not have an URI set. It's difficult to
      // recover from that. A bug report has been created for this.
      // As a workaround: Duplicating the block will remove the error state
      // but you will still see an error in the web console.
      // TODO: Remove this workaround when the bug is fixed.
      if (placeholderBlock != null && options.kind === 'video') {
        const positionX = cesdk.engine.block.getPositionX(placeholderBlock);
        const positionY = cesdk.engine.block.getPositionY(placeholderBlock);
        const duplicated = cesdk.engine.block.duplicate(placeholderBlock);
        cesdk.engine.block.setPositionX(duplicated, positionX);
        cesdk.engine.block.setPositionY(duplicated, positionY);
        cesdk.engine.block.destroy(placeholderBlock);
        placeholderBlock = duplicated;
      }

      if (placeholderBlock == null)
        throw new Error('Could not create placeholder block');

      cesdk.engine.block.setState(placeholderBlock, {
        type: 'Pending',
        progress: 0
      });

      const result = await options.generate(input, {
        blockIds: [placeholderBlock],
        middlewares: [...(options.middlewares ?? [])],
        debug: options.debug,
        dryRun: options.dryRun,
        abortSignal
      });

      if (checkAbortSignal(cesdk, abortSignal, placeholderBlock))
        return { status: 'aborted' };

      if (result.status !== 'success') {
        // Update block state before returning to prevent stuck in Pending state
        if (
          placeholderBlock != null &&
          cesdk.engine.block.isValid(placeholderBlock)
        ) {
          if (result.status === 'aborted') {
            cesdk.engine.block.destroy(placeholderBlock);
          } else {
            cesdk.engine.block.setState(placeholderBlock, {
              type: 'Error',
              error: 'Unknown'
            });
          }
        }
        return result;
      }

      if (result.type === 'async') {
        // If the result is an async generator, we need to handle it differently.
        // This is a placeholder for handling sync results.
        // You might want to implement logic to handle async results here.
        throw new Error(
          'Async generation is not supported in this context yet.'
        );
      }

      if (!cesdk.engine.block.isValid(placeholderBlock)) {
        return {
          status: 'aborted',
          message:
            'Placeholder block was destroyed before generation completed.'
        };
      }

      const generatedAssetResult = await getAssetResultForGenerated(
        assetId,
        kind,
        blockInputs,
        result.output
      );

      if (checkAbortSignal(cesdk, abortSignal, placeholderBlock))
        return { status: 'aborted' };

      if (options.debug)
        // eslint-disable-next-line no-console
        console.log(
          'Updating placeholder in scene:',
          JSON.stringify(generatedAssetResult, undefined, 2)
        );

      await cesdk.engine.asset.defaultApplyAssetToBlock(
        generatedAssetResult,
        placeholderBlock
      );

      if (checkAbortSignal(cesdk, abortSignal, placeholderBlock))
        return { status: 'aborted' };

      if (options.historyAssetSourceId != null) {
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
          options.historyAssetSourceId,
          assetDefinition
        );
      }

      if (cesdk.engine.block.isValid(placeholderBlock)) {
        cesdk.engine.block.setState(placeholderBlock, {
          type: 'Ready'
        });
      }

      return result;
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
      return {
        status: 'error',
        message: error instanceof Error ? error.message : String(error)
      };
    }
  };
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

export default handleGenerateFromPanel;
