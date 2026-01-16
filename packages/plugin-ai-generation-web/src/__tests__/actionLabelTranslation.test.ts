import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import {
  ActionRegistry,
  PluginActionDefinition,
  BaseActionDefinition
} from '../core/ActionRegistry';

/**
 * Test case for the bug: AI Plugin Actions cannot be translated into German
 *
 * The issue is that action labels are set as static strings during plugin
 * initialization, rather than using translation keys that can be dynamically
 * resolved based on the current language.
 *
 * Expected behavior: Actions should store a `labelKey` that can be used
 * to look up the translated label dynamically.
 */
describe('Action Label Translation', () => {
  let registry: ActionRegistry;

  beforeEach(() => {
    // Reset global singleton instance for each test
    const globalObj = (
      typeof window !== 'undefined' ? window : globalThis
    ) as any;
    delete globalObj.__imgly_action_registry__;
    registry = ActionRegistry.get();
  });

  it('should export BaseActionDefinition with labelKey property', () => {
    // This test verifies that the BaseActionDefinition type is exported
    // and includes the labelKey property for i18n support
    const baseAction: BaseActionDefinition = {
      id: 'test-action',
      label: 'Test Label',
      labelKey: 'test.action.label'
    };

    expect(baseAction.labelKey).toBe('test.action.label');
  });

  it('should support labelKey for translation-aware labels', () => {
    // This test documents the expected behavior for translatable action labels
    const ACTION_LABEL_KEY =
      '@imgly/plugin-ai-image-generation-web.action.label';

    const action: PluginActionDefinition = {
      type: 'plugin',
      id: '@imgly/plugin-ai-image-generation-web',
      pluginId: '@imgly/plugin-ai-image-generation-web',
      // label is the English fallback
      label: 'Generate Image',
      // labelKey is the translation key that should be used for i18n
      labelKey: ACTION_LABEL_KEY,
      execute: jest.fn()
    };

    registry.register(action);

    const registeredActions = registry.getBy({
      type: 'plugin',
      id: '@imgly/plugin-ai-image-generation-web'
    });

    expect(registeredActions).toHaveLength(1);
    expect(registeredActions[0].labelKey).toBe(ACTION_LABEL_KEY);
    expect(registeredActions[0].label).toBe('Generate Image');
  });

  it('should allow consumers to resolve labels using labelKey for i18n', () => {
    // Simulate the translation lookup that consumers should perform
    const mockTranslations: Record<string, Record<string, string>> = {
      en: {
        '@imgly/plugin-ai-image-generation-web.action.label': 'Generate Image',
        '@imgly/plugin-ai-sticker-generation-web.action.label':
          'Generate Sticker'
      }
    };

    // Mock i18n translate function
    const translate = (key: string, lang: string): string => {
      return mockTranslations[lang]?.[key] ?? key;
    };

    const imageAction: PluginActionDefinition = {
      type: 'plugin',
      id: '@imgly/plugin-ai-image-generation-web',
      pluginId: '@imgly/plugin-ai-image-generation-web',
      label: 'Generate Image',
      labelKey: '@imgly/plugin-ai-image-generation-web.action.label',
      execute: jest.fn()
    };

    const stickerAction: PluginActionDefinition = {
      type: 'plugin',
      id: '@imgly/plugin-ai-sticker-generation-web',
      pluginId: '@imgly/plugin-ai-sticker-generation-web',
      label: 'Generate Sticker',
      labelKey: '@imgly/plugin-ai-sticker-generation-web.action.label',
      execute: jest.fn()
    };

    registry.register(imageAction);
    registry.register(stickerAction);

    const actions = registry.getBy({ type: 'plugin' });

    // Test English translations
    actions.forEach((action) => {
      if (action.labelKey) {
        const enLabel = translate(action.labelKey, 'en');
        expect(enLabel).not.toBe(action.labelKey); // Should resolve to actual text
      }
    });

    // Verify labelKey is set correctly for consumer use
    const imageActionResult = actions.find(
      (a) => a.id === '@imgly/plugin-ai-image-generation-web'
    );
    const stickerActionResult = actions.find(
      (a) => a.id === '@imgly/plugin-ai-sticker-generation-web'
    );

    expect(imageActionResult?.labelKey).toBeDefined();
    expect(stickerActionResult?.labelKey).toBeDefined();

    expect(translate(imageActionResult!.labelKey!, 'en')).toBe(
      'Generate Image'
    );
    expect(translate(stickerActionResult!.labelKey!, 'en')).toBe(
      'Generate Sticker'
    );
  });

  it('should work with actions that only have label (backwards compatibility)', () => {
    // Actions without labelKey should still work (backwards compatibility)
    const action: PluginActionDefinition = {
      type: 'plugin',
      id: 'legacy-action',
      pluginId: 'legacy-plugin',
      label: 'Legacy Action',
      // No labelKey - this is the legacy behavior
      execute: jest.fn()
    };

    registry.register(action);

    const registeredActions = registry.getBy({ id: 'legacy-action' });

    expect(registeredActions).toHaveLength(1);
    expect(registeredActions[0].label).toBe('Legacy Action');
    expect(registeredActions[0].labelKey).toBeUndefined();
  });
});
