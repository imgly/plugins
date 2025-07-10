import { isDefined, Metadata } from '@imgly/plugin-utils';
import { QuickActionDefinition } from '../core/ActionRegistry';
import { Result } from './createGenerateFunction';
import { ProviderInitializationResult } from '../providers/initializeProvider';
import { Middleware } from '../middleware/middleware';
import { Output, OutputKind } from '../core/provider';
import { AI_EDIT_MODE, AI_METADATA_KEY } from '../ui/quickActions/utils';
import { InferenceMetadata } from '../ui/quickActions/types';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import getApplyCallbacks from '../providers/getApplyCallbacks';
import lockSelectionToEditMode from '../utils/lockSelectionToEditMode';
import CallbacksRegistry from './CallbacksRegistry';
import { ABORT_REASON_USER_CANCEL } from '../core/constants';

type GenerationOptions<
  Q extends Record<string, any>,
  K extends OutputKind,
  I,
  O extends Output
> = {
  /**
   * The blocks that this quick action is running on.
   */
  blockIds: number[];

  /**
   * The initlaized provider that is used to generate the output.
   */
  providerInitializationResult?: ProviderInitializationResult<K, I, O>;

  /**
   * The quick action definition that is used to generate input for the provider
   */
  quickAction: QuickActionDefinition<Q>;

  /**
   * Shall the generation be confirmed before applying the result? Or directly applied?
   */
  confirmation?: boolean;

  /**
   * Should the blocks be locked to edit mode while the generation is running?
   */
  lock?: boolean;

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
   * Signal to check if process was aborted
   */
  abortSignal?: AbortSignal;

  /**
   * Close the quick action menu
   */
  close: () => void;

  cesdk: CreativeEditorSDK;
};

/**
 * Handler for generating output from a quick action.
 */
function handleGenerateFromQuickAction<
  Q extends Record<string, any>,
  K extends OutputKind,
  I,
  O extends Output
>(
  options: GenerationOptions<Q, K, I, O>
): (input: Q, generateOptions?: { blockIds?: number[] }) => Promise<Result<O>> {
  return async (input: Q, generateOptions?: { blockIds?: number[] }) => {
    // Use provided blockIds or fall back to default selection
    const targetBlockIds = generateOptions?.blockIds ?? options.blockIds;
    if (options.providerInitializationResult == null) {
      if (options.debug) {
        // eslint-disable-next-line no-console
        console.warn(
          '[Generate] No provider initialization result found for quick action. Returning abortion status.'
        );
      }
      return { status: 'aborted' };
    }

    const supportValue =
      options.providerInitializationResult?.provider.input?.quickActions
        ?.supported?.[options.quickAction.id];

    if (supportValue == null) {
      throw new Error(
        '[Generate] Quick action input mapping failed. Ensure the provider supports this quick action.'
      );
    }

    // Handle both `true` and `{ mapInput: ... }` cases
    const mapInput =
      typeof supportValue === 'object' &&
      supportValue !== null &&
      'mapInput' in supportValue
        ? supportValue.mapInput
        : (i: Q) => i as unknown as I; // Identity function when types are compatible

    options.close();

    const abortController = new AbortController();
    const abortSignal = AbortSignal.any(
      [options.abortSignal, abortController.signal].filter(isDefined)
    );

    const metadata = new Metadata<InferenceMetadata>(
      options.cesdk.engine,
      AI_METADATA_KEY
    );

    const unlockFromEditMode =
      options.lock ?? true
        ? lockSelectionToEditMode({
            engine: options.cesdk.engine,
            editModeToLockTo: AI_EDIT_MODE,
            blockIdsToLock: targetBlockIds
          })
        : () => {
            /* No-op if not locking to edit mode */
          };
    targetBlockIds.forEach((blockId) => {
      CallbacksRegistry.get().register(blockId, {
        onCancelGeneration: () => {
          abortController.abort(ABORT_REASON_USER_CANCEL);
          unlockFromEditMode();

          if (options.cesdk.engine.block.isValid(blockId)) {
            if (options.cesdk.engine.block.isValid(blockId))
              options.cesdk.engine.block.setState(blockId, { type: 'Ready' });
            metadata.clear(blockId);
          }
        }
      });
    });

    targetBlockIds?.forEach((blockId) => {
      metadata.set(blockId, {
        status: 'processing',
        quickActionId: options.quickAction.id
      });
    });
    targetBlockIds.forEach((blockId) => {
      if (options.cesdk.engine.block.isValid(blockId))
        options.cesdk.engine.block.setState(blockId, {
          type: 'Pending',
          progress: 0
        });
    });

    try {
      const result = await options.providerInitializationResult.generate(
        mapInput(input),
        {
          middlewares: [...(options.middlewares ?? [])],
          debug: options.debug,
          dryRun: options.dryRun,
          abortSignal
        }
      );

      const resultStatus = result.status;
      switch (resultStatus) {
        case 'success': {
          const { applyCallbacks: initialApplyCallbacks } =
            await getApplyCallbacks(result, {
              kind: options.providerInitializationResult.provider.kind,
              blockIds: targetBlockIds,
              cesdk: options.cesdk,
              abortSignal
            });

          // Set the blocks to a ready state AFTER `getApplyCallbacks` was called since
          // it will set the block to the "after" image and until then we still want
          // the spinner spinning.
          targetBlockIds.forEach((blockId) => {
            if (options.cesdk.engine.block.isValid(blockId))
              options.cesdk.engine.block.setState(blockId, { type: 'Ready' });
          });

          if (options.confirmation) {
            // For the same as the Ready state, we do this AFTER `getApplyCallbacks` was called
            targetBlockIds.forEach((blockId) => {
              // Metadata will be cleared in the confirmation component
              // see createConfirmationRenderFunction.ts
              metadata.set(blockId, {
                status: 'confirmation',
                quickActionId: options.quickAction.id
              });
            });

            const applyCallbacks = {
              ...initialApplyCallbacks,
              onApply: async () => {
                initialApplyCallbacks.onApply();
                unlockFromEditMode();
              },
              onCancel: () => {
                initialApplyCallbacks.onCancel();
                unlockFromEditMode();
              }
            };

            targetBlockIds.forEach((blockId) => {
              CallbacksRegistry.get().register(blockId, { applyCallbacks });
            });
          } else {
            targetBlockIds.forEach((blockId) => {
              if (options.cesdk.engine.block.isValid(blockId)) {
                metadata.clear(blockId);
              }
            });
            // Apply the result directly
            initialApplyCallbacks.onApply();
            unlockFromEditMode();
          }

          return result;
        }

        case 'aborted': {
          if (options.debug) {
            // eslint-disable-next-line no-console
            console.log('Generation was aborted');
          }
          unlockFromEditMode();
          targetBlockIds.forEach((blockId) => {
            if (options.cesdk.engine.block.isValid(blockId)) {
              metadata.clear(blockId);
            }
          });
          return result;
        }

        case 'error': {
          unlockFromEditMode();
          targetBlockIds.forEach((blockId) => {
            if (options.cesdk.engine.block.isValid(blockId)) {
              metadata.clear(blockId);
            }
          });
          // eslint-disable-next-line no-console
          console.error(`[Generate]: ${result.message}`);
          return result;
        }

        default: {
          throw new Error(`[Generate] Unknown result status ${resultStatus}.`);
        }
      }
    } catch (error) {
      options.cesdk.ui.showNotification({
        type: 'error',
        message: 'A technical issue has occurred.'
      });

      unlockFromEditMode();
      targetBlockIds.forEach((blockId) => {
        if (options.cesdk.engine.block.isValid(blockId)) {
          metadata.clear(blockId);
        }
      });
      throw error;
    } finally {
      targetBlockIds.forEach((blockId) => {
        if (options.cesdk.engine.block.isValid(blockId))
          options.cesdk.engine.block.setState(blockId, { type: 'Ready' });
      });
    }
  };
}

export default handleGenerateFromQuickAction;
