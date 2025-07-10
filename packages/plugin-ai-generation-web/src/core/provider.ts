import { type OpenAPIV3 } from 'openapi-types';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  type NotificationDuration,
  type BuilderRenderFunctionContext,
  type CreativeEngine
} from '@cesdk/cesdk-js';
import { GetPropertyInput, Property } from '../openapi/types';
import { Middleware } from '../middleware/middleware';

interface Provider<K extends OutputKind, I, O extends Output, C = O> {
  /**
   * Defines the kind of the generated asset. Maps to the kind
   * CE.SDK
   */
  kind: K;

  /**
   * The unique identifier of the provider. Is used to generate other
   * identifiers, like the panel ID or keys for translation.
   */
  id: string;

  /**
   * The human-readable name of the provider.
   */
  name?: string;

  /**
   * Initialize the provider when the plugin is loaded.
   * Can be used to initialize libraries, and register additional UI components.
   */
  initialize?: (options: {
    engine: CreativeEngine;

    /**
     * If undefined, this indicates that the plugin was loaded
     * just with the engine and probably without an UI.
     */
    cesdk?: CreativeEditorSDK;
  }) => Promise<void>;

  /**
   * Defines what inputs are needed for the generation and how
   * to create an UI for them.
   */
  input: {
    /**
     * Is used to generate panel content for the input.
     */
    panel?: PanelInput<K, I>;

    /**
     * Defines the input for the generation.
     */
    quickActions?: QuickActionsInput<I>;
  };

  /**
   * Defines the output of the provider, i.e. the asset gneration.
   */
  output: {
    /**
     * Can the generation of the output be aborted?
     */
    abortable?: boolean;

    /**
     * Defines if a generated asset should be stored in the history.
     *
     * - false: The generated asset is not stored in the history.
     * - `@imgly/local`: The asset is stored in a local asset source. On reload, the generated assets are gone.
     * - '@imgly/indexedDB': The asset is stored in the browser's indexed db. On reload, the generated assets are still available, but only in the same browser.
     * - string: Any other string is used as the asset source ID. The user has to add the asset source during initialization. This can be used for instance to store generated assets in a outside database.
     */
    history?: false | '@imgly/local' | '@imgly/indexedDB' | (string & {});

    /**
     * Configure if and what notification is shown after success and error.
     */
    notification?: {
      /**
       * Configure if and what notification is shown when the asset is generated.
       */
      success?: {
        /**
         * If true, the notification is shown. If false, the notification is not shown.
         * Can be a function that returns a boolean.
         */
        show?: boolean | ((context: { input: I; output: O }) => boolean);

        /**
         * The message that is shown when the asset generation was successful. Can be a i18n key.
         * A function can be used to dynamically generate the message based on the input and output.
         */
        message?: string | ((context: { input: I; output: O }) => string);

        /**
         * The action that is shown when the asset generation was successful.
         */
        action?: {
          label: string | ((context: { input: I; output: O }) => string);
          onClick: (context: { input: I; output: O }) => void;
        };

        /**
         * The duration the notification is shown.
         */
        duration?: NotificationDuration;
      };

      /**
       * Configure if and what notification is shown when generation failed
       * If not set, a generic error message is shown.
       */
      error?: {
        show?: boolean | ((context: { input?: I; error: unknown }) => boolean);

        /**
         * The message that is shown when the asset generation failed. Can be a i18n key.
         * A function can be used to dynamically generate the message based on the input and output.
         */
        message?: string | ((context: { input?: I; error: unknown }) => string);

        /**
         * The action that is shown when the asset generation failed.
         */
        action?: {
          label: string | ((context: { input?: I; error: unknown }) => string);
          onClick: (context: { input?: I; error: unknown }) => void;
        };

        /**
         * The duration the notification is shown.
         */
        duration?: NotificationDuration;
      };
    };

    /**
     * Generate the asset given the input.
     *
     * @returns The generated asset
     */
    generate: (
      input: I,
      options: GenerationOptions
    ) => Promise<GenerationResult<O, C>>;

    /**
     * Short informational text to display below the generation button.
     */
    generationHintText?: string;

    /**
     * Middlware functions that can be used to hook into the
     * generation process.
     */
    middleware?: Middleware<I, O>[];
  };
}

/**
 * The result of the generation function.
 *
 * Is either a promise that is directly returning
 * the result of the generation, or an async generator
 * that streams the result in chunks (C) and finally
 * returns the final result (O).
 */
export type GenerationResult<O extends Output, C = O> =
  | O
  | AsyncGenerator<O, C>;

/**
 * The options for the generation function.
 */
export type GenerationOptions = {
  abortSignal?: AbortSignal;
  engine: CreativeEngine;
  cesdk?: CreativeEditorSDK;
};

export type RenderCustomProperty = {
  [key: string]: (
    context: BuilderRenderFunctionContext<any>,
    property: Property
  ) => GetPropertyInput;
};

export type PanelInput<K extends OutputKind, I> =
  | PanelInputCustom<K, I>
  | PanelInputSchema<K, I>;

interface PanelInputBase {
  /**
   * Determines the flow of the asset generation.
   *
   * - `placeholder`: When `Generate` is clicked, the asset generation is triggered and a block is created as a placeholder with a loading state. Once the asset is generated, the block is updated with the asset and we add a history entry.
   * - `generation-only`: When `Generate` is clicked, only the asset generation is triggered. No block is created.
   *
   *   @default 'generation-only'
   */
  userFlow?: 'placeholder' | 'generation-only';

  /**
   * If true, the history library is appended to the panel.
   *
   * @default true
   */
  includeHistoryLibrary?: boolean;
}

export interface PanelInputSchema<K extends OutputKind, I>
  extends PanelInputBase {
  type: 'schema';

  /**
   * The OpenAPI document/schema for a service.
   */
  document: OpenAPIV3.Document;

  /**
   * The reference to the input in the OpenAPI document.
   * This is used to determine the input components for the generation panel.
   *
   * @example
   * `#/components/schemas/GenerationInput`
   */
  inputReference: string;

  /**
   * The keyword that determines the order of properties. the
   * referenced extension keyword should contain an array of strings
   * representing the properties.
   */
  orderExtensionKeyword?: string | string[];

  /**
   * Defined the order of the properties in the panel. Takes precedence over
   * the order defined in the schema (also see `orderExtensionKeyword`).
   *
   * If a function is provided, it receives the current order of properties from
   * the schema and can return a new order.
   */
  order?: string[] | ((order: string[]) => string[]);

  /**
   * Returns the necessary input for the creation of a block.
   *
   */
  getBlockInput: GetBlockInput<K, I>;

  /**
   * Allows to customize the components for some properties.
   */
  renderCustomProperty?: RenderCustomProperty;
}

export interface PanelInputCustom<K extends OutputKind, I>
  extends PanelInputBase {
  type: 'custom';
  /**
   * Is called to render custom UI components for the generation panel.
   *
   * @returns A function that returns the current input state and the context when called.
   *
   * @example
   *
     ```ts
     render: ({ builder, state }, options) => {
       const promptState = state('prompt', '');
       builder.TextArea('prompt', {
         label: 'Prompt',
         ...promptState
       });

       return {
         getInput: () => ({ prompt: promptState.value }),
         getBlockInput: () => ({ image: { width: 1024, height: 1024 } })
       };
     }
     ```
   */
  render: (
    context: BuilderRenderFunctionContext<any>,
    options: { cesdk: CreativeEditorSDK; isGenerating: boolean }
  ) => {
    getInput: GetInput<I>;
    getBlockInput: GetBlockInput<K, I>;
  };
}

/**
 * Returns the current input state when called.
 * This input is used for the AI generation
 */
export type GetInput<I> = () => {
  input: I;
};

/**
 * Returns the input that is needed to create a block
 * for a given output kind.
 */
export type GetBlockInput<K extends OutputKind, I> = (
  input: I
) => Promise<GetBlockInputResult<K>>;

export type GetBlockInputResult<K extends OutputKind> = Record<
  K,
  InputByKind[K]
>;

/**
 * All possible output kinds.
 */
export type OutputKind = 'image' | 'video' | 'audio' | 'text' | 'sticker';

/**
 * Mandatory kind-specific input needed for the generation.
 */
export type InputByKind = {
  image: { label?: string; width: number; height: number };
  video: { label?: string; width: number; height: number; duration: number };
  audio: { label?: string; thumbnailUrl?: string; duration?: number };
  text: { label?: string; length: number };
  sticker: { label?: string; width: number; height: number };
};

/**
 * The generated output of the provider.
 */
export type Output =
  | ImageOutput
  | VideoOutput
  | AudioOutput
  | TextOutput
  | StickerOutput;

type OutputBase<K extends OutputKind> = {
  kind: K;
};

export interface ImageOutput extends OutputBase<'image'> {
  kind: 'image';
  url: string;
}

export interface VideoOutput extends OutputBase<'video'> {
  kind: 'video';
  url: string;
}

export interface AudioOutput extends OutputBase<'audio'> {
  kind: 'audio';
  url: string;
  duration: number;
  thumbnailUrl?: string;
}

export interface TextOutput extends OutputBase<'text'> {
  kind: 'text';
  text: string;
}

export interface StickerOutput extends OutputBase<'sticker'> {
  kind: 'sticker';
  url: string;
}

export type QuickActionContext<I, O extends Output> = {
  blockIds: number[];
  closeMenu: () => void;
  toggleExpand: () => void;

  /**
   * Trigger generation with the given input.
   *
   * @param input The input for the generation.
   * @param options The options for the generation.
   * @param options.blockIds Use these blocks ids for the generation instead of the currently selected blocks.
   */
  generate: (input: I, options?: { blockIds?: number[] }) => Promise<O>;

  /**
   * Can be called to show a notification after the generation as it is
   * configured for the provider.
   */
  handleGenerationError: (error: unknown) => void;
};

/**
 * Support mapping for a specific quick action.
 * Maps quick action input to provider input.
 * Allows `true` or empty object `{}` as shorthand when quick action input is compatible with provider input.
 */
export type QuickActionSupport<I> =
  | true
  | {
      /**
       * Map quick action input to provider input.
       * @param quickActionInput The input from the quick action
       * @returns The mapped input for the provider
       */
      mapInput: (quickActionInput: any) => I;
    }
  | {
      // Allow objects without mapInput for future extensibility
      // Type safety will be enforced at the plugin level
      [key: string]: any;
    };

export type QuickActionsInput<I> = {
  /**
   * Supported global quick actions with input transformations.
   * Key is the quick action ID, value is the transformation mapping.
   */
  supported?: {
    [quickActionId: string]: QuickActionSupport<I>;
  };
};

export default Provider;
