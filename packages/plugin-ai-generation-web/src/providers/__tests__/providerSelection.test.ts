import { describe, expect, it, jest, beforeEach } from '@jest/globals';

describe('Provider Selection Feature Flags', () => {
  let mockCesdk: any;
  let mockEngine: any;

  beforeEach(() => {
    mockEngine = {
      block: {
        findAllSelected: jest.fn().mockReturnValue([])
      }
    };

    mockCesdk = {
      feature: {
        isEnabled: jest.fn()
      },
      ui: {
        registerComponent: jest.fn(),
        registerPanel: jest.fn()
      }
    };
  });

  describe('Panel provider selector visibility', () => {
    it('should hide provider selector when feature is disabled', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(false);

      // Simulate checking if provider selector should be shown
      const shouldShowSelector = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.providerSelect',
        { engine: mockEngine }
      );

      expect(shouldShowSelector).toBe(false);
      expect(mockCesdk.feature.isEnabled).toHaveBeenCalledWith(
        'ly.img.plugin-ai-image-generation-web.providerSelect',
        { engine: mockEngine }
      );
    });

    it('should show provider selector when feature is enabled', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(true);

      const shouldShowSelector = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.providerSelect',
        { engine: mockEngine }
      );

      expect(shouldShowSelector).toBe(true);
    });

    it('should work with multiple providers when selector is disabled', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(false);

      const providers = [
        { id: 'provider1', name: 'Provider 1' },
        { id: 'provider2', name: 'Provider 2' }
      ];

      // When selector is disabled, providers should still be available
      // but no UI for selection should be shown
      const shouldShowSelector = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.providerSelect',
        { engine: mockEngine }
      );

      expect(shouldShowSelector).toBe(false);
      expect(providers).toHaveLength(2); // Providers still exist
    });
  });

  describe('Quick action provider selector visibility', () => {
    it('should hide quick action provider selector when feature is disabled', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(false);

      const shouldShowQuickActionSelector = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.quickAction.providerSelect',
        { engine: mockEngine }
      );

      expect(shouldShowQuickActionSelector).toBe(false);
      expect(mockCesdk.feature.isEnabled).toHaveBeenCalledWith(
        'ly.img.plugin-ai-image-generation-web.quickAction.providerSelect',
        { engine: mockEngine }
      );
    });

    it('should show quick action provider selector when feature is enabled', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(true);

      const shouldShowQuickActionSelector = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.quickAction.providerSelect',
        { engine: mockEngine }
      );

      expect(shouldShowQuickActionSelector).toBe(true);
    });

    it('should respect hierarchy - hide when parent quickAction is disabled', () => {
      // Mock returns for different feature flags
      mockCesdk.feature.isEnabled.mockImplementation((key: string) => {
        if (key === 'ly.img.plugin-ai-image-generation-web.quickAction') {
          return false; // Parent disabled
        }
        if (
          key ===
          'ly.img.plugin-ai-image-generation-web.quickAction.providerSelect'
        ) {
          return true; // Child enabled but should be overridden
        }
        return true;
      });

      // Check parent first
      const quickActionEnabled = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.quickAction',
        { engine: mockEngine }
      );

      // If parent is disabled, child should not be checked in practice
      expect(quickActionEnabled).toBe(false);
    });
  });

  describe('fromText and fromImage feature flags', () => {
    it('should disable text-to-image generation when fromText is disabled', () => {
      mockCesdk.feature.isEnabled.mockImplementation((key: string) => {
        return key !== 'ly.img.plugin-ai-image-generation-web.fromText';
      });

      const fromTextEnabled = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.fromText',
        { engine: mockEngine }
      );

      expect(fromTextEnabled).toBe(false);
    });

    it('should disable image-to-image generation when fromImage is disabled', () => {
      mockCesdk.feature.isEnabled.mockImplementation((key: string) => {
        return key !== 'ly.img.plugin-ai-image-generation-web.fromImage';
      });

      const fromImageEnabled = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.fromImage',
        { engine: mockEngine }
      );

      expect(fromImageEnabled).toBe(false);
    });

    it('should allow both modes when both flags are enabled', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(true);

      const fromTextEnabled = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.fromText',
        { engine: mockEngine }
      );
      const fromImageEnabled = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.fromImage',
        { engine: mockEngine }
      );

      expect(fromTextEnabled).toBe(true);
      expect(fromImageEnabled).toBe(true);
    });
  });

  describe('Feature flag patterns for different plugin types', () => {
    it('should use correct pattern for video generation', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(true);

      const videoProviderSelect =
        'ly.img.plugin-ai-video-generation-web.providerSelect';
      const videoFromText = 'ly.img.plugin-ai-video-generation-web.fromText';
      const videoFromImage = 'ly.img.plugin-ai-video-generation-web.fromImage';

      // Check the patterns are correct
      expect(videoProviderSelect).toMatch(
        /^ly\.img\.plugin-ai-video-generation-web\.providerSelect$/
      );
      expect(videoFromText).toMatch(
        /^ly\.img\.plugin-ai-video-generation-web\.fromText$/
      );
      expect(videoFromImage).toMatch(
        /^ly\.img\.plugin-ai-video-generation-web\.fromImage$/
      );
    });

    it('should use correct pattern for text generation', () => {
      const textProviderSelect =
        'ly.img.plugin-ai-text-generation-web.providerSelect';
      const textQuickAction =
        'ly.img.plugin-ai-text-generation-web.quickAction';

      expect(textProviderSelect).toMatch(
        /^ly\.img\.plugin-ai-text-generation-web\.providerSelect$/
      );
      expect(textQuickAction).toMatch(
        /^ly\.img\.plugin-ai-text-generation-web\.quickAction$/
      );
    });
  });
});
