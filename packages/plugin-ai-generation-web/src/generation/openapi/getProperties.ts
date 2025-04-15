import { OpenAPIV3 } from 'openapi-types';
import { OutputKind, PanelInputSchema } from '../provider';
import { Property } from './types';

function getProperties<K extends OutputKind, I>(
  inputSchema: OpenAPIV3.SchemaObject,
  panelInput: PanelInputSchema<K, I>
): Property[] {
  if (inputSchema.properties == null) {
    throw new Error('Input schema must have properties');
  }

  const properties: Property[] = [];

  const orderedProperties = getOrderedProperties(inputSchema, panelInput);
  if (orderedProperties != null) {
    return orderedProperties;
  } else {
    Object.entries(inputSchema.properties).forEach((property) => {
      const id = property[0];
      const schema = property[1] as OpenAPIV3.SchemaObject;
      properties.push({ id, schema });
    });
  }

  return properties;
}

function getOrderedProperties<K extends OutputKind, I>(
  inputSchema: OpenAPIV3.SchemaObject,
  panelInput: PanelInputSchema<K, I>
): Property[] | undefined {
  if (panelInput.orderExtensionKeyword == null) {
    return undefined;
  }
  const properties: Property[] = [];

  if (
    typeof panelInput.orderExtensionKeyword !== 'string' &&
    !Array.isArray(panelInput.orderExtensionKeyword)
  ) {
    throw new Error(
      'orderExtensionKeyword must be a string or an array of strings'
    );
  }

  const orderExtensionKeywords =
    typeof panelInput.orderExtensionKeyword === 'string'
      ? [panelInput.orderExtensionKeyword]
      : panelInput.orderExtensionKeyword;

  const orderExtensionKeyword = orderExtensionKeywords.find(
    (extensionKeyword) => {
      return extensionKeyword in inputSchema;
    }
  );

  if (orderExtensionKeyword == null) {
    return undefined;
  }
  const order =
    // @ts-ignore
    inputSchema[orderExtensionKeyword] as string[];

  if (order == null || Array.isArray(order) === false) {
    throw new Error(
      `Extension keyword ${orderExtensionKeyword} must be an array of strings`
    );
  }

  [...new Set(order)].forEach((orderKey) => {
    const property = inputSchema.properties?.[orderKey];
    if (property != null) {
      properties.push({
        id: orderKey,
        schema: property as OpenAPIV3.SchemaObject
      });
    }
  });

  if (properties.length === 0) {
    throw new Error(
      `Could not find any properties with order extension keyword(s) ${orderExtensionKeywords.join(
        ', '
      )}`
    );
  }
  return properties;
}

export default getProperties;
