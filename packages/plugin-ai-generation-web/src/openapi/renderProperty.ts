/* eslint-disable @typescript-eslint/no-unused-vars */
import { BuilderRenderFunctionContext } from '@cesdk/cesdk-js';
import {
  EnumValue,
  ExtensionImglyBuilder,
  GetPropertyInput,
  Property,
  PropertyInput
} from './types';
import Provider, {
  Output,
  OutputKind,
  PanelInputSchema
} from '../core/provider';
import { UIOptions, CommonConfiguration } from '../types';
import { OpenAPIV3 } from 'openapi-types';
import getProperties from './getProperties';
import { getLabelFromId } from '../utils/utils';

function createInputLabelArray<K extends OutputKind, I, O extends Output>(
  property: Property,
  provider: Provider<K, I, O>,
  kind: K,
  valueId?: string
): string[] {
  const baseKey = `property.${property.id}${valueId ? `.${valueId}` : ''}`;
  return [
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.${baseKey}`,
    `ly.img.plugin-ai-generation-web.${baseKey}`,
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.${baseKey}`,
    `ly.img.plugin-ai-generation-web.defaults.${baseKey}`
  ];
}

function extractEnumMetadata(schema: any): {
  labels: Record<string, string>;
  icons: Record<string, string>;
} {
  const labels =
    'x-imgly-enum-labels' in schema &&
    typeof schema['x-imgly-enum-labels'] === 'object'
      ? (schema['x-imgly-enum-labels'] as Record<string, string>)
      : {};

  const icons =
    'x-imgly-enum-icons' in schema &&
    typeof schema['x-imgly-enum-icons'] === 'object'
      ? (schema['x-imgly-enum-icons'] as Record<string, string>)
      : {};

  return { labels, icons };
}

function renderProperty<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  property: Property,
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: CommonConfiguration<I, O>,
  kind: K
): GetPropertyInput | undefined {
  if (property.schema == null) {
    if (
      panelInput.renderCustomProperty != null &&
      panelInput.renderCustomProperty[property.id] != null
    ) {
      return panelInput.renderCustomProperty[property.id](context, property);
    } else {
      return undefined;
    }
  }
  const propertyWithSchema: Required<Property> = property as Required<Property>;
  const type = property.schema.type;

  if (
    panelInput.renderCustomProperty != null &&
    panelInput.renderCustomProperty[property.id] != null
  ) {
    return panelInput.renderCustomProperty[property.id](context, property);
  }

  switch (type) {
    case 'string': {
      if (property.schema.enum != null) {
        return renderEnumProperty(
          context,
          propertyWithSchema,
          provider,
          panelInput,
          options,
          config,
          kind
        );
      } else {
        return renderStringProperty(
          context,
          propertyWithSchema,
          provider,
          panelInput,
          options,
          config,
          kind
        );
      }
    }

    case 'boolean': {
      return renderBooleanProperty(
        context,
        propertyWithSchema,
        provider,
        panelInput,
        options,
        config,
        kind
      );
    }

    case 'number':
    case 'integer': {
      return renderIntegerProperty(
        context,
        propertyWithSchema,
        provider,
        panelInput,
        options,
        config,
        kind
      );
    }

    case 'object': {
      return renderObjectProperty(
        context,
        propertyWithSchema,
        provider,
        panelInput,
        options,
        config,
        kind
      );
    }

    case 'array': {
      // not supported yet
      break;
    }

    case undefined: {
      if (
        property.schema.anyOf != null &&
        Array.isArray(property.schema.anyOf)
      ) {
        return renderAnyOfProperty(
          context,
          propertyWithSchema,
          provider,
          panelInput,
          options,
          config,
          kind
        );
      }
      break;
    }

    default: {
      // eslint-disable-next-line no-console
      console.error(`Unsupported property type: ${type}`);
    }
  }
}

function renderObjectProperty<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  property: Required<Property>,
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: CommonConfiguration<I, O>,
  kind: K
): GetPropertyInput {
  const properties = getProperties(property.schema ?? {}, panelInput);

  const childInputs = properties.reduce((acc, childProperty) => {
    const getInput = renderProperty(
      context,
      childProperty,
      provider,
      panelInput,
      options,
      config,
      kind
    );
    if (getInput != null) {
      acc[childProperty.id] = getInput();
    }
    return acc;
  }, {} as Record<string, PropertyInput>);

  return () => ({
    id: property.id,
    type: 'object',
    value: childInputs
  });
}

function renderStringProperty<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  property: Required<Property>,
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: CommonConfiguration<I, O>,
  kind: K
): GetPropertyInput {
  const {
    builder,
    experimental: { global }
  } = context;
  const { id: propertyId } = property;

  const id = `${provider.id}.${propertyId}`;
  const inputLabel = createInputLabelArray(property, provider, kind);

  const propertyState = global(id, property.schema.default ?? '');

  const extension = getImglyExtensionBuilder(property.schema);
  const builderComponent =
    extension?.component != null && extension?.component === 'TextArea'
      ? 'TextArea'
      : 'TextInput';

  builder[builderComponent](id, {
    inputLabel,
    placeholder: options.i18n?.prompt,
    ...propertyState
  });

  return () => ({
    id: property.id,
    type: 'string',
    value: propertyState.value
  });
}

function renderEnumProperty<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  property: Required<Property>,
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: CommonConfiguration<I, O>,
  kind: K
): GetPropertyInput {
  const {
    builder,
    experimental: { global }
  } = context;
  const { id: propertyId } = property;

  const id = `${provider.id}.${propertyId}`;
  const inputLabel = createInputLabelArray(property, provider, kind);

  const { labels: enumLabels, icons } = extractEnumMetadata(property.schema);

  const values: EnumValue[] = (property.schema.enum ?? []).map((valueId) => ({
    id: valueId,
    label: createInputLabelArray(property, provider, kind, valueId),
    icon: icons[valueId]
  }));
  const defaultValue =
    property.schema.default != null
      ? values.find((v) => v.id === property.schema.default) ?? values[0]
      : values[0];

  const propertyState = global<EnumValue>(id, defaultValue);

  builder.Select(id, {
    inputLabel,
    values,
    ...propertyState
  });

  return () => ({
    id: property.id,
    type: 'string',
    value: propertyState.value.id
  });
}

function renderBooleanProperty<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  property: Required<Property>,
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: CommonConfiguration<I, O>,
  kind: K
): GetPropertyInput {
  const {
    builder,
    experimental: { global }
  } = context;
  const { id: propertyId } = property;

  const id = `${provider.id}.${propertyId}`;
  const inputLabel = createInputLabelArray(property, provider, kind);

  const defaultValue = !!property.schema.default;
  const propertyState = global<boolean>(id, defaultValue);

  builder.Checkbox(id, {
    inputLabel,
    ...propertyState
  });

  return () => ({
    id: property.id,
    type: 'boolean',
    value: propertyState.value
  });
}

function renderIntegerProperty<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  property: Required<Property>,
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: CommonConfiguration<I, O>,
  kind: K
): GetPropertyInput {
  const {
    builder,
    experimental: { global }
  } = context;
  const { id: propertyId } = property;

  const id = `${provider.id}.${propertyId}`;
  const inputLabel = createInputLabelArray(property, provider, kind);

  const minValue = property.schema.minimum;
  const maxValue = property.schema.maximum;

  let defaultValue = property.schema.default;
  if (defaultValue == null) {
    if (minValue != null) {
      defaultValue = minValue;
    } else if (maxValue != null) {
      defaultValue = maxValue;
    } else {
      defaultValue = 0;
    }
  }

  const propertyState = global<number>(id, defaultValue);

  if (minValue != null && maxValue != null) {
    let step = property.schema.type === 'number' ? 0.1 : 1;
    if (
      'x-imgly-step' in property.schema &&
      typeof property.schema['x-imgly-step'] === 'number'
    ) {
      step = property.schema['x-imgly-step'];
    }

    builder.Slider(id, {
      inputLabel,
      min: minValue,
      max: maxValue,
      step,
      ...propertyState
    });
  } else {
    builder.NumberInput(id, {
      inputLabel,
      min: minValue,
      max: maxValue,
      ...propertyState
    });
  }

  return () => ({
    id: property.id,
    type: 'integer',
    value: propertyState.value
  });
}

function renderAnyOfProperty<K extends OutputKind, I, O extends Output>(
  context: BuilderRenderFunctionContext<any>,
  property: Required<Property>,
  provider: Provider<K, I, O>,
  panelInput: PanelInputSchema<K, I>,
  options: UIOptions,
  config: CommonConfiguration<I, O>,
  kind: K
): GetPropertyInput | undefined {
  const {
    builder,
    experimental: { global }
  } = context;
  const { id: propertyId } = property;

  const id = `${provider.id}.${propertyId}`;
  const inputLabel = createInputLabelArray(property, provider, kind);

  const anyOf = (property.schema.anyOf ?? []) as OpenAPIV3.SchemaObject[];
  const values: EnumValue[] = [];
  const conditionalRender: Record<string, () => GetPropertyInput> = {};
  const conditionalInputs: Record<string, () => PropertyInput> = {};
  const { labels, icons } = extractEnumMetadata(property.schema);

  const renderFunctionMap: Record<string, Function> = {
    string: renderStringProperty,
    boolean: renderBooleanProperty,
    integer: renderIntegerProperty,
    object: renderObjectProperty
  };

  const extractValueId = (anySchema: any, schemaId: string): string =>
    (anySchema as any).$ref
      ? (anySchema as any).$ref.split('/').pop()
      : schemaId.split('.').pop() ?? schemaId;

  const createEnumValue = (enumId: string, valueId: string): EnumValue => ({
    id: enumId,
    label: createInputLabelArray(property, provider, kind, valueId),
    icon: icons[valueId] ?? icons[enumId]
  });

  anyOf.forEach((anySchema, index) => {
    const schemaId = `${provider.id}.${propertyId}.anyOf[${index}]`;

    if ((anySchema as any).$ref || anySchema.title) {
      const refName = (anySchema as any).$ref
        ? (anySchema as any).$ref.split('/').pop()
        : anySchema.title;

      conditionalRender[schemaId] = () =>
        renderObjectProperty(
          context,
          {
            id: schemaId,
            schema: { ...anySchema, title: labels[refName] || refName }
          },
          provider,
          panelInput,
          options,
          config,
          kind
        );

      values.push(createEnumValue(schemaId, refName));
    } else if (anySchema.type === 'string' && anySchema.enum) {
      anySchema.enum.forEach((valueId) => {
        values.push(createEnumValue(valueId, valueId));
      });
    } else if (anySchema.type && renderFunctionMap[anySchema.type]) {
      const renderFunction = renderFunctionMap[anySchema.type];
      conditionalRender[schemaId] = () =>
        renderFunction(
          context,
          { id: schemaId, schema: { ...anySchema, title: anySchema.title } },
          provider,
          panelInput,
          options,
          config,
          kind
        );

      const valueId = extractValueId(anySchema, schemaId);
      values.push(
        anySchema.type === 'string' && !anySchema.enum
          ? {
              id: schemaId,
              label: anySchema.title || valueId,
              icon:
                (anySchema.title && icons[anySchema.title]) || icons[valueId]
            }
          : createEnumValue(schemaId, valueId)
      );
    }
  });

  const defaultValue =
    property.schema.default != null
      ? values.find((value) => value.id === property.schema.default) ??
        values[0]
      : values[0];

  const propertyState = global<EnumValue>(id, defaultValue);

  builder.Select(id, {
    inputLabel,
    values,
    ...propertyState
  });

  if (propertyState.value.id in conditionalRender) {
    const inputs = conditionalRender[propertyState.value.id]();
    conditionalInputs[propertyState.value.id] = inputs;
  }

  return () => {
    const conditionalInput = conditionalInputs[propertyState.value.id];

    if (conditionalInput != null) {
      return {
        ...conditionalInput(),
        id: property.id
      };
    }

    return {
      id: property.id,
      type: 'string',
      value: propertyState.value.id
    };
  };
}

function getImglyExtensionBuilder(
  schema: OpenAPIV3.SchemaObject
): ExtensionImglyBuilder | undefined {
  if ('x-imgly-builder' in schema) {
    const extension = schema['x-imgly-builder'] as ExtensionImglyBuilder;
    return extension;
  }

  return undefined;
}

export default renderProperty;
