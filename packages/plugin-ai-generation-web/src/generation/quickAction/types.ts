import { createHandleGenerationError } from '../handleGenerationError';
import { type Output, type QuickAction } from '../provider';

export type QuickActionId = 'ly.img.separator' | (string & {});

export type ApplyCallbacks = {
  onBefore?: () => void;
  onAfter?: () => void;
  onCancel?: () => void;
  onApply: () => void;
};

export type QuickActionGenerateFunction<I, O extends Output> = (options: {
  input: I;
  blockIds: number[];
  abortSignal: AbortSignal;
  confirmationComponentId: string;
}) => Promise<{
  dispose: () => void;
  returnValue: O;
  applyCallbacks?: ApplyCallbacks;
}>;

export interface QuickActionMenu {
  id: string;
  registerQuickAction: <I, O extends Output>(
    quickAction: RegisteredQuickAction<I, O>
  ) => void;
  getQuickAction: <I, O extends Output>(
    magicId: QuickActionId
  ) => RegisteredQuickAction<I, O> | undefined;
}

export interface RegisteredQuickAction<I, O extends Output>
  extends QuickAction<I, O> {
  generate: QuickActionGenerateFunction<I, O>;
  onError: ReturnType<typeof createHandleGenerationError<any, I, O>>;
}

export type InferenceStatus = 'processing' | 'confirmation';

export type InferenceProcessingMetadata = {
  status: 'processing';
  quickActionId: string;
};

export type InferenceConfirmationMetadata = {
  status: 'confirmation';
  quickActionId: string;
};

export type InferenceMetadata =
  | InferenceProcessingMetadata
  | InferenceConfirmationMetadata;
