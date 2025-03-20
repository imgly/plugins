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
  type GetInput
} from './generation/provider';
export {
  type GetPropertyInput,
  type Property
} from './generation/openapi/types';
export { default as initProvider } from './generation/initProvider';
export {
  getDurationForVideo,
  getThumbnailForVideo,
  getLabelFromId
} from './utils';

// Magic menu exports
export { default as getMagicMenu } from './magic/getMagicMenu';
export { default as registerMagicMenu } from './magic/registerMagicMenu';
export {
  type MagicEntry,
  type MagicMenu,
  type MagicContext,
  type ApplyInferenceResult,
  type MagicId,
  type InferenceMetadata
} from './magic/types';
