import { BuilderRenderFunction } from '@cesdk/cesdk-js';
import { InferenceMetadata } from './quickAction/types';
import { Metadata } from '@imgly/plugin-utils';
import { INFERENCE_AI_METADATA_KEY } from './quickAction/utils';
import { OutputKind } from './provider';

export type ApplyCallbacks = {
  onBefore?: () => void;
  onAfter?: () => void;
  onCancel?: () => void;
  onApply: () => void;
};

export interface ConfirmationCallbacks {
  unlock: () => void;
  abort: () => void;
  applyCallbacks: ApplyCallbacks | undefined;
}

/**
 * Creates a render function for the AI inference confirmation component.
 *
 * It will render 'cancel', 'before', 'after', and 'apply' buttons once the
 * inference is done. Until then a loading spinner is shown with a cancel button.
 *
 * The callbacks are provided by the payload from the context.
 */
async function createConfirmationRenderFunction<K extends OutputKind>(context: {
  kind: K;
}): Promise<BuilderRenderFunction<ConfirmationCallbacks>> {
  const prefix = `ly.img.ai.${context.kind}.confirmation`;
  const builderRenderFunction: BuilderRenderFunction<ConfirmationCallbacks> = (
    builderContext
  ) => {
    const { engine, builder, state, payload } = builderContext;
    if (payload == null) return;

    const blockIds = engine.block.findAllSelected();
    if (blockIds.length === 0) return null;

    const md = new Metadata<InferenceMetadata>(
      engine,
      INFERENCE_AI_METADATA_KEY
    );

    // All blocks must have the same metadata
    const metadata = md.get(blockIds[0]);
    if (metadata == null) return null;

    const clearMetadata = () => {
      blockIds.forEach((blockId) => {
        md.clear(blockId);
      });
    };

    switch (metadata.status) {
      case 'processing': {
        builder.Button(`${prefix}.spinner`, {
          label: [
            `ly.img.ai.inference.${metadata.quickActionId}.processing`,
            `${prefix}.cancel`
          ],
          isLoading: true
        });
        builder.Separator(`${prefix}.separator`);
        builder.Button(`${prefix}.cancel`, {
          icon: '@imgly/Cross',
          tooltip: `${prefix}.cancel`,
          onClick: () => {
            payload.abort();
            clearMetadata();
          }
        });

        break;
      }

      case 'confirmation': {
        const comparingState = state<'before' | 'after'>(
          `${prefix}.comparing`,
          'after'
        );

        const onCancel = payload.applyCallbacks?.onCancel;
        if (onCancel != null) {
          builder.Button(`${prefix}.cancel`, {
            icon: '@imgly/Cross',
            tooltip: `${prefix}.cancel`,
            onClick: () => {
              payload.unlock();
              onCancel();
              clearMetadata();
            }
          });
        }

        const onBefore = payload.applyCallbacks?.onBefore;
        const onAfter = payload.applyCallbacks?.onAfter;

        if (onBefore != null && onAfter != null) {
          builder.ButtonGroup(`${prefix}.compare`, {
            children: () => {
              builder.Button(`${prefix}.compare.before`, {
                label: `${prefix}.before`,
                variant: 'regular',
                isActive: comparingState.value === 'before',
                onClick: () => {
                  onBefore();
                  comparingState.setValue('before');
                }
              });
              builder.Button(`${prefix}.compare.after`, {
                label: `${prefix}.after`,
                variant: 'regular',
                isActive: comparingState.value === 'after',
                onClick: () => {
                  onAfter();
                  comparingState.setValue('after');
                }
              });
            }
          });
        }

        const onApply = payload.applyCallbacks?.onApply;
        if (onApply != null) {
          builder.Button(`${prefix}.apply`, {
            icon: '@imgly/Checkmark',
            tooltip: `${prefix}.apply`,
            color: 'accent',
            isDisabled: comparingState.value !== 'after',
            onClick: () => {
              payload.unlock();
              clearMetadata();

              // Activating the old history happens in the next update lop.
              // @ts-ignore
              cesdk.engine.editor._update();

              onApply();
            }
          });
        }

        break;
      }

      default: {
        // noop
      }
    }
  };
  return Promise.resolve(builderRenderFunction);
}

export default createConfirmationRenderFunction;
