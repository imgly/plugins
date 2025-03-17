export interface PluginConfiguration {
  /**
   * Prepopulate the text input field with this value.
   */
  defaultText?: string;

  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;

  /**
   * If true the generation process wll be replaced with a dummy generation.
   * Useful for testing the UI without actually generating audio.
   */
  dryRun?: boolean;

}
