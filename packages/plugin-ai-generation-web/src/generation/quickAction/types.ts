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
