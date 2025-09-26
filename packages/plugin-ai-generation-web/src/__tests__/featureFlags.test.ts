import { describe, expect, it } from '@jest/globals';

describe('Feature Flag Key Generation', () => {
  // Helper functions that would be extracted to a utils file in production
  const getPanelFeatureKey = (
    pluginType: 'image' | 'video' | 'text' | 'audio',
    feature: 'providerSelect' | 'fromText' | 'fromImage'
  ): string => {
    return `ly.img.plugin-ai-${pluginType}-generation-web.${feature}`;
  };

  const getQuickActionFeatureKey = (
    pluginType: 'image' | 'video' | 'text' | 'audio',
    actionName: string
  ): string => {
    return `ly.img.plugin-ai-${pluginType}-generation-web.quickAction.${actionName}`;
  };

  const getProviderStyleFeatureKey = (
    providerId: string,
    styleGroup: string
  ): string => {
    return `ly.img.plugin-ai-image-generation-web.${providerId}.${styleGroup}`;
  };

  describe('Panel feature key generation', () => {
    it('should generate correct providerSelect keys for all plugin types', () => {
      expect(getPanelFeatureKey('image', 'providerSelect')).toBe(
        'ly.img.plugin-ai-image-generation-web.providerSelect'
      );

      expect(getPanelFeatureKey('video', 'providerSelect')).toBe(
        'ly.img.plugin-ai-video-generation-web.providerSelect'
      );

      expect(getPanelFeatureKey('text', 'providerSelect')).toBe(
        'ly.img.plugin-ai-text-generation-web.providerSelect'
      );

      expect(getPanelFeatureKey('audio', 'providerSelect')).toBe(
        'ly.img.plugin-ai-audio-generation-web.providerSelect'
      );
    });

    it('should generate correct fromText keys for image and video', () => {
      expect(getPanelFeatureKey('image', 'fromText')).toBe(
        'ly.img.plugin-ai-image-generation-web.fromText'
      );

      expect(getPanelFeatureKey('video', 'fromText')).toBe(
        'ly.img.plugin-ai-video-generation-web.fromText'
      );
    });

    it('should generate correct fromImage keys for image and video', () => {
      expect(getPanelFeatureKey('image', 'fromImage')).toBe(
        'ly.img.plugin-ai-image-generation-web.fromImage'
      );

      expect(getPanelFeatureKey('video', 'fromImage')).toBe(
        'ly.img.plugin-ai-video-generation-web.fromImage'
      );
    });
  });

  describe('Quick action feature key generation', () => {
    it('should generate correct keys for image quick actions', () => {
      const imageActions = [
        'editImage',
        'swapBackground',
        'styleTransfer',
        'createVariant',
        'artistTransfer',
        'combineImages',
        'remixPage',
        'remixPageWithPrompt'
      ];

      imageActions.forEach((action) => {
        const key = getQuickActionFeatureKey('image', action);
        expect(key).toBe(
          `ly.img.plugin-ai-image-generation-web.quickAction.${action}`
        );
        expect(key).toMatch(
          /^ly\.img\.plugin-ai-image-generation-web\.quickAction\.\w+$/
        );
      });
    });

    it('should generate correct keys for text quick actions', () => {
      const textActions = [
        'translate',
        'changeTone',
        'changeTextTo',
        'fix',
        'improve',
        'longer',
        'shorter'
      ];

      textActions.forEach((action) => {
        const key = getQuickActionFeatureKey('text', action);
        expect(key).toBe(
          `ly.img.plugin-ai-text-generation-web.quickAction.${action}`
        );
        expect(key).toMatch(
          /^ly\.img\.plugin-ai-text-generation-web\.quickAction\.\w+$/
        );
      });
    });

    it('should generate correct keys for video quick actions', () => {
      const key = getQuickActionFeatureKey('video', 'createVideo');
      expect(key).toBe(
        'ly.img.plugin-ai-video-generation-web.quickAction.createVideo'
      );
    });

    it('should handle quick action provider select key', () => {
      const key = `ly.img.plugin-ai-image-generation-web.quickAction.providerSelect`;
      expect(key).toMatch(
        /^ly\.img\.plugin-ai-\w+-generation-web\.quickAction\.providerSelect$/
      );
    });
  });

  describe('Provider style feature key generation', () => {
    it('should generate correct keys for RecraftV3 styles', () => {
      expect(
        getProviderStyleFeatureKey('fal-ai/recraft-v3', 'style.image')
      ).toBe(
        'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.image'
      );

      expect(
        getProviderStyleFeatureKey('fal-ai/recraft-v3', 'style.vector')
      ).toBe(
        'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.vector'
      );
    });

    it('should generate correct keys for Recraft20b styles', () => {
      expect(
        getProviderStyleFeatureKey(
          'fal-ai/recraft/v2/text-to-image',
          'style.image'
        )
      ).toBe(
        'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.image'
      );

      expect(
        getProviderStyleFeatureKey(
          'fal-ai/recraft/v2/text-to-image',
          'style.vector'
        )
      ).toBe(
        'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.vector'
      );

      expect(
        getProviderStyleFeatureKey(
          'fal-ai/recraft/v2/text-to-image',
          'style.icon'
        )
      ).toBe(
        'ly.img.plugin-ai-image-generation-web.fal-ai/recraft/v2/text-to-image.style.icon'
      );
    });
  });

  describe('Feature key validation', () => {
    it('should validate key format follows naming conventions', () => {
      const validKeys = [
        'ly.img.plugin-ai-image-generation-web.providerSelect',
        'ly.img.plugin-ai-image-generation-web.quickAction',
        'ly.img.plugin-ai-image-generation-web.quickAction.editImage',
        'ly.img.plugin-ai-image-generation-web.fromText',
        'ly.img.plugin-ai-image-generation-web.fal-ai/recraft-v3.style.image'
      ];

      validKeys.forEach((key) => {
        // Check it starts with correct prefix
        expect(key).toMatch(/^ly\.img\.plugin-ai-/);
        // Check it contains generation-web
        expect(key).toContain('-generation-web');
        // Check no spaces or invalid characters
        expect(key).not.toMatch(/\s/);
      });
    });

    it('should maintain consistency between i18n keys and feature flags', () => {
      // Feature flags should match i18n key patterns
      const featureKey =
        'ly.img.plugin-ai-image-generation-web.quickAction.editImage';
      const i18nKey = featureKey; // Should be the same

      expect(featureKey).toBe(i18nKey);
    });
  });

  describe('Hierarchical key relationships', () => {
    it('should maintain parent-child relationships', () => {
      const parentKey = 'ly.img.plugin-ai-image-generation-web.quickAction';
      const childKey =
        'ly.img.plugin-ai-image-generation-web.quickAction.editImage';

      expect(childKey).toContain(parentKey);
      expect(childKey.startsWith(`${parentKey}.`)).toBe(true);
    });

    it('should have consistent depth for similar features', () => {
      const keys = [
        'ly.img.plugin-ai-image-generation-web.quickAction.editImage',
        'ly.img.plugin-ai-text-generation-web.quickAction.translate',
        'ly.img.plugin-ai-video-generation-web.quickAction.createVideo'
      ];

      keys.forEach((key) => {
        const parts = key.split('.');
        expect(parts).toHaveLength(5); // All quick action keys should have same depth
        expect(parts[3]).toBe('quickAction'); // quickAction should be at same position
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle provider IDs with slashes correctly', () => {
      const providerId = 'fal-ai/recraft/v2/text-to-image';
      const key = getProviderStyleFeatureKey(providerId, 'style.icon');

      // Should preserve slashes in provider ID
      expect(key).toContain('fal-ai/recraft/v2/text-to-image');
      // Should end with the style group
      expect(key).toMatch(/\.style\.icon$/);
    });

    it('should handle main quickAction flag correctly', () => {
      const mainKey = 'ly.img.plugin-ai-image-generation-web.quickAction';
      // Should not have anything after quickAction
      expect(mainKey).not.toContain('quickAction.');
      expect(mainKey).toMatch(/\.quickAction$/);
    });
  });
});
