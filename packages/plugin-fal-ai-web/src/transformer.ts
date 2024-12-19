import { type OpenAPIV3 } from 'openapi-types';
import { SelectValue, State, StateProperties } from './types';

interface BuilderComponent {
  hide?: boolean;
  propertyName: string;
  builderComponent:
    | 'Checkbox'
    | 'NumberInput'
    | 'TextArea'
    | 'TextInput'
    | 'Select';
  builderProperties: {
    values?: SelectValue[];
    inputLabel?: string | string[];
    inputLabelPosition?: 'top' | 'bottom';
    min?: number;
    max?: number;
  };
  state: StateProperties<any>;
}

export type RequestValues = {
  [name: string]: () => boolean | string | number | RequestValues;
};

export type RequestInput = {
  [name: string]: boolean | string | number | RequestInput;
};

/**
 * Select value associated with a oneOf select component.
 */
type OneOfSelectValue = SelectValue & {
  value: () => boolean | string | number | RequestValues;
};

export type Result = {
  components: BuilderComponent[];
  requestValues: RequestValues;
};

const DEFAULT_ID = 'fal-ai';

/**
 * Transforms a OpenAPI JSON schema object to a list of builder components
 * that than can be rendered in the UI and its current values used to make
 * an request to the fal API.
 */
class Transformer {
  private document: OpenAPIV3.Document;

  public id: string;

  public title: string;

  public path: string;

  public jsonSchema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;

  private getState: State;

  constructor(document: OpenAPIV3.Document, getState: State) {
    this.document = document;
    this.getState = getState;

    this.title = document.info.title;
    const xIMGLY = (document.info as any)['x-imgly'];
    this.id = xIMGLY?.id ?? DEFAULT_ID;

    const paths = Object.keys(document.paths);

    this.path = paths[0];
    const endpoint = document.paths[this.path];
    const requestBody = endpoint?.post?.requestBody;

    const { content } = requestBody as OpenAPIV3.RequestBodyObject;
    const contentSchema = content?.['application/json']?.schema;

    if (contentSchema == null) {
      throw new Error('No JSON schema found in request body');
    }

    this.jsonSchema = contentSchema;
  }

  /**
   * Transform and return the result for the builder components
   */
  public transform(): Result {
    return this.transformProperties({ input: this.jsonSchema });
  }

  /**
   * Get the request input values from the current state of the builder components.
   * This can be used to make a request to the fal API.
   */
  public getRequestInput(requestValues: RequestValues): RequestInput {
    const request: {
      [name: string]: boolean | string | number | { [key: string]: any };
    } = {};

    Object.entries(requestValues).forEach(([propertyName, value]) => {
      const evaluatedValue = value();
      if (evaluatedValue == null) return;
      if (typeof evaluatedValue === 'object') {
        request[propertyName] = this.getRequestInput(evaluatedValue);
      } else {
        request[propertyName] = evaluatedValue;
      }
    });

    return request;
  }

  /**
   * Parse and transform the properties of a schema object to builder components result.
   */
  private transformProperties(propertiesByName: {
    [name: string]: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject;
  }): Result {
    const propertyNames = Object.keys(propertiesByName);
    return propertyNames.reduce(
      (acc, propertyName) => {
        const property = propertiesByName[propertyName];

        const transformedSchemaObject = this.transformObject(
          propertyName,
          property
        );

        return {
          components: [
            ...acc.components,
            ...transformedSchemaObject.components
          ],
          requestValues: {
            ...acc.requestValues,
            ...transformedSchemaObject.requestValues
          }
        };
      },
      { components: [], requestValues: {} } as Result
    );
  }

  /**
   * Transform a single schema/reference object to a builder component result.
   */
  private transformObject(
    propertyName: string,
    schemaObject: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject
  ): Result {
    if (typeof schemaObject === 'object' && '$ref' in schemaObject) {
      // TODO: Handle $ref
      return {
        components: [],
        requestValues: {}
      };
    } else {
      return this.transformSchemaObject(propertyName, schemaObject);
    }
  }

  /**
   * Transform a single schema object to a builder component result.
   */
  private transformSchemaObject(
    propertyName: string,
    schemaObject: OpenAPIV3.SchemaObject
  ): Result {
    const result = { components: [], requestValues: {} };

    if (schemaObject.oneOf != null && Array.isArray(schemaObject.oneOf)) {
      return this.transformOneOf(propertyName, schemaObject);
    }

    switch (schemaObject.type) {
      case 'array': {
        return result;
      }
      case 'string': {
        const component = getComponent(propertyName, schemaObject) ?? {
          propertyName,
          builderComponent: 'TextInput',
          builderProperties: {
            inputLabel: propertyName
          }
        };

        const defaultValue = getDefaultValue(schemaObject, component, '');
        const state = this.getState(propertyName, defaultValue);

        return {
          components: [{ ...component, state }],
          requestValues: { [propertyName]: () => getStateValue(state) }
        };
      }

      case 'integer':
      case 'number': {
        const component = getComponent(propertyName, schemaObject) ?? {
          propertyName,
          builderComponent: 'NumberInput',
          builderProperties: {
            inputLabel: propertyName
          }
        };

        const defaultValue = getDefaultValue(schemaObject, component, 0);
        const state = this.getState(propertyName, defaultValue);

        return {
          components: [{ ...component, state }],
          requestValues: { [propertyName]: () => getStateValue(state) }
        };
      }

      case 'boolean': {
        const component = getComponent(propertyName, schemaObject) ?? {
          propertyName,
          builderComponent: 'Checkbox',
          builderProperties: {
            inputLabel: propertyName
          }
        };

        const defaultValue = getDefaultValue(schemaObject, component, false);
        const state = this.getState(propertyName, defaultValue);

        return {
          components: [{ ...component, state }],
          requestValues: { [propertyName]: () => getStateValue(state) }
        };
      }

      case 'object': {
        if (
          schemaObject.properties != null &&
          typeof schemaObject.properties === 'object'
        ) {
          const nestedResult = this.transformProperties(
            schemaObject.properties
          );
          return {
            components: nestedResult.components,
            requestValues: {
              [propertyName]: () => ({
                ...nestedResult.requestValues
              })
            }
          };
        }
        return result;
      }
      default: {
        return result;
      }
    }
  }

  /**
   * Transform the `oneOf` case. This will create a select component where
   * the user can select a value from the `oneOf` array. If a enum
   * is present in the `oneOf` schema, it will be used as the values for the
   * select component. For other types, the select dropdown will show conditional
   * components based on the selected value.
   */
  private transformOneOf(
    propertyName: string,
    schemaObject: OpenAPIV3.SchemaObject
  ): Result {
    const result: Result = { components: [], requestValues: {} };
    if (schemaObject.oneOf == null || !Array.isArray(schemaObject.oneOf)) {
      return result;
    }

    const xIMGLY = (schemaObject as any)['x-imgly'];
    const { type: _type, ...properties } = xIMGLY?.component ?? {};

    const selectValues: OneOfSelectValue[] = [];

    schemaObject.oneOf.forEach((oneOfSchema, i) => {
      const transformedSchemaObject = this.transformObject(
        propertyName,
        oneOfSchema
      );

      const xLabel = (oneOfSchema as any)['x-label'];
      const selectValueId = xLabel ?? `oneOf-${i}`;
      let hasConditionalComponents = false;

      const oneOfComponents = transformedSchemaObject.components.reduce(
        (acc, component) => {
          // This component is a select component itself. We merge it
          // with the parent select component and discard it.
          if (component.builderProperties.values != null) {
            selectValues.push(
              ...component.builderProperties.values.map((value) => ({
                ...value,
                value: () => value.id
              }))
            );
          } else {
            acc.push({
              // Only render if the if it is selected by the select component
              hide:
                this.getState<{ id: string }>(propertyName).value?.id !==
                selectValueId,
              ...component
            });
            hasConditionalComponents = true;
          }

          return acc;
        },
        [] as BuilderComponent[]
      );

      if (hasConditionalComponents) {
        selectValues.push({
          id: selectValueId,
          label: selectValueId,
          value: () => transformedSchemaObject.requestValues[propertyName]()
        });
      }

      result.components.push(...oneOfComponents);
    });

    const defaulSelectValue = selectValues[0];

    const selectComponent: BuilderComponent = {
      propertyName,
      builderComponent: 'Select',
      builderProperties: {
        ...properties,
        values: selectValues
      },
      state: this.getState(propertyName, defaulSelectValue)
    };

    result.components.unshift(selectComponent);
    result.requestValues[propertyName] = () => {
      // Get the value from the selected oneOf value
      return (
        this.getState<OneOfSelectValue>(
          propertyName,
          defaulSelectValue
        ).value?.value() ?? ''
      );
    };

    return result;
  }
}

function getComponent(
  propertyName: string,
  schemaObject: OpenAPIV3.NonArraySchemaObject
): Omit<BuilderComponent, 'state'> | undefined {
  const xIMGLY = (schemaObject as any)['x-imgly'];
  const enumValues = schemaObject.enum;
  const enumLabels = (schemaObject as any)['x-enum-labels'] ?? {};

  const hasEnums = enumValues != null && Array.isArray(enumValues);

  if (
    xIMGLY != null &&
    xIMGLY.component != null &&
    xIMGLY.component.type != null &&
    typeof xIMGLY.component.type === 'string'
  ) {
    const { type: builderComponent, ...builderProperties } = xIMGLY.component;
    return {
      propertyName,
      builderComponent: hasEnums ? 'Select' : builderComponent,
      builderProperties: {
        ...builderProperties,
        values: hasEnums
          ? enumValues.map((value) => ({
              id: value as string,
              label: enumLabels[value] ?? (value as string)
            }))
          : undefined
      }
    };
  } else {
    let builderComponent:
      | 'Select'
      | 'Checkbox'
      | 'NumberInput'
      | 'TextArea'
      | 'TextInput' = 'TextInput';

    switch (schemaObject.type) {
      case 'string':
        builderComponent = 'TextInput';
        break;
      case 'integer':
      case 'number':
        builderComponent = 'NumberInput';
        break;
      case 'boolean':
        builderComponent = 'Checkbox';
        break;
      default: {
        return undefined;
      }
    }

    builderComponent = hasEnums ? 'Select' : builderComponent;

    return {
      propertyName,
      builderComponent,
      builderProperties: {
        inputLabel: propertyName,
        values: hasEnums
          ? enumValues.map((value) => ({
              id: value as string,
              label: enumLabels[value] ?? (value as string)
            }))
          : undefined
      }
    };
  }
}

function getDefaultValue<T>(
  schemaObject: OpenAPIV3.SchemaObject,
  component: Pick<BuilderComponent, 'builderProperties'>,
  defaultValue: T
): T | { id: string; label: string } {
  if (component.builderProperties.values != null) {
    return (
      component.builderProperties.values.find(
        (value) => value.id === schemaObject.default
      ) ?? component.builderProperties.values[0]
    );
  } else {
    return schemaObject.default ?? defaultValue;
  }
}

function getStateValue(
  state: Omit<
    StateProperties<string | number | boolean | SelectValue>,
    'setValue'
  >
): string | number | boolean {
  const value = state.value;

  if (value != null && typeof value === 'object' && 'id' in value) {
    return value.id as string;
  }

  return value as string | number | boolean;
}

export default Transformer;
