import { BuilderRenderFunction } from '@cesdk/cesdk-js';
import { OutputKind, PanelInputSchema, type Output } from '../../core/provider';
import renderGenerationComponents from '../components/renderGenerationComponents';
import { InitializationContext } from '../../types';
import dereferenceDocument, {
  resolveReference
} from '../../openapi/dereferenceDocument';
import { isOpenAPISchema } from '../../openapi/isOpenAPISchema';
import { OpenAPIV3 } from 'openapi-types';
import getProperties from '../../openapi/getProperties';
import { GetPropertyInput, PropertyInput } from '../../openapi/types';
import renderProperty from '../../openapi/renderProperty';
import { Generate } from '../../generation/createGenerateFunction';

function formatEnumLabel(enumValue: string): string {
  return (
    enumValue
      // Replace underscores with spaces
      .replace(/_/g, ' ')
      // Handle specific cases first
      .replace(/\b3d\b/gi, '3D')
      .replace(/\b2d\b/gi, '2D')
      // Capitalize each word
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

/**
 * Creates a panel render function based on the schema definition in the provider.
 */
async function createPanelRenderFunctionFromSchema<
  K extends OutputKind,
  I,
  O extends Output
>(
  {
    options,
    provider,
    panelInput,
    config
  }: InitializationContext<K, I, O, PanelInputSchema<K, I>>,
  generate: Generate<I, O>
): Promise<BuilderRenderFunction<any> | undefined> {
  const { id: providerId } = provider;

  if (panelInput == null) {
    return undefined;
  }

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

  // Set translations for schema titles and enum labels before creating render function
  const translations: Record<string, string> = {};
  properties.forEach((property) => {
    if (property.schema?.title) {
      translations[`schema.${provider.id}.${property.id}`] =
        property.schema.title;
    }

    // Add enum labels translations
    if (property.schema?.enum) {
      const enumLabels: Record<string, string> =
        'x-imgly-enum-labels' in property.schema &&
        typeof property.schema['x-imgly-enum-labels'] === 'object'
          ? (property.schema['x-imgly-enum-labels'] as Record<string, string>)
          : {};

      property.schema.enum.forEach((enumValue) => {
        const valueId = String(enumValue);
        // Set translation either from enumLabels or fallback to formatted valueId
        const labelValue = enumLabels[valueId] || formatEnumLabel(valueId);
        translations[`schema.${provider.id}.${property.id}.${valueId}`] =
          labelValue;
      });
    }

    // Add anyOf enum labels translations
    if (property.schema?.anyOf && Array.isArray(property.schema.anyOf)) {
      const enumLabels: Record<string, string> =
        'x-imgly-enum-labels' in property.schema &&
        typeof property.schema['x-imgly-enum-labels'] === 'object'
          ? (property.schema['x-imgly-enum-labels'] as Record<string, string>)
          : {};

      property.schema.anyOf.forEach((anySchema) => {
        const schema = anySchema as any;
        if (schema.enum && Array.isArray(schema.enum)) {
          schema.enum.forEach((enumValue: any) => {
            const valueId = String(enumValue);
            // Set translation either from enumLabels or fallback to formatted valueId
            const labelValue = enumLabels[valueId] || formatEnumLabel(valueId);
            translations[`schema.${provider.id}.${property.id}.${valueId}`] =
              labelValue;
          });
        }
      });
    }
  });
  if (Object.keys(translations).length > 0) {
    options.cesdk.i18n.setTranslations({
      en: translations
    });
  }

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

    const resolveInput = (input: PropertyInput) => {
      if (input.type === 'object') {
        return Object.entries(input.value).reduce((acc, [key, value]) => {
          acc[key] = resolveInput(value);

          return acc;
        }, {} as Record<string, any>);
      }

      return input.value;
    };
    const input = inputs.reduce((acc, propertyInput) => {
      acc[propertyInput.id] = resolveInput(propertyInput);
      return acc;
    }, {} as Record<string, any>) as I;

    renderGenerationComponents(
      context,
      provider,
      generate,
      () => {
        return { input };
      },
      () => {
        return panelInput.getBlockInput(input);
      },
      {
        ...options,
        requiredInputs: inputSchema.required,
        createPlaceholderBlock: panelInput.userFlow === 'placeholder'
      },
      config
    );
  };

  return builderRenderFunction;
}

export default createPanelRenderFunctionFromSchema;
