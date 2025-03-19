import { OpenAPIV3 } from 'openapi-types';
import dereferenceDocument, {
  resolveReference
} from './openapi/dereferenceDocument';
import {
  type OutputKind,
  type Output,
  type PanelInputSchema
} from './provider';
import type Provider from './provider';
import { InitProviderConfiguration, UIOptions } from './types';
import { isOpenAPISchema } from './openapi/isOpenAPISchema';
import { GetPropertyInput } from './openapi/types';
import renderProperty from './openapi/renderProperty';
import renderGenerationComponents from './renderGenerationComponents';
import getProperties from './openapi/getProperties';
import { BuilderRenderFunction } from '@cesdk/cesdk-js';

/**
 * Registers a schema-based panel input for a provider
 */
async function registerPanelInputSchema<
  K extends OutputKind,
  I,
  O extends Output
>(
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: InitProviderConfiguration
): Promise<BuilderRenderFunction<any>> {
  const { cesdk } = options;
  const { id: providerId } = provider;

  if (config.debug) {
    // eslint-disable-next-line no-console
    console.log(
      `Registering schema-based panel input for provider ${providerId}`
    );
  }

  const schemaDocument = dereferenceDocument(panelInput.document);
  const resolvedInputReference = resolveReference(
    schemaDocument,
    panelInput.inputReference
  );

  if (!isOpenAPISchema(resolvedInputReference, config.debug)) {
    throw new Error(
      `Input reference '${panelInput.inputReference}' does not resolve to a valid OpenAPI schema`
    );
  }

  const inputSchema: OpenAPIV3.SchemaObject = resolvedInputReference;
  const properties = getProperties(inputSchema, panelInput);

  const builderRenderFunction: BuilderRenderFunction<any> = (context) => {
    const { builder } = context;

    const getInputs: GetPropertyInput[] = [];
    builder.Section(`${providerId}.schema.section`, {
      children: () => {
        properties.forEach((property) => {
          const getInput = renderProperty(
            context,
            property,
            provider,
            panelInput,
            options,
            config
          );
          if (getInput != null) {
            if (Array.isArray(getInput)) {
              getInputs.push(...getInput);
            } else {
              getInputs.push(getInput);
            }
          }
        });
      }
    });

    const inputs = getInputs.map((getInput) => {
      const input = getInput();
      return input;
    });
    const input = inputs.reduce((acc, { id, value }) => {
      acc[id] = value;
      return acc;
    }, {} as Record<string, any>) as I;

    renderGenerationComponents(
      context,
      provider,
      () => {
        return { input };
      },
      () => {
        return panelInput.getBlockInput(input);
      },
      {
        ...options,
        requiredInputs: inputSchema.required
      },
      config
    );
  };

  cesdk.ui.registerPanel(providerId, builderRenderFunction);
  return builderRenderFunction;
}

export default registerPanelInputSchema;
