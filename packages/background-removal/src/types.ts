import { type Source } from '@cesdk/cesdk-js';

export type PluginStatusIdle = { status: 'IDLE' };
export type PluginStatusPending = { status: 'PENDING' };

export type PluginStatusProcessing = {
  version: string;
  status: 'PROCESSING';

  initialImageFileURI: string;
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

  initialImageFileURI: string;
  initialSourceSet: Source[];
  initialPreviewFileURI: string;

  blockId: number;
  fillId: number;

  removedBackground: string | Source[];
};

export type PluginStatusError = {
  version: string;
  status: 'ERROR';

  initialImageFileURI: string;
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

export type DefaultLocation = 'canvasMenu';

export interface UserInterfaceConfiguration {
  defaultLocations?: DefaultLocation | DefaultLocation[];
}
