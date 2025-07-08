import { OpenAPIV3 } from 'openapi-types';
import { OutputKind, PanelInputSchema } from '../core/provider';
import { Property } from './types';

function getProperties<K extends OutputKind, I>(
  inputSchema: OpenAPIV3.SchemaObject,
  panelInput: PanelInputSchema<K, I>
): Property[] {
  if (inputSchema.properties == null) {
    throw new Error('Input schema must have properties');
  }
  const propertiesFromSchema = inputSchema.properties;
  const properties: Property[] = [];

  const order = getOrder(inputSchema, panelInput);
  order.forEach((propertyKey) => {
    const id = propertyKey;
    const schema =
      (propertiesFromSchema[propertyKey] as OpenAPIV3.SchemaObject) ??
      undefined;
    properties.push({ id, schema });
  });

  return properties;
}

function getOrder<K extends OutputKind, I>(
  inputSchema: OpenAPIV3.SchemaObject,
  panelInput: PanelInputSchema<K, I>
): string[] {
  const panelInputOrder = panelInput.order;
  if (panelInputOrder != null && Array.isArray(panelInputOrder)) {
    return panelInputOrder;
  }

  if (inputSchema.properties == null) {
    throw new Error('Input schema must have properties');
  }
  const propertiesFromSchema = inputSchema.properties;
  const orderFromKeys = Object.keys(propertiesFromSchema);
  const orderFromExtensionKeyword = getOrderFromExtensionKeyword(
    inputSchema,
    panelInput
  );

  let order = orderFromExtensionKeyword ?? orderFromKeys;

  if (panelInputOrder != null && typeof panelInputOrder === 'function') {
    order = panelInputOrder(order);
  }

  // Return order with no duplicates
  return [...new Set(order)];
}

/**
 * Get the order from an extension keyword in the input schema (e.g. x-order) if it exists.
 */
function getOrderFromExtensionKeyword<K extends OutputKind, I>(
  inputSchema: OpenAPIV3.SchemaObject,
  panelInput: PanelInputSchema<K, I>
): string[] | undefined {
  if (panelInput.orderExtensionKeyword == null) {
    return undefined;
  }

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

  return order;
}

export default getProperties;
