import { Output, QuickAction } from '../provider';

export const INFERENCE_AI_EDIT_MODE = 'ly.img.ai.inference.editMode';

export const INFERENCE_AI_METADATA_KEY = 'ly.img.ai.inference.metadata';

export const INFERENCE_CONFIRMATION_COMPONENT_ID =
  'ly.img.ai.inference.confirmation.canvasMenu';

export function getFeatureIdForQuickAction(options: {
  quickActionId: string;
  quickActionMenuId: string;
}) {
  return `ly.img.ai.quickAction.${options.quickActionMenuId}.${options.quickActionId}`;
}
