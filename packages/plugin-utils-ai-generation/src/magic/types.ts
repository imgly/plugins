import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type BuilderRenderFunctionContext } from '@cesdk/cesdk-js';

export interface MagicContext {
  toggleEditState: () => void;
  closeMenu: () => void;
  applyInference: (payload?: any) => void;
}

export interface ApplyInferenceResult {
  onCancel(): void;
  onBefore(): void;
  onAfter(): void;
  onApply(): void;
}

export interface MagicEntry {
  id: string;
  getBlockId: (options: { cesdk: CreativeEditorSDK }) => number | undefined;
  renderEditState?: (
    context: BuilderRenderFunctionContext<any>,
    magicContext: MagicContext
  ) => void;
  renderMenuEntry: (
    context: BuilderRenderFunctionContext<any>,
    magicContext: MagicContext
  ) => void;
  applyInference: (
    blockId: number,
    options: { cesdk: CreativeEditorSDK; abortSignal: AbortSignal, payload?: any }
  ) => Promise<ApplyInferenceResult>;
}

export type MagicId = 'ly.img.separator' | (string & {});

export interface MagicMenu {
  id: string;
  registerMagicEntry: (magicEntry: MagicEntry) => void;
  setMagicOrder: (magicIds: MagicId[]) => void;
  getMagicOrder: () => string[];
  getMagicEntry: (magicId: MagicId) => MagicEntry | undefined;
}

export type InferenceStatus = 'processing' | 'confirmation';

export type InferenceProcessingMetadata = {
  status: 'processing';
  entryId: string;
};

export type InferenceConfirmationMetadata = {
  status: 'confirmation';
  entryId: string;
};

export type InferenceMetadata =
  | InferenceProcessingMetadata
  | InferenceConfirmationMetadata;
