import CreativeEditorSDK, {
  BuilderRenderFunction,
  CreativeEngine
} from '@cesdk/cesdk-js';
import { Output, OutputKind } from '../../core/provider';
import createConfirmationRenderFunction from '../panels/createConfirmationRenderFunction';
import createQuickActionMenuRenderFunction from './createQuickActionMenuRenderFunction';
import { AI_EDIT_MODE } from './utils';
import { ProviderInitializationResult } from '../../providers/initializeProvider';
import CallbacksRegistry from '../../generation/CallbacksRegistry';

async function initializeQuickActionComponents<
  K extends OutputKind,
  I,
  O extends Output
>(context: {
  kind: K;
  providerInitializationResults: ProviderInitializationResult<K, I, O>[];

  cesdk: CreativeEditorSDK;
  engine: CreativeEngine;
}) {
  const menuRenderFunction = await createQuickActionMenuRenderFunction({
    kind: context.kind,
    providerInitializationResults: context.providerInitializationResults,

    cesdk: context.cesdk,
    engine: context.engine
  });
  const confirmationRenderFunction = await createConfirmationRenderFunction({
    kind: context.kind,

    cesdk: context.cesdk
  });

  const builderRenderFunction: BuilderRenderFunction<any> = (
    builderContext
  ) => {
    const { engine } = builderContext;
    if (engine.editor.getEditMode() === AI_EDIT_MODE) {
      const blockIds = builderContext.engine.block.findAllSelected();
      confirmationRenderFunction({
        ...builderContext,
        payload: {
          ...(builderContext.payload ?? {}),
          applyCallbacks: {
            onBefore: () => {
              blockIds.forEach((blockId) => {
                CallbacksRegistry.get()
                  .get(blockId)
                  .applyCallbacks?.onBefore?.();
              });
            },
            onAfter: () => {
              blockIds.forEach((blockId) => {
                CallbacksRegistry.get()
                  .get(blockId)
                  .applyCallbacks?.onAfter?.();
              });
            },
            onCancel: () => {
              blockIds.forEach((blockId) => {
                CallbacksRegistry.get()
                  .get(blockId)
                  .applyCallbacks?.onCancel?.();
              });
            },
            onApply: () => {
              blockIds.forEach((blockId) => {
                CallbacksRegistry.get()
                  .get(blockId)
                  .applyCallbacks?.onApply?.();
              });
            }
          },
          onCancelGeneration: () => {
            blockIds.forEach((blockId) => {
              CallbacksRegistry.get().get(blockId).onCancelGeneration?.();
            });
          }
        }
      });
      return;
    }

    menuRenderFunction(builderContext);
  };

  return {
    renderFunction: builderRenderFunction
  };
}

export default initializeQuickActionComponents;
