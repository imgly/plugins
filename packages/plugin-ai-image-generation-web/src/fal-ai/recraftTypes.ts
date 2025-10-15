import type {
  PropertyContext,
  ExtendPropertyContexts,
  CommonProviderConfiguration
} from '@imgly/plugin-ai-generation-web';
import type { RecraftV3TextToImageInput } from '@fal-ai/client/endpoints';

type RecraftV3Output = {
  kind: 'image';
  url: string;
};

type Recraft20bOutput = {
  kind: 'image';
  url: string;
};

// Recraft20b uses a local input type definition
type Recraft20bInput = {
  prompt: string;
  image_size?:
    | 'square_hd'
    | 'square'
    | 'portrait_4_3'
    | 'portrait_16_9'
    | 'landscape_4_3'
    | 'landscape_16_9'
    | { width: number; height: number };
  style?: string;
  colors?: Array<{ r: number; g: number; b: number }>;
};

/**
 * Extended context for Recraft style property
 */
export interface RecraftStyleContext extends PropertyContext {
  /**
   * Currently selected style type
   */
  type: 'image' | 'vector' | 'icon';

  /**
   * Available styles for the current type
   */
  availableStyles: string[];

  /**
   * Whether this is the initial render
   */
  isInitializing: boolean;
}

/**
 * Configuration for RecraftV3 provider with extended style context
 */
export interface RecraftV3Configuration
  extends Omit<
    CommonProviderConfiguration<RecraftV3TextToImageInput, RecraftV3Output>,
    'properties'
  > {
  properties?: ExtendPropertyContexts<
    RecraftV3TextToImageInput,
    {
      style: RecraftStyleContext;
      // All other properties use base PropertyContext
    }
  >;

  baseURL?: string;
}

/**
 * Configuration for Recraft20b provider with extended style context
 */
export interface Recraft20bConfiguration
  extends Omit<
    CommonProviderConfiguration<Recraft20bInput, Recraft20bOutput>,
    'properties'
  > {
  properties?: ExtendPropertyContexts<
    Recraft20bInput,
    {
      style: RecraftStyleContext;
      // All other properties use base PropertyContext
    }
  >;

  baseURL?: string;
}
