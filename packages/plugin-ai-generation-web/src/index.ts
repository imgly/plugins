import renderImageUrlProperty from './common/renderImageUrlProperty';
import renderStyleTransferProperty from './common/renderStyleTransferProperty';

const CommonProperties = {
  ImageUrl: renderImageUrlProperty,
  StyleTransfer: renderStyleTransferProperty
};

export { CommonProperties };

export {
  type default as Provider,
  type ImageOutput,
  type VideoOutput,
  type TextOutput,
  type AudioOutput,
  type Output,
  type OutputKind,
  type PanelInputSchema,
  type RenderCustomProperty,
  type GetBlockInput,
  type GetBlockInputResult,
  type GetInput
} from './generation/provider';
export {
  type GetPropertyInput,
  type Property
} from './generation/openapi/types';
export {
  type GetProvider,
  type CommonProviderConfiguration
} from './generation/types';

export { default as integrateIntoDefaultAssetLibraryEntry } from './generation/integrateIntoDefaultAssetLibraryEntry';
export { type CommonPluginConfiguration } from './types';
export {
  ActionRegistry,
  type PluginActionDefinition,
  type QuickActionDefinition,
  type ActionDefinition,
  type ActionRegistryEventType,
  type ActionRegistrySubscriberCallback,
  type ActionRegistryFilters
} from './ActionRegistry';
export { ProviderRegistry } from './ProviderRegistry';

// Export middleware
export {
  composeMiddlewares,
  type Middleware
} from './generation/middleware/middleware';
export { default as loggingMiddleware } from './generation/middleware/loggingMiddleware';
export { default as uploadMiddleware } from './generation/middleware/uploadMiddleware';
export {
  default as rateLimitMiddleware,
  type RateLimitOptions
} from './generation/middleware/rateLimitMiddleware';

export {
  getPanelId,
  getDurationForVideo,
  getThumbnailForVideo,
  getLabelFromId,
  isAsyncGenerator
} from './utils';

export { default as registerDockComponent } from './registerDockComponent';

export { default as enableQuickActionForImageFill } from './generation/quickAction/common/enableImageFill';

export {
  isGeneratingStateKey,
  abortGenerationStateKey
} from './generation/renderGenerationComponents';

export { default as initializeProviders } from './generation/initializeProviders';
export { default as initializeProvider } from './generation/initializeProvider';
export { default as initializeQuickActionComponents } from './generation/initializeQuickActionComponents';

export { AI_EDIT_MODE, AI_METADATA_KEY } from './generation/quickAction/utils';
