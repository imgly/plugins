import { createBackgroundRemovalProvider } from './createBackgroundRemovalProvider';

const FalAi = {
  /**
   * Creates a FalAI background removal provider for any model
   * @param modelKey - The FalAI model key (e.g., 'fal-ai/birefnet', 'fal-ai/birefnet/v2')
   * @param config - Provider configuration
   */
  createProvider: createBackgroundRemovalProvider,

  /**
   * Pre-configured provider for Birefnet v2 model
   * @param config - Provider configuration
   */
  Birefnet2: (config: Parameters<typeof createBackgroundRemovalProvider>[1]) =>
    createBackgroundRemovalProvider('fal-ai/birefnet/v2', config),

  /**
   * Pre-configured provider for Birefnet model
   * @param config - Provider configuration
   */
  Birefnet: (config: Parameters<typeof createBackgroundRemovalProvider>[1]) =>
    createBackgroundRemovalProvider('fal-ai/birefnet', config),

  /**
   * Pre-configured provider for Bria Background Remove model
   * @param config - Provider configuration
   */
  BriaBackgroundRemove: (
    config: Parameters<typeof createBackgroundRemovalProvider>[1]
  ) => createBackgroundRemovalProvider('fal-ai/bria/background/remove', config),

  /**
   * Pre-configured provider for Rembg Enhance model
   * @param config - Provider configuration
   */
  RembgEnhance: (
    config: Parameters<typeof createBackgroundRemovalProvider>[1]
  ) => createBackgroundRemovalProvider('smoretalk-ai/rembg-enhance', config),

  /**
   * Pre-configured provider for Imageutils Rembg model
   * @param config - Provider configuration
   */
  ImageutilsRembg: (
    config: Parameters<typeof createBackgroundRemovalProvider>[1]
  ) => createBackgroundRemovalProvider('fal-ai/imageutils/rembg', config)
};

export default FalAi;
