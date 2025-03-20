/**
 * Provider to use the Anthropics AI generation service.
 */
export interface ElevenLabsProvider {
  id: 'elevenlabs';

  /**
   * URL to the AI generation service. This service needs to inject
   * the API key into the request headers.
   */
  proxyUrl: string;

}

export type Text2SpeechProvider = ElevenLabsProvider;

export interface PluginConfiguration {
  /**
   * The provider to use for text-to-speech AI generation.
   */
  provider: Text2SpeechProvider;

  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;
}
