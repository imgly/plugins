import renderImageUrlProperty from './common/renderImageUrlProperty';

const CommonProperties = {
  ImageUrl: renderImageUrlProperty
};

export { CommonProperties };

export {
  type default as Provider,
  type ImageOutput,
  type VideoOutput,
  type TextOutput,
  type AudioOutput,
  type Output,
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
export { type GenerationMiddleware } from './generation/types';

// Export middleware
export {
  composeMiddlewares,
  type Middleware
} from './generation/middleware/middleware';
export { default as loggingMiddleware } from './generation/middleware/loggingMiddleware';
export { default as rateLimitMiddleware, type RateLimitOptions } from './generation/middleware/rateLimitMiddleware';

export {
  getPanelId,
  getDurationForVideo,
  getThumbnailForVideo,
  getLabelFromId
} from './utils';

export { default as getQuickActionMenu } from './generation/quickAction/getQuickActionMenu';
export { default as registerQuickActionMenuComponent } from './generation/quickAction/registerQuickActionMenuComponent';

export {
  isGeneratingStateKey,
  abortGenerationStateKey
} from './generation/renderGenerationComponents';
