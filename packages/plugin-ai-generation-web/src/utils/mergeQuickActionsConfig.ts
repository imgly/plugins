/**
 * Merge quick actions configuration by combining provider defaults with user configuration overrides
 *
 * @param providerDefaults - The default quick actions from the provider
 * @param userConfig - The user's configuration overrides
 * @returns Merged quick actions configuration
 */
export function mergeQuickActionsConfig<T extends Record<string, any>>(
  providerDefaults: T,
  userConfig?: {
    [quickActionId: string]: any | false | null;
  }
): T {
  // Always return a copy to avoid mutating the original
  const result: any = { ...providerDefaults };

  if (!userConfig) return result as T;

  for (const [actionId, config] of Object.entries(userConfig)) {
    if (config === false || config === null || config === undefined) {
      // Remove the quick action
      delete result[actionId];
    } else if (config === true) {
      // Keep provider's default if it exists, otherwise add true
      if (!(actionId in providerDefaults)) {
        result[actionId] = true;
      }
      // If it exists in defaults, we already have it from the spread above
    } else {
      // Override with user configuration
      result[actionId] = config;
    }
  }

  return result as T;
}
