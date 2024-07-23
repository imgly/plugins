import { type Source } from '@cesdk/cesdk-js';

export type PluginStatusIdle = { status: 'IDLE' };
export type PluginStatusPending = { status: 'PENDING' };

export type PluginStatusProcessing = {
  version: string;
  status: 'PROCESSING';

  initialSourceSet: Source[];
  initialPreviewFileURI: string;

  blockId: number;
  fillId: number;

  progress?: {
    key: string;
    current: number;
    total: number;
  };
};

export type PluginStatusProcessed = {
  version: string;
  status: 'PROCESSED';

  initialSourceSet: Source[];
  initialPreviewFileURI: string;

  blockId: number;
  fillId: number;

  processed: string | Source[];
};

export type PluginStatusError = {
  version: string;
  status: 'ERROR';

  initialSourceSet: Source[];
  initialPreviewFileURI: string;

  blockId: number;
  fillId: number;
};

export type PluginStatusMetadata =
  | PluginStatusIdle
  | PluginStatusError
  | PluginStatusPending
  | PluginStatusProcessing
  | PluginStatusProcessed;
