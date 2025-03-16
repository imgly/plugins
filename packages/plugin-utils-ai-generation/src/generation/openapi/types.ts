import { Builder } from '@cesdk/cesdk-js';
import { OpenAPIV3 } from 'openapi-types';

export interface Property {
  id: string;
  schema: OpenAPIV3.SchemaObject;
}

type PropertyInputForString = {
  id: string;
  type: 'string';
  value: string;
};

type PropertyInputForBoolean = {
  id: string;
  type: 'boolean';
  value: boolean;
};

type PropertyInputForInteger = {
  id: string;
  type: 'integer';
  value: number;
};

type PropertyInputForObject = {
  id: string;
  type: 'object';
  value: Record<string, PropertyInput>;
};

export type PropertyInput =
  | PropertyInputForString
  | PropertyInputForBoolean
  | PropertyInputForInteger
  | PropertyInputForObject;

export type GetPropertyInput = () => PropertyInput;

export interface EnumValue {
  id: string;
  label: string | string[];
}

export interface ExtensionImglyBuilder {
  component?: keyof Builder;
}
