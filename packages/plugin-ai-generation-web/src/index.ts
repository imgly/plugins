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
  type GetInput,
  type QuickAction,
  type QuickActionsInput
} from './generation/provider';
export {
  type GetPropertyInput,
  type Property
} from './generation/openapi/types';
export { default as initProvider } from './generation/initProvider';
export {
  type GetProvider,
  type GenerationMiddleware,
  type CommonProviderConfiguration
} from './generation/types';

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

export { default as getQuickActionMenu } from './generation/quickAction/getQuickActionMenu';
export { default as registerQuickActionMenuComponent } from './generation/quickAction/registerQuickActionMenuComponent';

export { default as QuickActionBasePrompt } from './generation/quickAction/common/QuickActionBasePrompt';
export { default as QuickActionBaseButton } from './generation/quickAction/common/QuickActionBaseButton';
export { default as QuickActionBaseSelect } from './generation/quickAction/common/QuickActionBaseSelect';
export { default as QuickActionBaseLibrary } from './generation/quickAction/common/QuickActionBaseLibrary';

export { default as QuickActionEditTextStyle } from './generation/quickAction/common/QuickActionEditTextStyle';
export { default as QuickActionChangeImage } from './generation/quickAction/common/QuickActionChangeImage';
export { default as QuickActionImageVariant } from './generation/quickAction/common/QuickActionImageVariant';
export { default as QuickActionCombineImages } from './generation/quickAction/common/QuickActionCombineImages';
export { default as QuickActionSwapImageBackground } from './generation/quickAction/common/QuickActionSwapImageBackground';

export { default as enableQuickActionForImageFill } from './generation/quickAction/common/enableImageFill';

export {
  isGeneratingStateKey,
  abortGenerationStateKey
} from './generation/renderGenerationComponents';

export { default as initializeProviders } from './generation/initializeProviders';
export { default as initializeProvider } from './generation/initializeProvider';
