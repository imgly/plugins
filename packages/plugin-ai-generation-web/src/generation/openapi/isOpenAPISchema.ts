import { OpenAPIV3 } from 'openapi-types';

/**
 * Checks if an unknown object is an OpenAPI schema (first level only)
 *
 * @param obj - The object to check (potentially undefined)
 * @param debug - If true, log the reason when validation fails
 * @returns A boolean indicating whether the object is an OpenAPI schema
 */
export function isOpenAPISchema(
  obj: unknown,
  debug: boolean = false
): obj is OpenAPIV3.SchemaObject {
  // Helper function to log debug messages and return false
  const fail = (reason: string): false => {
    if (debug) {
      // eslint-disable-next-line no-console
      console.log(`OpenAPI Schema validation failed: ${reason}`);
    }
    return false;
  };

  // Check if obj is an object and not null
  if (typeof obj !== 'object' || obj === null) {
    return fail(
      `Input is ${obj === null ? 'null' : typeof obj}, not an object`
    );
  }

  const schema = obj as Record<string, any>;

  // Basic property validation - most schemas have at least one of these properties
  const hasSchemaTypeProperties =
    typeof schema.type === 'string' ||
    Array.isArray(schema.enum) ||
    typeof schema.properties === 'object' ||
    typeof schema.items === 'object' ||
    typeof schema.allOf === 'object' ||
    typeof schema.anyOf === 'object' ||
    typeof schema.oneOf === 'object' ||
    typeof schema.not === 'object';

  if (!hasSchemaTypeProperties) {
    return fail(
      'Missing required schema-defining properties (type, enum, properties, items, allOf, anyOf, oneOf, not)'
    );
  }

  // If it has a type, validate it's one of the allowed OpenAPI schema types
  if (schema.type !== undefined) {
    const validTypes = [
      'string',
      'number',
      'integer',
      'boolean',
      'array',
      'object',
      'null'
    ];

    // Type can be a string or an array of strings
    if (typeof schema.type === 'string') {
      if (!validTypes.includes(schema.type)) {
        return fail(
          `Invalid type: ${schema.type}. Must be one of ${validTypes.join(
            ', '
          )}`
        );
      }
    } else if (Array.isArray(schema.type)) {
      for (const type of schema.type) {
        if (typeof type !== 'string' || !validTypes.includes(type)) {
          return fail(
            `Array of types contains invalid value: ${type}. Must be one of ${validTypes.join(
              ', '
            )}`
          );
        }
      }
    } else {
      return fail(
        `Type must be a string or array of strings, got ${typeof schema.type}`
      );
    }
  }

  // If it has items (for array type), validate that items is an object (without recursion)
  if (schema.items !== undefined) {
    if (typeof schema.items !== 'object' || schema.items === null) {
      return fail(
        `Items must be an object, got ${
          schema.items === null ? 'null' : typeof schema.items
        }`
      );
    }
  }

  // If it has properties (for object type), validate that properties is an object (without recursion)
  if (schema.properties !== undefined) {
    if (typeof schema.properties !== 'object' || schema.properties === null) {
      return fail(
        `Properties must be an object, got ${
          schema.properties === null ? 'null' : typeof schema.properties
        }`
      );
    }
  }

  // Check if advanced schema constructs are valid (without recursion)
  const schemaArrays = ['allOf', 'anyOf', 'oneOf'];
  for (const arrayType of schemaArrays) {
    if (schema[arrayType] !== undefined) {
      if (!Array.isArray(schema[arrayType])) {
        return fail(
          `${arrayType} must be an array, got ${typeof schema[arrayType]}`
        );
      }

      // Just check that each item is an object (without recursion)
      for (let i = 0; i < schema[arrayType].length; i++) {
        const subSchema = schema[arrayType][i];
        if (typeof subSchema !== 'object' || subSchema === null) {
          return fail(
            `Item ${i} in ${arrayType} must be an object, got ${
              subSchema === null ? 'null' : typeof subSchema
            }`
          );
        }
      }
    }
  }

  // Check if 'not' is an object
  if (schema.not !== undefined) {
    if (typeof schema.not !== 'object' || schema.not === null) {
      return fail(
        `'not' must be an object, got ${
          schema.not === null ? 'null' : typeof schema.not
        }`
      );
    }
  }

  // If we have additionalProperties, make sure it's a boolean or an object
  if (schema.additionalProperties !== undefined) {
    if (
      typeof schema.additionalProperties !== 'boolean' &&
      (typeof schema.additionalProperties !== 'object' ||
        schema.additionalProperties === null)
    ) {
      return fail(
        `additionalProperties must be a boolean or an object, got ${
          schema.additionalProperties === null
            ? 'null'
            : typeof schema.additionalProperties
        }`
      );
    }
  }

  // Check basic format if present (for string type)
  if (schema.format !== undefined && typeof schema.format !== 'string') {
    return fail(`format must be a string, got ${typeof schema.format}`);
  }

  // Check number constraints
  const numberConstraints = [
    'minimum',
    'maximum',
    'exclusiveMinimum',
    'exclusiveMaximum',
    'multipleOf'
  ];
  for (const constraint of numberConstraints) {
    if (
      schema[constraint] !== undefined &&
      typeof schema[constraint] !== 'number'
    ) {
      return fail(
        `${constraint} must be a number, got ${typeof schema[constraint]}`
      );
    }
  }

  // Check string constraints
  if (
    schema.minLength !== undefined &&
    (typeof schema.minLength !== 'number' || schema.minLength < 0)
  ) {
    return fail(
      `minLength must be a non-negative number, got ${
        typeof schema.minLength === 'number'
          ? schema.minLength
          : typeof schema.minLength
      }`
    );
  }
  if (
    schema.maxLength !== undefined &&
    (typeof schema.maxLength !== 'number' || schema.maxLength < 0)
  ) {
    return fail(
      `maxLength must be a non-negative number, got ${
        typeof schema.maxLength === 'number'
          ? schema.maxLength
          : typeof schema.maxLength
      }`
    );
  }
  if (schema.pattern !== undefined && typeof schema.pattern !== 'string') {
    return fail(`pattern must be a string, got ${typeof schema.pattern}`);
  }

  // Check array constraints
  if (
    schema.minItems !== undefined &&
    (typeof schema.minItems !== 'number' || schema.minItems < 0)
  ) {
    return fail(
      `minItems must be a non-negative number, got ${
        typeof schema.minItems === 'number'
          ? schema.minItems
          : typeof schema.minItems
      }`
    );
  }
  if (
    schema.maxItems !== undefined &&
    (typeof schema.maxItems !== 'number' || schema.maxItems < 0)
  ) {
    return fail(
      `maxItems must be a non-negative number, got ${
        typeof schema.maxItems === 'number'
          ? schema.maxItems
          : typeof schema.maxItems
      }`
    );
  }
  if (
    schema.uniqueItems !== undefined &&
    typeof schema.uniqueItems !== 'boolean'
  ) {
    return fail(
      `uniqueItems must be a boolean, got ${typeof schema.uniqueItems}`
    );
  }

  // Check object constraints
  if (
    schema.minProperties !== undefined &&
    (typeof schema.minProperties !== 'number' || schema.minProperties < 0)
  ) {
    return fail(
      `minProperties must be a non-negative number, got ${
        typeof schema.minProperties === 'number'
          ? schema.minProperties
          : typeof schema.minProperties
      }`
    );
  }
  if (
    schema.maxProperties !== undefined &&
    (typeof schema.maxProperties !== 'number' || schema.maxProperties < 0)
  ) {
    return fail(
      `maxProperties must be a non-negative number, got ${
        typeof schema.maxProperties === 'number'
          ? schema.maxProperties
          : typeof schema.maxProperties
      }`
    );
  }
  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required)) {
      return fail(`required must be an array, got ${typeof schema.required}`);
    }
    for (let i = 0; i < schema.required.length; i++) {
      const prop = schema.required[i];
      if (typeof prop !== 'string') {
        return fail(
          `Item ${i} in required array must be a string, got ${typeof prop}`
        );
      }
    }
  }

  // It has passed all the first-level checks
  return true;
}
