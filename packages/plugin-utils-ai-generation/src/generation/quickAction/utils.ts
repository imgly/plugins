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

/**
 * Removes all two following `ly.img.separator` entries from the quick
 * actions array or if it is first or last in the array.
 */
export function removeDuplicatedSeparators<I, O extends Output>(
  quickActions: (QuickAction<I, O> | 'ly.img.separator')[]
): (QuickAction<I, O> | 'ly.img.separator')[] {
  if (quickActions.length === 0) {
    return [];
  }

  // Create a new array for the result
  const result = [...quickActions];

  // Remove separators at the beginning
  while (result.length > 0 && result[0] === 'ly.img.separator') {
    result.shift();
  }

  // Remove separators at the end
  while (
    result.length > 0 &&
    result[result.length - 1] === 'ly.img.separator'
  ) {
    result.pop();
  }

  // Remove consecutive separators
  return result.reduce<(QuickAction<I, O> | 'ly.img.separator')[]>(
    (acc, current) => {
      // Skip if current is a separator and previous was also a separator
      if (
        current === 'ly.img.separator' &&
        acc.length > 0 &&
        acc[acc.length - 1] === 'ly.img.separator'
      ) {
        return acc;
      }

      acc.push(current);
      return acc;
    },
    []
  );
}
