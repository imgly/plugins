import { Output, type QuickAction } from '../provider';

export type QuickActionId = 'ly.img.separator' | (string & {});

export interface QuickActionMenu {
  id: string;
  registerQuickAction: <I, O extends Output>(
    quickAction: QuickAction<I, O>
  ) => void;
  setQuickActionMenuOrder: (quickActionIds: QuickActionId[]) => void;
  getQuickActionMenuOrder: () => string[];
  getQuickAction: <I, O extends Output>(
    magicId: QuickActionId
  ) => QuickAction<I, O> | undefined;
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
