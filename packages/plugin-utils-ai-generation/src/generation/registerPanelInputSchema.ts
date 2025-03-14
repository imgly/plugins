import {
  type OutputKind,
  type Output,
  type PanelInputSchema
} from './provider';
import type Provider from './provider';
import { InitProviderConfiguration, UIOptions } from './types';

/**
 * Registers a schema-based panel input for a provider
 */
async function registerPanelInputSchema<
  K extends OutputKind,
  I,
  O extends Output
>(
  provider: Provider<K, I, O>,
  _panelInput: PanelInputSchema,
  options: UIOptions,
  config: InitProviderConfiguration
): Promise<void> {
  const { cesdk } = options;
  const { id: providerId } = provider;

  // Example implementation for schema-based panel
  // This would typically register UI components based on a schema definition
  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log(
      `Registering schema-based panel input for provider ${providerId}`
    );
  }

  // Implementation would:
  // 1. Parse schema definition
  // 2. Register appropriate UI components with cesdk.ui
  // 3. Set up event listeners and data binding

  // For now this is a placeholder implementation
  cesdk.ui.registerPanel(`panel.${providerId}`, (context) => {
    const { builder } = context;

    // Schema-based UI would be generated here
    builder.Section(`${providerId}.schema.section`, {
      children: () => {
        builder.Text(`${providerId}.schema.placeholder`, {
          content: 'Schema-based panel (placeholder)'
        });
      }
    });

    // renderGenerationComponents(
    //   context,
    //   provider,
    //   options,
    //   config
    // );
  });
}

export default registerPanelInputSchema;
