export const AI_EDIT_MODE = 'ly.img.ai.editMode';

export const AI_METADATA_KEY = 'ly.img.ai.metadata';

export const AI_CONFIRMATION_COMPONENT_ID = 'ly.img.ai.confirmation.canvasMenu';

export function getFeatureIdForQuickAction(options: {
  quickActionId: string;
  quickActionMenuId: string;
}) {
  return `ly.img.ai.quickAction.${options.quickActionMenuId}.${options.quickActionId}`;
}
