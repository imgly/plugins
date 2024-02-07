import { type Source } from '@cesdk/cesdk-js';

export type PluginStatusIdle = { status: 'IDLE' };
// export type PluginStatusPending = { status: 'PENDING' };

export type PluginStatusProcessing = {
  version: string;
  status: 'PROCESSING';

  initialImageFileURI: string;
  initialSourceSet: Source[];

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
  status: 'PROCESSED'

  initialImageFileURI: string;
  initialSourceSet: Source[];

  blockId: number;
  fillId: number;

  processedAsset: string | Source[];
};

export type PluginStatusError = {
  version: string;
  status: 'ERROR';

  initialImageFileURI: string;
  initialSourceSet: Source[];

  blockId: number;
  fillId: number;
};

export type PluginMetadata =
  | PluginStatusIdle
  | PluginStatusError
  | PluginStatusProcessing
  | PluginStatusProcessed;



