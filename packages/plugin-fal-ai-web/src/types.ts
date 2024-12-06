import { type OpenAPIV3 } from 'openapi-types';

export interface PluginConfiguration {
  proxyUrl?: string;
  schemas?: Array<OpenAPIV3.Document>;
}

export type SelectValue = {
  id: string;
  label: string;
};

export interface SchemaIMGLYComponent {
  type: 'TextArea' | 'TextInput' | 'Select';
  inputLabel?: string;
}

export interface SingleComponentProperties {
  componentPropertiesType: 'single';

  propertyKey: string;

  type: 'TextArea' | 'TextInput' | 'Select';

  show: boolean;

  state: StateProperties<any>;
  defaultValue?: any;
  values?: { id: string; label: string }[];
  inputLabel?: string;
}

export interface ObjectComponentProperties {
  componentPropertiesType: 'object';

  propertyKey: string;

  nestedProperties: ComponentProperties[];
}

export type ComponentProperties =
  | SingleComponentProperties
  | ObjectComponentProperties;

export interface StateProperties<T> {
  /**
   * The current value of this state. If no value was set, the default
   * value will be returned.
   *
   * @returns The new value or the default value.
   */
  value: T;
  /**
   * Setting the value of this state. Subsequent calls to `value` will return
   * this value. This will also cause the render function to rerender if the
   * `value` was used.
   *
   * @param value - The new value to set.
   */
  setValue: (value: T) => void;
}

/**
 * The `State` type is a function that returns a state object.
 * TODO: Replace with exported type from CE.SDK
 */
export type State = {
  /**
   * State object that can be used to store and retrieve a value. If
   * no values are stored, the default value will be returned.
   *
   * @param id - The unique identifier for the state.
   * @param defaultValue - The default value for the state.
   */
  <T>(id: string, defaultValue: T): StateProperties<T>;
  /**
   * State object that can be used to store and retrieve a value.
   * If no value was set, the value will be `undefined`.
   *
   * @param id - The unique identifier for the state.
   */
  <T>(id: string): StateProperties<T | undefined>;
};
