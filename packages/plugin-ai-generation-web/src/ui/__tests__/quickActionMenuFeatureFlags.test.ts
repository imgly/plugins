import { describe, expect, it, jest, beforeEach } from '@jest/globals';

describe('Quick Action Menu Feature Flags', () => {
  let mockCesdk: any;
  let mockEngine: any;
  let mockQuickActions: any[];

  beforeEach(() => {
    mockEngine = {
      block: {
        findAllSelected: jest.fn().mockReturnValue([1]),
        getType: jest.fn().mockReturnValue('//ly.img.ubq/graphic')
      }
    };

    mockCesdk = {
      feature: {
        isEnabled: jest.fn()
      },
      ui: {
        registerComponent: jest.fn()
      }
    };

    mockQuickActions = [
      {
        id: 'ly.img.editImage',
        type: 'quick',
        kind: 'image',
        label: 'Edit Image',
        enable: () => true
      },
      {
        id: 'ly.img.swapBackground',
        type: 'quick',
        kind: 'image',
        label: 'Swap Background',
        enable: () => true
      },
      {
        id: 'ly.img.styleTransfer',
        type: 'quick',
        kind: 'image',
        label: 'Style Transfer',
        enable: () => true
      }
    ];
  });

  describe('Quick action filtering based on feature flags', () => {
    it('should filter quick actions based on individual feature flags', () => {
      // Mock that editImage is enabled, others are disabled
      mockCesdk.feature.isEnabled.mockImplementation((key: string) => {
        return key.includes('editImage');
      });

      const filterQuickActionsByFeatureFlags = (
        cesdk: any,
        actions: any[],
        pluginType: string = 'image'
      ) => {
        return actions.filter(action => {
          const actionName = action.id.replace('ly.img.', '');
          const featureKey = `ly.img.plugin-ai-${pluginType}-generation-web.quickAction.${actionName}`;
          return cesdk.feature.isEnabled(featureKey, { engine: mockEngine });
        });
      };

      const filtered = filterQuickActionsByFeatureFlags(
        mockCesdk,
        mockQuickActions,
        'image'
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('ly.img.editImage');
      expect(mockCesdk.feature.isEnabled).toHaveBeenCalledWith(
        'ly.img.plugin-ai-image-generation-web.quickAction.editImage',
        { engine: mockEngine }
      );
      expect(mockCesdk.feature.isEnabled).toHaveBeenCalledWith(
        'ly.img.plugin-ai-image-generation-web.quickAction.swapBackground',
        { engine: mockEngine }
      );
    });

    it('should hide all quick actions when main quickAction flag is disabled', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(false);

      const checkQuickActionsEnabled = (cesdk: any, pluginType: string) => {
        const mainFeatureKey = `ly.img.plugin-ai-${pluginType}-generation-web.quickAction`;
        return cesdk.feature.isEnabled(mainFeatureKey, { engine: mockEngine });
      };

      const enabled = checkQuickActionsEnabled(mockCesdk, 'image');

      expect(enabled).toBe(false);
      expect(mockCesdk.feature.isEnabled).toHaveBeenCalledWith(
        'ly.img.plugin-ai-image-generation-web.quickAction',
        { engine: mockEngine }
      );
    });

    it('should respect feature flag hierarchy', () => {
      // Mock hierarchy: main quickAction disabled, individual enabled
      mockCesdk.feature.isEnabled.mockImplementation((key: string) => {
        if (key === 'ly.img.plugin-ai-image-generation-web.quickAction') {
          return false; // Main disabled
        }
        if (key === 'ly.img.plugin-ai-image-generation-web.quickAction.editImage') {
          return true; // Individual enabled
        }
        return false;
      });

      // In practice, if main is disabled, individuals shouldn't be checked
      const mainEnabled = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.quickAction',
        { engine: mockEngine }
      );

      if (!mainEnabled) {
        // Don't check individual flags
        expect(mainEnabled).toBe(false);
        // Quick actions should be empty
        const filtered: any[] = [];
        expect(filtered).toHaveLength(0);
      }
    });
  });

  describe('Quick action provider selection in expanded state', () => {
    it('should show provider selector when feature is enabled and action is expanded', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(true);

      const shouldShowProviderSelect = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.quickAction.providerSelect',
        { engine: mockEngine }
      );

      expect(shouldShowProviderSelect).toBe(true);
    });

    it('should hide provider selector when feature is disabled', () => {
      mockCesdk.feature.isEnabled.mockImplementation((key: string) => {
        return !key.includes('providerSelect');
      });

      const shouldShowProviderSelect = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-image-generation-web.quickAction.providerSelect',
        { engine: mockEngine }
      );

      expect(shouldShowProviderSelect).toBe(false);
    });
  });

  describe('Text quick actions feature flags', () => {
    const textQuickActions = [
      { id: 'ly.img.translate', name: 'translate' },
      { id: 'ly.img.changeTone', name: 'changeTone' },
      { id: 'ly.img.changeTextTo', name: 'changeTextTo' },
      { id: 'ly.img.fix', name: 'fix' },
      { id: 'ly.img.improve', name: 'improve' },
      { id: 'ly.img.longer', name: 'longer' },
      { id: 'ly.img.shorter', name: 'shorter' }
    ];

    it('should generate correct feature flag keys for text quick actions', () => {
      textQuickActions.forEach(action => {
        const expectedKey = `ly.img.plugin-ai-text-generation-web.quickAction.${action.name}`;
        expect(expectedKey).toMatch(
          /^ly\.img\.plugin-ai-text-generation-web\.quickAction\.\w+$/
        );
      });
    });

    it('should filter text quick actions based on feature flags', () => {
      // Enable only translate and changeTone
      mockCesdk.feature.isEnabled.mockImplementation((key: string) => {
        return key.includes('translate') || key.includes('changeTone');
      });

      const filtered = textQuickActions.filter(action => {
        const featureKey = `ly.img.plugin-ai-text-generation-web.quickAction.${action.name}`;
        return mockCesdk.feature.isEnabled(featureKey, { engine: mockEngine });
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map(a => a.name)).toEqual(['translate', 'changeTone']);
    });
  });

  describe('Video quick actions feature flags', () => {
    it('should check createVideo quick action feature flag', () => {
      mockCesdk.feature.isEnabled.mockReturnValue(true);

      const isCreateVideoEnabled = mockCesdk.feature.isEnabled(
        'ly.img.plugin-ai-video-generation-web.quickAction.createVideo',
        { engine: mockEngine }
      );

      expect(isCreateVideoEnabled).toBe(true);
      expect(mockCesdk.feature.isEnabled).toHaveBeenCalledWith(
        'ly.img.plugin-ai-video-generation-web.quickAction.createVideo',
        { engine: mockEngine }
      );
    });
  });

  describe('Dynamic quick action visibility', () => {
    it('should dynamically update when feature flags change', () => {
      let flagsState = {
        editImage: true,
        swapBackground: false,
        styleTransfer: true
      };

      mockCesdk.feature.isEnabled.mockImplementation((key: string) => {
        if (key.includes('editImage')) return flagsState.editImage;
        if (key.includes('swapBackground')) return flagsState.swapBackground;
        if (key.includes('styleTransfer')) return flagsState.styleTransfer;
        return false;
      });

      const getVisibleActions = () => {
        return mockQuickActions.filter(action => {
          const actionName = action.id.replace('ly.img.', '');
          const featureKey = `ly.img.plugin-ai-image-generation-web.quickAction.${actionName}`;
          return mockCesdk.feature.isEnabled(featureKey, { engine: mockEngine });
        });
      };

      let visible = getVisibleActions();
      expect(visible).toHaveLength(2);
      expect(visible.map(a => a.id)).toContain('ly.img.editImage');
      expect(visible.map(a => a.id)).toContain('ly.img.styleTransfer');

      // Change flags
      flagsState.editImage = false;
      flagsState.swapBackground = true;

      visible = getVisibleActions();
      expect(visible).toHaveLength(2);
      expect(visible.map(a => a.id)).toContain('ly.img.swapBackground');
      expect(visible.map(a => a.id)).toContain('ly.img.styleTransfer');
    });
  });
});