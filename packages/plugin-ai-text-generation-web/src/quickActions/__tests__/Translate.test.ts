import { describe, expect, it, jest } from '@jest/globals';
import Translate from '../Translate';

describe('Translate Quick Action', () => {
  it('should register feature flag on initialization', () => {
    const mockCesdk = {
      feature: { enable: jest.fn() },
      i18n: { setTranslations: jest.fn() },
      ui: { showNotification: jest.fn() },
      engine: {
        block: {
          findAllSelected: jest.fn().mockReturnValue([1]),
          getString: jest.fn().mockReturnValue('Hello world'),
          getType: jest.fn().mockReturnValue('//ly.img.ubq/text')
        }
      }
    };

    const quickAction = Translate({ cesdk: mockCesdk as any });

    expect(mockCesdk.feature.enable).toHaveBeenCalledWith(
      'ly.img.plugin-ai-text-generation-web.quickAction.translate',
      true
    );
    expect(quickAction.id).toBe('ly.img.translate');
    expect(quickAction.type).toBe('quick');
    expect(quickAction.kind).toBe('text');
  });

  it('should set correct i18n translations for languages', () => {
    const mockCesdk = {
      feature: { enable: jest.fn() },
      i18n: { setTranslations: jest.fn() },
      ui: { showNotification: jest.fn() },
      engine: {
        block: {
          findAllSelected: jest.fn().mockReturnValue([1]),
          getString: jest.fn().mockReturnValue('Hello world'),
          getType: jest.fn().mockReturnValue('//ly.img.ubq/text')
        }
      }
    };

    Translate({ cesdk: mockCesdk as any });

    expect(mockCesdk.i18n.setTranslations).toHaveBeenCalledWith({
      en: expect.objectContaining({
        'ly.img.plugin-ai-text-generation-web.defaults.quickAction.translate': 'Translate',
        'ly.img.plugin-ai-text-generation-web.defaults.quickAction.translate.en_US': 'English (US)',
        'ly.img.plugin-ai-text-generation-web.defaults.quickAction.translate.es': 'Spanish',
        'ly.img.plugin-ai-text-generation-web.defaults.quickAction.translate.fr': 'French',
        'ly.img.plugin-ai-text-generation-web.defaults.quickAction.translate.de': 'German'
      })
    });
  });

  it('should only enable for text blocks', () => {
    const mockCesdk = {
      feature: { enable: jest.fn() },
      i18n: { setTranslations: jest.fn() },
      ui: { showNotification: jest.fn() },
      engine: {
        block: {
          findAllSelected: jest.fn().mockReturnValue([1]),
          getString: jest.fn().mockReturnValue('Hello world'),
          getType: jest.fn().mockReturnValue('//ly.img.ubq/text')
        }
      }
    };

    const quickAction = Translate({ cesdk: mockCesdk as any });
    const enableResult = quickAction.enable({ engine: mockCesdk.engine as any });
    
    expect(enableResult).toBe(true);
    
    // Test with non-text block
    mockCesdk.engine.block.getType.mockReturnValue('//ly.img.ubq/graphic');
    const disableResult = quickAction.enable({ engine: mockCesdk.engine as any });
    
    expect(disableResult).toBe(false);
  });
});