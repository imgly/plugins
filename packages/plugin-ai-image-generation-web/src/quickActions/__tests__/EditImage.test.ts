import { describe, expect, it, jest } from '@jest/globals';
import EditImage from '../EditImage';

describe('EditImage Quick Action', () => {
  it('should register feature flag on initialization', () => {
    const mockCesdk = {
      feature: { enable: jest.fn() },
      i18n: { setTranslations: jest.fn() },
      ui: { showNotification: jest.fn() },
      engine: {
        block: {
          findAllSelected: jest.fn().mockReturnValue([1]),
          getString: jest.fn().mockReturnValue('test'),
          getType: jest.fn().mockReturnValue('//ly.img.ubq/graphic')
        }
      }
    };

    const quickAction = EditImage({ cesdk: mockCesdk as any });

    expect(mockCesdk.feature.enable).toHaveBeenCalledWith(
      'ly.img.plugin-ai-image-generation-web.quickAction.editImage',
      true
    );
    expect(quickAction.id).toBe('ly.img.editImage');
    expect(quickAction.type).toBe('quick');
    expect(quickAction.kind).toBe('image');
  });

  it('should set correct i18n translations', () => {
    const mockCesdk = {
      feature: { enable: jest.fn() },
      i18n: { setTranslations: jest.fn() },
      ui: { showNotification: jest.fn() },
      engine: {
        block: {
          findAllSelected: jest.fn().mockReturnValue([1]),
          getString: jest.fn().mockReturnValue('test'),
          getType: jest.fn().mockReturnValue('//ly.img.ubq/graphic')
        }
      }
    };

    EditImage({ cesdk: mockCesdk as any });

    expect(mockCesdk.i18n.setTranslations).toHaveBeenCalledWith({
      en: expect.objectContaining({
        'ly.img.plugin-ai-image-generation-web.defaults.quickAction.editImage': 'Edit Image...',
        'ly.img.plugin-ai-image-generation-web.defaults.quickAction.editImage.description': 'Change image based on description',
        'ly.img.plugin-ai-image-generation-web.defaults.quickAction.editImage.prompt': 'Edit Image...',
        'ly.img.plugin-ai-image-generation-web.quickAction.editImage.prompt.placeholder': 'e.g. "Add a sunset"',
        'ly.img.plugin-ai-image-generation-web.defaults.quickAction.editImage.apply': 'Change'
      })
    });
  });
});