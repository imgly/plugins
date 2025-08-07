import { describe, expect, it } from '@jest/globals';
import { mergeQuickActionsConfig } from '../utils/mergeQuickActionsConfig';

describe('mergeQuickActionsConfig', () => {
  // Sample provider defaults to use in tests
  const mockDefaults = {
    'ly.img.improve': true,
    'ly.img.fix': { mapInput: (input: any) => input },
    'ly.img.shorter': {},
    'ly.img.longer': true,
    'ly.img.changeTone': {
      mapInput: (input: any) => ({ ...input, tone: 'formal' })
    },
    'ly.img.translate': true,
    'ly.img.changeTextTo': { customProperty: 'value' }
  };

  describe('when userConfig is undefined or null', () => {
    it('should return provider defaults unchanged when userConfig is undefined', () => {
      const result = mergeQuickActionsConfig(mockDefaults, undefined);

      expect(result).toEqual(mockDefaults);
      expect(result).not.toBe(mockDefaults); // Should be a copy
    });

    it('should return provider defaults unchanged when userConfig is empty object', () => {
      const result = mergeQuickActionsConfig(mockDefaults, {});

      expect(result).toEqual(mockDefaults);
      expect(result).not.toBe(mockDefaults); // Should be a copy
    });
  });

  describe('when userConfig removes actions', () => {
    it('should remove actions when config is false', () => {
      const userConfig = {
        'ly.img.improve': false,
        'ly.img.fix': false
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect('ly.img.improve' in result).toBe(false);
      expect('ly.img.fix' in result).toBe(false);
      expect('ly.img.shorter' in result).toBe(true);
      expect('ly.img.longer' in result).toBe(true);
      expect(result['ly.img.shorter']).toEqual({});
      expect(result['ly.img.longer']).toBe(true);
    });

    it('should remove actions when config is null', () => {
      const userConfig = {
        'ly.img.improve': null,
        'ly.img.changeTone': null
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect('ly.img.improve' in result).toBe(false);
      expect('ly.img.changeTone' in result).toBe(false);
      expect('ly.img.fix' in result).toBe(true);
      expect('ly.img.shorter' in result).toBe(true);
    });

    it('should remove actions when config is undefined', () => {
      const userConfig = {
        'ly.img.translate': undefined,
        'ly.img.changeTextTo': undefined
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect('ly.img.translate' in result).toBe(false);
      expect('ly.img.changeTextTo' in result).toBe(false);
      expect('ly.img.improve' in result).toBe(true);
      expect('ly.img.fix' in result).toBe(true);
    });

    it('should handle mixed removal values', () => {
      const userConfig = {
        'ly.img.improve': false,
        'ly.img.fix': null,
        'ly.img.shorter': undefined
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect('ly.img.improve' in result).toBe(false);
      expect('ly.img.fix' in result).toBe(false);
      expect('ly.img.shorter' in result).toBe(false);
      expect('ly.img.longer' in result).toBe(true);
      expect('ly.img.changeTone' in result).toBe(true);
    });
  });

  describe('when userConfig keeps defaults', () => {
    it('should keep provider defaults when config is true', () => {
      const userConfig = {
        'ly.img.improve': true,
        'ly.img.fix': true
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect(result['ly.img.improve']).toBe(true);
      expect(result['ly.img.fix']).toEqual({ mapInput: expect.any(Function) });
      expect(result['ly.img.fix']).toBe(mockDefaults['ly.img.fix']); // Should be same reference
    });
  });

  describe('when userConfig overrides actions', () => {
    it('should override with custom mapInput function', () => {
      const customMapInput = (input: any) => ({ ...input, custom: true });
      const userConfig = {
        'ly.img.improve': { mapInput: customMapInput }
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect(result['ly.img.improve']).toEqual({ mapInput: customMapInput });
      expect(result['ly.img.improve']).not.toBe(mockDefaults['ly.img.improve']);
    });

    it('should override with custom properties', () => {
      const userConfig = {
        'ly.img.changeTone': {
          mapInput: (input: any) => ({ ...input, tone: 'casual' }),
          customProp: 'customValue'
        }
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect(result['ly.img.changeTone']).toEqual({
        mapInput: expect.any(Function),
        customProp: 'customValue'
      });
      expect(result['ly.img.changeTone']).not.toBe(
        mockDefaults['ly.img.changeTone']
      );
    });

    it('should override empty object configs', () => {
      const userConfig = {
        'ly.img.shorter': {
          mapInput: (input: any) => ({ ...input, length: 'short' })
        }
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect(result['ly.img.shorter']).toEqual({
        mapInput: expect.any(Function)
      });
      expect(result['ly.img.shorter']).not.toBe(mockDefaults['ly.img.shorter']);
    });
  });

  describe('when userConfig adds new actions', () => {
    it('should add completely new actions', () => {
      const userConfig = {
        'ly.img.customAction': {
          mapInput: (input: any) => ({ custom: input })
        },
        'ly.img.anotherAction': true
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      expect((result as any)['ly.img.customAction']).toEqual({
        mapInput: expect.any(Function)
      });
      expect((result as any)['ly.img.anotherAction']).toBe(true);

      // Original actions should still be present
      expect(result['ly.img.improve']).toBe(true);
      expect(result['ly.img.fix']).toEqual(mockDefaults['ly.img.fix']);
    });
  });

  describe('complex scenarios', () => {
    it('should handle mixed operations (remove, keep, override, add)', () => {
      const userConfig = {
        // Remove
        'ly.img.improve': false,
        'ly.img.translate': null,

        // Keep (explicit)
        'ly.img.fix': true,

        // Override
        'ly.img.changeTone': {
          mapInput: (input: any) => ({ ...input, tone: 'professional' })
        },
        'ly.img.shorter': { customConfig: 'value' },

        // Add new
        'ly.img.newAction': { mapInput: (input: any) => input },
        'ly.img.simpleAction': true
      };

      const result = mergeQuickActionsConfig(mockDefaults, userConfig);

      // Removed actions
      expect(result).not.toHaveProperty('ly.img.improve');
      expect(result).not.toHaveProperty('ly.img.translate');

      // Kept actions (should be original references)
      expect(result['ly.img.fix']).toBe(mockDefaults['ly.img.fix']);
      expect(result['ly.img.longer']).toBe(mockDefaults['ly.img.longer']);
      expect(result['ly.img.changeTextTo']).toBe(
        mockDefaults['ly.img.changeTextTo']
      );

      // Overridden actions
      expect(result['ly.img.changeTone']).toEqual({
        mapInput: expect.any(Function)
      });
      expect(result['ly.img.changeTone']).not.toBe(
        mockDefaults['ly.img.changeTone']
      );

      expect(result['ly.img.shorter']).toEqual({ customConfig: 'value' });
      expect(result['ly.img.shorter']).not.toBe(mockDefaults['ly.img.shorter']);

      // New actions
      expect((result as any)['ly.img.newAction']).toEqual({
        mapInput: expect.any(Function)
      });
      expect((result as any)['ly.img.simpleAction']).toBe(true);
    });

    it('should work with empty provider defaults', () => {
      const emptyDefaults = {};
      const userConfig = {
        'ly.img.newAction': { mapInput: (input: any) => input },
        'ly.img.removeThis': false, // Should have no effect
        'ly.img.keepThis': true
      };

      const result = mergeQuickActionsConfig(emptyDefaults, userConfig);

      expect(result).toEqual({
        'ly.img.newAction': { mapInput: expect.any(Function) },
        'ly.img.keepThis': true
      });
      expect(result).not.toHaveProperty('ly.img.removeThis');
    });

    it('should preserve function references and objects correctly', () => {
      const mapInputFn = (input: any) => input;
      const configObj = { prop: 'value' };

      const defaults = {
        action1: mapInputFn,
        action2: configObj
      };

      const userConfig = {
        action1: true, // Keep original
        action3: configObj // Add same object
      };

      const result = mergeQuickActionsConfig(defaults, userConfig);

      expect((result as any).action1).toBe(mapInputFn); // Same reference
      expect((result as any).action2).toBe(configObj); // Same reference
      expect((result as any).action3).toBe(configObj); // Same reference
    });
  });

  describe('edge cases', () => {
    it('should handle actions with special characters in names', () => {
      const defaults = {
        'ly.img.action-with-dashes': true,
        'ly.img.action_with_underscores': {},
        'ly.img.action@special#chars': { test: true }
      };

      const userConfig = {
        'ly.img.action-with-dashes': false,
        'ly.img.action_with_underscores': { updated: true }
      };

      const result = mergeQuickActionsConfig(defaults, userConfig);

      expect(result).not.toHaveProperty('ly.img.action-with-dashes');
      expect(result['ly.img.action_with_underscores']).toEqual({
        updated: true
      });
      expect(result['ly.img.action@special#chars']).toBe(
        defaults['ly.img.action@special#chars']
      );
    });

    it('should handle numeric and boolean values in config objects', () => {
      const userConfig = {
        'ly.img.action1': {
          enabled: true,
          priority: 1,
          weight: 0.5,
          metadata: null
        },
        'ly.img.action2': {
          mapInput: (input: any) => input,
          count: 0,
          active: false
        }
      };

      const result = mergeQuickActionsConfig({}, userConfig);

      expect((result as any)['ly.img.action1']).toEqual({
        enabled: true,
        priority: 1,
        weight: 0.5,
        metadata: null
      });

      expect((result as any)['ly.img.action2']).toEqual({
        mapInput: expect.any(Function),
        count: 0,
        active: false
      });
    });

    it('should not mutate input parameters', () => {
      const originalDefaults = { action1: true, action2: {} };
      const originalUserConfig = { action1: false, action3: true };

      const defaultsCopy = { ...originalDefaults };
      const userConfigCopy = { ...originalUserConfig };

      mergeQuickActionsConfig(originalDefaults, originalUserConfig);

      expect(originalDefaults).toEqual(defaultsCopy);
      expect(originalUserConfig).toEqual(userConfigCopy);
    });
  });

  describe('type safety', () => {
    it('should work with different input types', () => {
      interface CustomQuickAction {
        mapInput?: (input: any) => any;
        priority?: number;
        enabled?: boolean;
      }

      const typedDefaults: Record<string, CustomQuickAction> = {
        action1: { mapInput: (x) => x, priority: 1 },
        action2: { enabled: true }
      };

      const typedUserConfig = {
        action1: { priority: 2 },
        action2: false as const,
        action3: { enabled: false, mapInput: (x: any) => x }
      };

      const result = mergeQuickActionsConfig(typedDefaults, typedUserConfig);

      expect((result as any).action1).toEqual({ priority: 2 });
      expect('action2' in result).toBe(false);
      expect((result as any).action3).toEqual({
        enabled: false,
        mapInput: expect.any(Function)
      });
    });
  });
});
