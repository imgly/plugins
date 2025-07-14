export const PLUGIN_ID = '@imgly/plugin-ai-text-generation-web';

/**
 * Default order for text quick actions, matching the ai-demo.tsx example.
 * This is used as a fallback when children is undefined in canvas menu order.
 */
export const DEFAULT_TEXT_QUICK_ACTION_ORDER = [
  'ly.img.improve',
  'ly.img.fix',
  'ly.img.shorter',
  'ly.img.longer',
  'ly.img.separator',
  'ly.img.changeTone',
  'ly.img.translate',
  'ly.img.separator',
  'ly.img.changeTextTo'
];
