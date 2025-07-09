import type CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * Checks if the current AI plugin version matches the shared version across all AI plugins.
 * Issues a console warning if versions don't match.
 *
 * @param cesdk - The CreativeEditorSDK instance
 * @param pluginId - The ID of the current plugin
 * @param currentVersion - The version of the current plugin
 */
export function checkAiPluginVersion(
  cesdk: CreativeEditorSDK,
  pluginId: string,
  currentVersion: string
): void {
  const AI_PLUGIN_VERSION_KEY = 'ai-plugin-version';
  const AI_PLUGIN_VERSION_WARNING_KEY = 'ai-plugin-version-warning-shown';

  try {
    const sharedVersion = cesdk.ui.experimental.getGlobalStateValue<string>(
      AI_PLUGIN_VERSION_KEY
    );

    if (!sharedVersion) {
      // First AI plugin sets the shared version
      cesdk.ui.experimental.setGlobalStateValue(
        AI_PLUGIN_VERSION_KEY,
        currentVersion
      );
    } else if (sharedVersion !== currentVersion) {
      // Version mismatch detected
      const warningShown = cesdk.ui.experimental.getGlobalStateValue<boolean>(
        AI_PLUGIN_VERSION_WARNING_KEY,
        false
      );

      if (!warningShown) {
        // eslint-disable-next-line no-console
        console.warn(
          `[IMG.LY AI Plugins] Version mismatch detected!\n` +
            `Plugin "${pluginId}" is using version ${currentVersion}, but other AI plugins are using version ${sharedVersion}.\n` +
            `This may cause compatibility issues. Please ensure all AI plugins (@imgly/plugin-ai-*) use the same version.\n` +
            `Consider updating all AI plugins to the same version for optimal compatibility.`
        );

        // Set flag to prevent duplicate warnings
        cesdk.ui.experimental.setGlobalStateValue(
          AI_PLUGIN_VERSION_WARNING_KEY,
          true
        );
      }
    }
  } catch (error) {
    // Fail silently if global state access fails
    // eslint-disable-next-line no-console
    console.debug(
      '[IMG.LY AI Plugins] Could not check plugin version consistency:',
      error
    );
  }
}
