import CreativeEditorSDK, {
  BuilderRenderFunction,
  CreativeEngine
} from '@cesdk/cesdk-js';
import Provider, { Output, OutputKind } from './provider';
import createConfirmationRenderFunction from './createConfirmationRenderFunction';
import createQuickActionMenuRenderFunction from './createQuickActionMenuRenderFunction';
import { INFERENCE_AI_EDIT_MODE } from './quickAction/utils';

async function initializeQuickActionComponents<
  K extends OutputKind,
  I,
  O extends Output
>(context: {
  kind: K;
  providers: Provider<K, I, O>[];

  cesdk: CreativeEditorSDK;
  engine: CreativeEngine;
}) {
  const menuRenderFunction = await createQuickActionMenuRenderFunction({
    kind: context.kind,

    cesdk: context.cesdk,
    engine: context.engine
  });
  const confirmationRenderFunction = await createConfirmationRenderFunction({
    kind: context.kind
  });

  const builderRenderFunction: BuilderRenderFunction<any> = (
    builderContext
  ) => {
    const { engine } = builderContext;
    if (engine.editor.getEditMode() === INFERENCE_AI_EDIT_MODE) {
      confirmationRenderFunction({
        ...builderContext,
        payload: {
          ...(builderContext.payload ?? {}),
          applyCallbacks: {
            onBefore: () => {
              // This is a placeholder for any logic that should run before applying
            },
            onAfter: () => {
              // This is a placeholder for any logic that should run after applying
            },
            onCancel: () => {
              // This is a placeholder for any logic that should run when canceling
            },
            onApply: () => {
              // This is a placeholder for any logic that should run when applying
            }
          },
          unlock: () => {
            // Logic to unlock the UI or state
          },
          abort: () => {
            // Logic to abort the current operation
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
