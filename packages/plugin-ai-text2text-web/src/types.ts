/**
 * Provider to use the Anthropics AI generation service.
 */
export interface AnthropicProvider {
  id: 'anthropic';

  /**
   * URL to the AI generation service. This service needs to inject
   * the API key into the request headers.
   */
  proxyUrl: string;

  /**
   * The model to use for AI generation.
   *
   * See the documentation for available models here: https://docs.anthropic.com/en/docs/about-claude/models/all-models
   */
  model?: string;

  /**
   * The maximum number of tokens to generate before stopping.
   *
   * Different models have different maximum values for this parameter.
   */
  maxTokens?: number;

  /**
   * Amount of randomness injected into the response.
   *
   * Ranges from 0.0 to 1.0
   *
   * Use temperature closer to 0.0 for analytical / multiple choice, and closer to 1.0 for creative and generative output.
   */
  temperature?: number;
}

export type Text2TextProvider = AnthropicProvider;

export interface PluginConfiguration {
  /**
   * The provider to use for text2text AI generation.
   */
  provider: Text2TextProvider;

  /**
   * Render console logs for debugging purposes.
   */
  debug?: boolean;
}
