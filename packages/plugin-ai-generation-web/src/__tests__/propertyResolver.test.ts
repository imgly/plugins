import { describe, expect, it } from '@jest/globals';
import { resolvePropertyDefault } from '../utils/propertyResolver';
import type { PropertyContext } from '../core/propertyConfiguration';

describe('propertyResolver', () => {
  const mockContext: PropertyContext = {
    engine: {} as any, // Mock engine
    cesdk: undefined,
    locale: 'en'
  };

  describe('resolvePropertyDefault', () => {
    it('should resolve static default value', () => {
      const result = resolvePropertyDefault(
        'testProp',
        { default: 'static-value' },
        mockContext
      );
      expect(result).toBe('static-value');
    });

    it('should resolve dynamic default value', () => {
      const result = resolvePropertyDefault(
        'testProp',
        { default: (ctx) => `locale-${ctx.locale}` },
        mockContext
      );
      expect(result).toBe('locale-en');
    });

    it('should handle context with cesdk', () => {
      const contextWithCesdk: PropertyContext = {
        ...mockContext,
        cesdk: {
          i18n: {
            getLocale: () => 'de'
          }
        } as any
      };

      const result = resolvePropertyDefault(
        'testProp',
        {
          default: (ctx) => (ctx.cesdk ? 'has-cesdk' : 'no-cesdk')
        },
        contextWithCesdk
      );
      expect(result).toBe('has-cesdk');
    });

    it('should follow fallback chain: config -> schema -> fallback', () => {
      // Test with config
      let result = resolvePropertyDefault(
        'testProp',
        { default: 'config-value' },
        mockContext,
        'schema-default',
        'fallback-default'
      );
      expect(result).toBe('config-value');

      // Test with schema (no config)
      result = resolvePropertyDefault(
        'testProp',
        undefined,
        mockContext,
        'schema-default',
        'fallback-default'
      );
      expect(result).toBe('schema-default');

      // Test with only fallback
      result = resolvePropertyDefault(
        'testProp',
        undefined,
        mockContext,
        undefined,
        'fallback-value'
      );
      expect(result).toBe('fallback-value');
    });

    it('should return undefined when no defaults provided', () => {
      const result = resolvePropertyDefault(
        'testProp',
        undefined,
        mockContext,
        undefined,
        undefined
      );
      expect(result).toBeUndefined();
    });

    it('should handle different value types', () => {
      // Number
      const numResult = resolvePropertyDefault(
        'numberProp',
        { default: 42 },
        mockContext
      );
      expect(numResult).toBe(42);

      // Boolean
      const boolResult = resolvePropertyDefault(
        'boolProp',
        { default: true },
        mockContext
      );
      expect(boolResult).toBe(true);

      // Object
      const objDefault = { key: 'value' };
      const objResult = resolvePropertyDefault(
        'objProp',
        { default: objDefault },
        mockContext
      );
      expect(objResult).toBe(objDefault);

      // Array
      const arrDefault = ['item1', 'item2'];
      const arrResult = resolvePropertyDefault(
        'arrProp',
        { default: arrDefault },
        mockContext
      );
      expect(arrResult).toBe(arrDefault);
    });

    it('should handle dynamic defaults with different locales', () => {
      const localeConfig = {
        default: (ctx: PropertyContext) => {
          switch (ctx.locale) {
            case 'de':
              return 'Erstelle ein Bild';
            case 'ja':
              return '画像を作成';
            default:
              return 'Create an image';
          }
        }
      };

      // Test English
      let result = resolvePropertyDefault('prompt', localeConfig, mockContext);
      expect(result).toBe('Create an image');

      // Test German
      const deContext = { ...mockContext, locale: 'de' };
      result = resolvePropertyDefault('prompt', localeConfig, deContext);
      expect(result).toBe('Erstelle ein Bild');

      // Test Japanese
      const jaContext = { ...mockContext, locale: 'ja' };
      result = resolvePropertyDefault('prompt', localeConfig, jaContext);
      expect(result).toBe('画像を作成');
    });
  });
});
