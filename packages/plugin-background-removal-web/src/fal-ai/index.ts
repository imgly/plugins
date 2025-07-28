import { createBackgroundRemovalProvider } from './createBackgroundRemovalProvider';

const FalAi = {
  /**
   * Creates a FalAI background removal provider for any model
   * @param modelKey - The FalAI model key (e.g., 'fal-ai/birefnet', 'fal-ai/birefnet/v2')
   * @param config - Provider configuration
   */
  createProvider: createBackgroundRemovalProvider
};

export default FalAi;
