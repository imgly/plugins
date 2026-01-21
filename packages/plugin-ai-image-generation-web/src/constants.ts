export const PLUGIN_ID = '@imgly/plugin-ai-image-generation-web';

/**
 * Default order for image quick actions, matching the ai-demo.tsx example.
 * This is used as a fallback when children is undefined in canvas menu order.
 */
export const DEFAULT_IMAGE_QUICK_ACTION_ORDER = [
  'ly.img.gpt-image-1.changeStyleLibrary',
  'ly.img.styleTransfer',
  'ly.img.artistTransfer',
  'ly.img.separator',
  'ly.img.editImage',
  'ly.img.enhanceImage',
  'ly.img.swapBackground',
  'ly.img.createVariant',
  'ly.img.combineImages',
  'ly.img.separator',
  'ly.img.remixPage',
  'ly.img.separator',
  'ly.img.createVideo',
  'ly.img.animateBetweenImages'
];
