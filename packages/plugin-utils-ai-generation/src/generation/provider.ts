import { type OpenAPIV3 } from 'openapi-types';
import type CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  type BuilderRenderFunctionContext,
  type CreativeEngine
} from '@cesdk/cesdk-js';
import { GetPropertyInput, Property } from './openapi/types';

interface Provider<K extends OutputKind, I, O extends Output> {
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
  initialize: (options: {
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
    history?: false | '@imgly/local' | '@imgly/indexedDB' | string;

    /**
     * Generate the asset given the input.
     *
     * @returns The generated asset
     */
    generate: (
      input: I,
      options: {
        abortSignal: AbortSignal;
        engine: CreativeEngine;
        cesdk?: CreativeEditorSDK;
      }
    ) => Promise<O>;
  };
}

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
   * After the input is created (from the schema), this
   * method is called to create the additional and mandatory
   * input by kind.
   *
   */
  createInputByKind: (input: I) => Record<K, InputByKind[K]>;

  /**
    * Allows to customize the components for some properties.
    */
  renderCustomProperty?: {
    [key: string]: (
      context: BuilderRenderFunctionContext<any>,
      property: Property
    ) => GetPropertyInput;
  };
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

       return () => ({
         input: {
           prompt: promptState.value
         },
         context: {
           size: {
             width: 1024,
             height: 1024
           }
         }
       });
     }
     ```
   */
  render: (
    context: BuilderRenderFunctionContext<any>,
    options: { cesdk: CreativeEditorSDK; isGenerating: boolean }
  ) => GetInput<K, I>;
}

/**
 * Returns the current input state and the context when called.
 * This is the input for which the ai generation is requested.
 */
export type GetInput<K extends OutputKind, I> = () => {
  input: I;
} & Record<K, InputByKind[K]>;

/**
 * All possible output kinds.
 */
export type OutputKind = 'image' | 'video' | 'audio' | 'text';

/**
 * Mandatory kind-specific input needed for the generation.
 */
export type InputByKind = {
  image: { width: number; height: number };
  video: { width: number; height: number; duration: number };
  audio: { duration: number };
  text: { length: number };
};

/**
 * The generated output of the provider.
 */
export type Output = ImageOutput | VideoOutput | AudioOutput | TextOutput;

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
}

export interface TextOutput extends OutputBase<'text'> {
  kind: 'text';
}

export default Provider;
