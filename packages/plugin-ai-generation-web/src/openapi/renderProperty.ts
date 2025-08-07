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
  const inputLabel = [
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.property.${property.id}`,
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.defaults.property.${property.id}`
  ];

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
  const inputLabel = [
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.property.${property.id}`,
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.defaults.property.${property.id}`
  ];

  const icons: Record<string, string> =
    'x-imgly-enum-icons' in property.schema &&
    typeof property.schema['x-imgly-enum-icons'] === 'object'
      ? (property.schema['x-imgly-enum-icons'] as Record<string, string>)
      : {};

  const enumLabels: Record<string, string> =
    'x-imgly-enum-labels' in property.schema &&
    typeof property.schema['x-imgly-enum-labels'] === 'object'
      ? (property.schema['x-imgly-enum-labels'] as Record<string, string>)
      : {};

  const values: EnumValue[] = (property.schema.enum ?? []).map((valueId) => ({
    id: valueId,
    label: [
      `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.property.${property.id}.${valueId}`,
      `ly.img.plugin-ai-generation-web.property.${property.id}.${valueId}`,
      `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.property.${property.id}.${valueId}`,
      `ly.img.plugin-ai-generation-web.defaults.property.${property.id}.${valueId}`
    ],
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
  const inputLabel = [
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.property.${property.id}`,
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.defaults.property.${property.id}`
  ];

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
  const inputLabel = [
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.property.${property.id}`,
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.defaults.property.${property.id}`
  ];

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
  const inputLabel = [
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.property.${property.id}`,
    `ly.img.plugin-ai-${kind}-generation-web.${provider.id}.defaults.property.${property.id}`,
    `ly.img.plugin-ai-generation-web.defaults.property.${property.id}`
  ];

  const anyOf = (property.schema.anyOf ?? []) as OpenAPIV3.SchemaObject[];

  const values: EnumValue[] = [];

  const conditionalRender: Record<string, () => GetPropertyInput> = {};
  const conditionalInputs: Record<string, () => PropertyInput> = {};

  anyOf.forEach((anySchema, index) => {
    const label = anySchema.title ?? 'common.custom';
    const schemaId = `${provider.id}.${propertyId}.anyOf[${index}]`;

    const labels: Record<string, string> =
      'x-imgly-enum-labels' in property.schema &&
      typeof property.schema['x-imgly-enum-labels'] === 'object'
        ? (property.schema['x-imgly-enum-labels'] as Record<string, string>)
        : {};

    const icons: Record<string, string> =
      'x-imgly-enum-icons' in property.schema &&
      typeof property.schema['x-imgly-enum-icons'] === 'object'
        ? (property.schema['x-imgly-enum-icons'] as Record<string, string>)
        : {};

    if (anySchema.type === 'string') {
      if (anySchema.enum != null) {
        anySchema.enum.forEach((valueId) => {
          values.push({
            id: valueId,
            label: labels[valueId] ?? getLabelFromId(valueId),
            icon: icons[valueId]
          });
        });
      } else {
        conditionalRender[schemaId] = () => {
          return renderStringProperty(
            context,
            { id: schemaId, schema: { ...anySchema, title: label } },
            provider,
            panelInput,
            options,
            config,
            kind
          );
        };

        values.push({
          id: schemaId,
          label: labels[label] ?? label,
          icon: icons[label]
        });
      }
    } else if (anySchema.type === 'boolean') {
      conditionalRender[schemaId] = () => {
        return renderBooleanProperty(
          context,
          { id: schemaId, schema: { ...anySchema, title: label } },
          provider,
          panelInput,
          options,
          config,
          kind
        );
      };

      values.push({
        id: schemaId,
        label: labels[label] ?? label,
        icon: icons[label]
      });
    } else if (anySchema.type === 'integer') {
      conditionalRender[schemaId] = () => {
        return renderIntegerProperty(
          context,
          { id: schemaId, schema: { ...anySchema, title: label } },
          provider,
          panelInput,
          options,
          config,
          kind
        );
      };

      values.push({
        id: schemaId,
        label: labels[label] ?? label,
        icon: icons[label]
      });
    } else if (anySchema.type === 'array') {
      // not supported yet
    } else if (anySchema.type === 'object') {
      conditionalRender[schemaId] = () => {
        return renderObjectProperty(
          context,
          { id: schemaId, schema: { ...anySchema, title: label } },
          provider,
          panelInput,
          options,
          config,
          kind
        );
      };

      values.push({
        id: schemaId,
        label: labels[label] ?? label,
        icon: icons[label]
      });
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
