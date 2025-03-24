import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type CreativeEngine } from '@cesdk/cesdk-js';
import type Provider from './provider';

/**
 * Configuration options for provider initialization
 */
export type InitProviderConfiguration = {
  /**
   * Whether to enable debug mode
   */
  debug?: boolean;

  /**
   * If true the generation process wll be replaced with a dummy generation.
   * Useful for testing the UI without actually generating images.
   */
  dryRun?: boolean;

  /**
   * Is called after an error occurred during the generation process.
   * Can be used to show an error message to the user, e.g. with the
   * Dialog or Notification API
   *
   * The default implementation logs the error to the console and
   * shows a notification to the user.
   */
  onError?: (error: unknown) => void;

  /**
   * Is called when the generation process is started. Can be used to
   * extend the generation process with additional steps.
   *
   * @param generate A function that starts the actual generation process.
   */
  middleware?: GenerationMiddleware;
};

export type GenerationMiddleware = (
    generate: () => Promise<void>,
    context: {
      provider: Provider<any, any, any>;
      abort: () => void;
    }
  ) => Promise<void>;

/**
 * Options for UI interactions
 */
export type UIOptions = {
  cesdk: CreativeEditorSDK;
  engine: CreativeEngine;
  historyAssetSourceId?: string;
  historyAssetLibraryEntryId?: string;
  i18n?: {
    prompt?: string;
  };
};

/**
 * Basic context for provider initialization
 */
export type Options = {
  cesdk?: CreativeEditorSDK;
  engine: CreativeEngine;
};
