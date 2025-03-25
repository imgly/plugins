import CreativeEditorSDK from '@cesdk/cesdk-js';
import { Metadata } from '@imgly/plugin-utils';
import { ApplyInferenceResult, InferenceMetadata, MagicEntry } from './types';
import { INFERENCE_AI_EDIT_MODE, INFERENCE_AI_METADATA_KEY } from './utils';
import { extractErrorMessage } from '../utils';

export async function applyInference(
  cesdk: CreativeEditorSDK,
  magicEntry: MagicEntry,
  abortSignal: AbortSignal,
  payload?: any
): Promise<
  { unlock: () => void; appltInferenceResult: ApplyInferenceResult } | undefined
> {
  if (magicEntry.applyInference == null) return;
  const blockId = magicEntry.getBlockId({ cesdk });
  if (blockId == null) {
    return undefined;
  }

  cesdk.engine.block.setState(blockId, { type: 'Pending', progress: 0 });
  const unlock = lockSelectionInEditMode(
    cesdk,
    [blockId],
    INFERENCE_AI_EDIT_MODE
  );
  const metadata = new Metadata<InferenceMetadata>(
    cesdk.engine,
    INFERENCE_AI_METADATA_KEY
  );

  let onCancel: (() => void) | undefined;
  let result: ApplyInferenceResult;
  try {
    metadata.set(blockId, { status: 'processing', entryId: magicEntry.id });

    result = await magicEntry.applyInference(blockId, {
      cesdk,
      abortSignal,
      payload
    });
    onCancel = result.onCancel;
    if (abortSignal.aborted) {
      unlock();
      onCancel();
      return undefined;
    } else {
      metadata.set(blockId, {
        status: 'confirmation',
        entryId: magicEntry.id
      });
    }
  } catch (error) {
    if (abortSignal.aborted) {
      onCancel?.();
    } else {
      // eslint-disable-next-line no-console
      console.error('Inference failed:', error);
      cesdk.ui.showNotification({
        type: 'error',
        message: extractErrorMessage(error)
      });
    }

    unlock();
    return undefined;
  } finally {
    cesdk.engine.block.setState(blockId, { type: 'Ready' });
  }

  return {
    unlock,
    appltInferenceResult: result
  };
}

/**
 * Locks the selection to the given block ids with the given edit mode.
 *
 * @returns A function to unlock the selection. Will set the edit mode back to what it was before the lock.
 */
function lockSelectionInEditMode(
  cesdk: CreativeEditorSDK,
  blockIdsToLockOn: number[],
  editModeToLock: string
) {
  const globalScopeBeforeLock =
    cesdk.engine.editor.getGlobalScope('editor/select');
  const editModeBeforeLock = cesdk.engine.editor.getEditMode();
  selectOnlyBlockIds();
  cesdk.engine.editor.setGlobalScope('editor/select', 'Deny');
  cesdk.engine.editor.setEditMode(editModeToLock);

  function selectOnlyBlockIds() {
    cesdk.engine.block.findAllSelected().forEach((currentlySelectedBlockId) => {
      if (!blockIdsToLockOn.includes(currentlySelectedBlockId)) {
        cesdk.engine.block.setSelected(currentlySelectedBlockId, false);
      }
    });

    blockIdsToLockOn.forEach((blockId) => {
      cesdk.engine.block.setSelected(blockId, true);
    });
  }

  const stateChangeDisposer = cesdk.engine.editor.onStateChanged(() => {
    const editMode = cesdk.engine.editor.getEditMode();
    if (editMode !== editModeToLock) {
      cesdk.engine.editor.setEditMode(editModeToLock);
    }
  });

  const selectionDisposer =
    cesdk.engine.block.onSelectionChanged(selectOnlyBlockIds);

  const dispose = () => {
    if (globalScopeBeforeLock != null) {
      cesdk.engine.editor.setGlobalScope(
        'editor/select',
        globalScopeBeforeLock
      );
    }

    cesdk.engine.editor.setEditMode(editModeBeforeLock);

    selectionDisposer();
    stateChangeDisposer();
  };

  return dispose;
}

export default applyInference;
