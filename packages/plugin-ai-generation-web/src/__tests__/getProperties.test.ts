import { describe, expect, it } from '@jest/globals';
import { OpenAPIV3 } from 'openapi-types';
import getProperties from '../generation/openapi/getProperties';
import { PanelInputSchema } from '../generation/provider';

describe('getProperties', () => {
  const mockInputSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
      prompt: {
        type: 'string',
        description: 'Text prompt'
      },
      width: {
        type: 'integer',
        description: 'Image width'
      },
      height: {
        type: 'integer',
        description: 'Image height'
      }
    }
  };

  const mockPanelInput: PanelInputSchema<'image', any> = {
    type: 'schema',
    document: {} as OpenAPIV3.Document,
    inputReference: '#/components/schemas/Input',
    getBlockInput: async () => ({ image: { width: 1024, height: 1024 } })
  };

  it('should return properties in default order when no custom order is specified', () => {
    const result = getProperties(mockInputSchema, mockPanelInput);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'prompt',
      schema: mockInputSchema.properties!.prompt
    });
    expect(result[1]).toEqual({
      id: 'width',
      schema: mockInputSchema.properties!.width
    });
    expect(result[2]).toEqual({
      id: 'height',
      schema: mockInputSchema.properties!.height
    });
  });

  it('should return properties in custom order when order array is specified', () => {
    const panelInputWithOrder = {
      ...mockPanelInput,
      order: ['height', 'prompt', 'width']
    };

    const result = getProperties(mockInputSchema, panelInputWithOrder);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'height',
      schema: mockInputSchema.properties!.height
    });
    expect(result[1]).toEqual({
      id: 'prompt',
      schema: mockInputSchema.properties!.prompt
    });
    expect(result[2]).toEqual({
      id: 'width',
      schema: mockInputSchema.properties!.width
    });
  });

  it('should return properties in order returned by order function', () => {
    const panelInputWithOrderFn = {
      ...mockPanelInput,
      order: (order: string[]) => order.reverse()
    };

    const result = getProperties(mockInputSchema, panelInputWithOrderFn);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'height',
      schema: mockInputSchema.properties!.height
    });
    expect(result[1]).toEqual({
      id: 'width',
      schema: mockInputSchema.properties!.width
    });
    expect(result[2]).toEqual({
      id: 'prompt',
      schema: mockInputSchema.properties!.prompt
    });
  });

  it('should use extension keyword order when specified', () => {
    const schemaWithExtension = {
      ...mockInputSchema,
      'x-order': ['width', 'height', 'prompt']
    };

    const panelInputWithExtensionKeyword = {
      ...mockPanelInput,
      orderExtensionKeyword: 'x-order'
    };

    const result = getProperties(
      schemaWithExtension,
      panelInputWithExtensionKeyword
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'width',
      schema: mockInputSchema.properties!.width
    });
    expect(result[1]).toEqual({
      id: 'height',
      schema: mockInputSchema.properties!.height
    });
    expect(result[2]).toEqual({
      id: 'prompt',
      schema: mockInputSchema.properties!.prompt
    });
  });

  it('should prioritize order array over extension keyword', () => {
    const schemaWithExtension = {
      ...mockInputSchema,
      'x-order': ['width', 'height', 'prompt']
    };

    const panelInputWithBoth = {
      ...mockPanelInput,
      orderExtensionKeyword: 'x-order',
      order: ['prompt', 'width', 'height']
    };

    const result = getProperties(schemaWithExtension, panelInputWithBoth);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'prompt',
      schema: mockInputSchema.properties!.prompt
    });
    expect(result[1]).toEqual({
      id: 'width',
      schema: mockInputSchema.properties!.width
    });
    expect(result[2]).toEqual({
      id: 'height',
      schema: mockInputSchema.properties!.height
    });
  });

  it('should handle properties with undefined schema', () => {
    const schemaWithLimitedProperties = {
      ...mockInputSchema,
      properties: {
        prompt: mockInputSchema.properties!.prompt
        // width and height are missing from properties but might be in order
      }
    };

    const panelInputWithMissingProperty = {
      ...mockPanelInput,
      order: ['width', 'prompt']
    };

    const result = getProperties(
      schemaWithLimitedProperties,
      panelInputWithMissingProperty
    );

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: 'width', schema: undefined });
    expect(result[1]).toEqual({
      id: 'prompt',
      schema: mockInputSchema.properties!.prompt
    });
  });

  it('should throw error when input schema has no properties', () => {
    const schemaWithoutProperties: OpenAPIV3.SchemaObject = {
      type: 'object'
    };

    expect(() => {
      getProperties(schemaWithoutProperties, mockPanelInput);
    }).toThrow('Input schema must have properties');
  });

  it('should remove duplicates from order when using function', () => {
    const panelInputWithDuplicates = {
      ...mockPanelInput,
      order: () => ['prompt', 'width', 'prompt', 'height', 'width']
    };

    const result = getProperties(mockInputSchema, panelInputWithDuplicates);

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'prompt',
      schema: mockInputSchema.properties!.prompt
    });
    expect(result[1]).toEqual({
      id: 'width',
      schema: mockInputSchema.properties!.width
    });
    expect(result[2]).toEqual({
      id: 'height',
      schema: mockInputSchema.properties!.height
    });
  });

  it('should handle multiple extension keywords', () => {
    const schemaWithMultipleExtensions = {
      ...mockInputSchema,
      'x-custom-order': ['height', 'prompt', 'width']
    };

    const panelInputWithMultipleKeywords = {
      ...mockPanelInput,
      orderExtensionKeyword: ['x-order', 'x-custom-order']
    };

    const result = getProperties(
      schemaWithMultipleExtensions,
      panelInputWithMultipleKeywords
    );

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({
      id: 'height',
      schema: mockInputSchema.properties!.height
    });
    expect(result[1]).toEqual({
      id: 'prompt',
      schema: mockInputSchema.properties!.prompt
    });
    expect(result[2]).toEqual({
      id: 'width',
      schema: mockInputSchema.properties!.width
    });
  });

  it('should throw error for invalid orderExtensionKeyword type', () => {
    const panelInputWithInvalidKeyword = {
      ...mockPanelInput,
      orderExtensionKeyword: 123 as any
    };

    expect(() => {
      getProperties(mockInputSchema, panelInputWithInvalidKeyword);
    }).toThrow('orderExtensionKeyword must be a string or an array of strings');
  });
});

describe('getOrder (internal function)', () => {
  const mockInputSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      width: { type: 'integer' },
      height: { type: 'integer' }
    }
  };

  const mockPanelInput: PanelInputSchema<'image', any> = {
    type: 'schema',
    document: {} as OpenAPIV3.Document,
    inputReference: '#/components/schemas/Input',
    getBlockInput: async () => ({ image: { width: 1024, height: 1024 } })
  };

  it('should return default order from schema properties when no order specified', () => {
    // Test default order by checking getProperties result ordering
    const result = getProperties(mockInputSchema, mockPanelInput);
    const propertyIds = result.map((p) => p.id);

    expect(propertyIds).toEqual(['prompt', 'width', 'height']);
  });

  it('should return order from panelInput.order array when specified', () => {
    const panelInputWithOrder = {
      ...mockPanelInput,
      order: ['height', 'prompt', 'width']
    };

    const result = getProperties(mockInputSchema, panelInputWithOrder);
    const propertyIds = result.map((p) => p.id);

    expect(propertyIds).toEqual(['height', 'prompt', 'width']);
  });

  it('should apply order function to default order', () => {
    const panelInputWithOrderFn = {
      ...mockPanelInput,
      order: (order: string[]) => order.slice().reverse()
    };

    const result = getProperties(mockInputSchema, panelInputWithOrderFn);
    const propertyIds = result.map((p) => p.id);

    expect(propertyIds).toEqual(['height', 'width', 'prompt']);
  });

  it('should use extension keyword order when available', () => {
    const schemaWithExtension = {
      ...mockInputSchema,
      'x-order': ['width', 'height', 'prompt']
    };

    const panelInputWithExtension = {
      ...mockPanelInput,
      orderExtensionKeyword: 'x-order'
    };

    const result = getProperties(schemaWithExtension, panelInputWithExtension);
    const propertyIds = result.map((p) => p.id);

    expect(propertyIds).toEqual(['width', 'height', 'prompt']);
  });

  it('should apply order function to extension keyword order', () => {
    const schemaWithExtension = {
      ...mockInputSchema,
      'x-order': ['width', 'height', 'prompt']
    };

    const panelInputWithBoth = {
      ...mockPanelInput,
      orderExtensionKeyword: 'x-order',
      order: (order: string[]) => order.filter((id) => id !== 'height')
    };

    const result = getProperties(schemaWithExtension, panelInputWithBoth);
    const propertyIds = result.map((p) => p.id);

    expect(propertyIds).toEqual(['width', 'prompt']);
  });

  it('should remove duplicates from final order', () => {
    const panelInputWithOrderFn = {
      ...mockPanelInput,
      order: (order: string[]) => [...order, ...order] // Create duplicates
    };

    const result = getProperties(mockInputSchema, panelInputWithOrderFn);
    const propertyIds = result.map((p) => p.id);

    expect(propertyIds).toEqual(['prompt', 'width', 'height']);
    expect(propertyIds.length).toBe(3); // No duplicates
  });

  it('should throw error when schema has no properties', () => {
    const schemaWithoutProperties: OpenAPIV3.SchemaObject = {
      type: 'object'
    };

    expect(() => {
      getProperties(schemaWithoutProperties, mockPanelInput);
    }).toThrow('Input schema must have properties');
  });
});

describe('getOrderFromExtensionKeyword (internal function)', () => {
  const mockInputSchema: OpenAPIV3.SchemaObject = {
    type: 'object',
    properties: {
      prompt: { type: 'string' },
      width: { type: 'integer' }
    }
  };

  const mockPanelInput: PanelInputSchema<'image', any> = {
    type: 'schema',
    document: {} as OpenAPIV3.Document,
    inputReference: '#/components/schemas/Input',
    getBlockInput: async () => ({ image: { width: 1024, height: 1024 } })
  };

  it('should return undefined when orderExtensionKeyword is not specified', () => {
    const result = getProperties(mockInputSchema, mockPanelInput);
    const propertyIds = result.map((p) => p.id);

    // Should use default order from schema properties
    expect(propertyIds).toEqual(['prompt', 'width']);
  });

  it('should return undefined when extension keyword is not found in schema', () => {
    const panelInputWithMissingKeyword = {
      ...mockPanelInput,
      orderExtensionKeyword: 'x-missing-order'
    };

    const result = getProperties(mockInputSchema, panelInputWithMissingKeyword);
    const propertyIds = result.map((p) => p.id);

    // Should fall back to default order
    expect(propertyIds).toEqual(['prompt', 'width']);
  });

  it('should return order from extension keyword when found', () => {
    const schemaWithExtension = {
      ...mockInputSchema,
      'x-custom-order': ['width', 'prompt']
    };

    const panelInputWithExtension = {
      ...mockPanelInput,
      orderExtensionKeyword: 'x-custom-order'
    };

    const result = getProperties(schemaWithExtension, panelInputWithExtension);
    const propertyIds = result.map((p) => p.id);

    expect(propertyIds).toEqual(['width', 'prompt']);
  });

  it('should handle array of extension keywords and use first found', () => {
    const schemaWithMultipleExtensions = {
      ...mockInputSchema,
      'x-second-order': ['width', 'prompt']
    };

    const panelInputWithMultipleKeywords = {
      ...mockPanelInput,
      orderExtensionKeyword: [
        'x-first-order',
        'x-second-order',
        'x-third-order'
      ]
    };

    const result = getProperties(
      schemaWithMultipleExtensions,
      panelInputWithMultipleKeywords
    );
    const propertyIds = result.map((p) => p.id);

    expect(propertyIds).toEqual(['width', 'prompt']);
  });

  it('should throw error for invalid orderExtensionKeyword type', () => {
    const panelInputWithInvalidKeyword = {
      ...mockPanelInput,
      orderExtensionKeyword: 123 as any
    };

    expect(() => {
      getProperties(mockInputSchema, panelInputWithInvalidKeyword);
    }).toThrow('orderExtensionKeyword must be a string or an array of strings');
  });

  it('should throw error for invalid orderExtensionKeyword object type', () => {
    const panelInputWithInvalidKeyword = {
      ...mockPanelInput,
      orderExtensionKeyword: {} as any
    };

    expect(() => {
      getProperties(mockInputSchema, panelInputWithInvalidKeyword);
    }).toThrow('orderExtensionKeyword must be a string or an array of strings');
  });
});
