import CreativeEditorSDK from '@cesdk/cesdk-js';
import { InferenceMetadata, QuickActionMenu, ApplyCallbacks } from './types';
import { INFERENCE_AI_EDIT_MODE, INFERENCE_AI_METADATA_KEY } from './utils';
import { Metadata } from '@imgly/plugin-utils';
import Provider, {
  GenerationOptions,
  Output,
  OutputKind,
  QuickAction
} from '../provider';
import { composeMiddlewares } from '../middleware/middleware';
import loggingMiddleware from '../middleware/loggingMiddleware';
import highlightBlocksMiddleware from '../middleware/highlightBlocksMiddleware';
import pendingMiddleware from '../middleware/pendingMiddleware';
import lockMiddleware from '../middleware/lockMiddleware';
import consumeGeneratedResult from './consumeGeneratedResult';
import editModeMiddleware from '../middleware/editModeMiddleware';
import dryRunMiddleware from '../middleware/dryRunMiddleware';
import { CommonConfiguration } from '../../types';

async function generate<K extends OutputKind, I, O extends Output>(
  options: {
    input: I;
    blockIds: number[];
    cesdk: CreativeEditorSDK;
    quickAction: QuickAction<I, O>;
    quickActionMenu: QuickActionMenu;
    provider: Provider<K, I, O>;
    abortSignal: AbortSignal;
    confirmationComponentId: string;
  },
  config: CommonConfiguration<I, O>
): Promise<{
  dispose: () => void;
  returnValue: O;
  applyCallbacks?: ApplyCallbacks;
}> {
  const {
    cesdk,
    input,
    blockIds,
    provider,
    quickAction,
    confirmationComponentId,
    abortSignal
  } = options;
  if (quickAction.confirmation) {
    cesdk.ui.setCanvasMenuOrder([confirmationComponentId], {
      editMode: INFERENCE_AI_EDIT_MODE
    });
  }

  const metadata = new Metadata<InferenceMetadata>(
    cesdk.engine,
    INFERENCE_AI_METADATA_KEY
  );
  blockIds.forEach((blockId) => {
    metadata.set(blockId, {
      status: 'processing',
      quickActionId: quickAction.id
    });
  });

  const generationOptions: GenerationOptions = {
    cesdk,
    engine: cesdk.engine,
    abortSignal
  };

  const composedMiddlewares = composeMiddlewares<I, O>([
    ...(provider.output.middleware ?? []),
    ...(config.middlewares ?? []),
    config.debug ? loggingMiddleware() : undefined,
    pendingMiddleware({}),
    ...(quickAction.confirmation
      ? [
          quickAction.lockDuringConfirmation
            ? lockMiddleware<I, O>({
                editMode: INFERENCE_AI_EDIT_MODE
              })
            : editModeMiddleware<I, O>({
                editMode: INFERENCE_AI_EDIT_MODE
              }),
          quickAction.confirmation && highlightBlocksMiddleware<I, O>({})
        ]
      : []),
    config.dryRun
      ? dryRunMiddleware({ kind: provider.kind, blockIds })
      : undefined
  ]);

  const { result: generationResult, dispose: generationDispose } =
    await composedMiddlewares(provider.output.generate)(
      input,
      generationOptions
    );

  const { consumedGenerationResult, applyCallbacks } =
    await consumeGeneratedResult(generationResult, {
      abortSignal,
      kind: provider.kind,
      blockIds,
      cesdk
    });

  if (quickAction.confirmation) {
    blockIds.forEach((blockId) => {
      metadata.set(blockId, {
        status: 'confirmation',
        quickActionId: quickAction.id
      });
    });
  } else {
    applyCallbacks.onApply();
    blockIds.forEach((blockId) => {
      metadata.clear(blockId);
    });
  }

  const dispose = () => {
    generationDispose();
    blockIds.forEach((blockId) => {
      metadata.clear(blockId);
    });
  };

  abortSignal.addEventListener('abort', dispose);

  return {
    dispose,
    returnValue: consumedGenerationResult,
    applyCallbacks
  };
}

export default generate;
