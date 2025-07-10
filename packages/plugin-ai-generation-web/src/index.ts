import renderImageUrlProperty from './ui/common/renderImageUrlProperty';
import renderStyleTransferProperty from './ui/common/renderStyleTransferProperty';

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
  type StickerOutput,
  type Output,
  type OutputKind,
  type PanelInputSchema,
  type RenderCustomProperty,
  type GetBlockInput,
  type GetBlockInputResult,
  type GetInput
} from './core/provider';
export { type GetPropertyInput, type Property } from './openapi/types';
export {
  type GetProvider,
  type CommonProviderConfiguration,
  type CommonPluginConfiguration,
  type CommonConfiguration,
  type InternalPluginConfiguration
} from './types';

export { default as integrateIntoDefaultAssetLibraryEntry } from './assets/integrateIntoDefaultAssetLibraryEntry';
export {
  ActionRegistry,
  type PluginActionDefinition,
  type QuickActionDefinition,
  type ActionDefinition,
  type ActionRegistryEventType,
  type ActionRegistrySubscriberCallback,
  type ActionRegistryFilters
} from './core/ActionRegistry';
export { ProviderRegistry } from './core/ProviderRegistry';

// Export middleware
export { composeMiddlewares, type Middleware } from './middleware/middleware';
export { default as loggingMiddleware } from './middleware/loggingMiddleware';
export { default as uploadMiddleware } from './middleware/uploadMiddleware';
export {
  default as rateLimitMiddleware,
  type RateLimitOptions
} from './middleware/rateLimitMiddleware';

export {
  getPanelId,
  getDurationForVideo,
  getThumbnailForVideo,
  getLabelFromId,
  isAsyncGenerator,
  addIconSetOnce
} from './utils/utils';

export { checkAiPluginVersion } from './utils/checkAiPluginVersion';

export { default as registerDockComponent } from './ui/components/registerDockComponent';

export { default as enableQuickActionForImageFill } from './ui/quickActions/enableImageFill';

export {
  isGeneratingStateKey,
  abortGenerationStateKey
} from './ui/components/renderGenerationComponents';

export { default as initializeProviders } from './providers/initializeProviders';
export { default as initializeProvider } from './providers/initializeProvider';
export { default as initializeQuickActionComponents } from './ui/quickActions/initializeQuickActionComponents';

export { AI_EDIT_MODE, AI_METADATA_KEY } from './ui/quickActions/utils';
