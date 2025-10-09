import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { RenderCustomProperty } from '../../core/provider';

/**
 * Provides render function for a image url property that allows
 * to select an image from the library with a MediaPreview
 *
 * By default this expects the property key to be `image_url`. This can be changed in the options.
 */
function renderImageUrlProperty(
  provderId: string,
  options: {
    cesdk: CreativeEditorSDK;
    propertyKey?: string;
    defaultUrl?: string;
  }
): RenderCustomProperty {
  const { cesdk } = options;
  const propertyKey = options.propertyKey ?? 'image_url';
  const panelIdForImageSelection = getImageSelectionPanelId(provderId);

  cesdk.i18n.setTranslations({
    en: {
      [`panel.${panelIdForImageSelection}`]: 'Select Image To Change',
      'ly.img.ai.imageSelection.selectImage.label': 'Select Image',
      'ly.img.ai.imageSelection.error.svg':
        'SVG images are not supported. Please choose a different image.',
      'ly.img.ai.imageSelection.error.invalidType':
        "Only images are supported. Found '{mimeType}'. Please choose a different image."
    }
  });

  createPanels(provderId, cesdk);

  const customProperties: RenderCustomProperty = {
    [propertyKey]: (context, property) => {
      const {
        builder,
        experimental: { global },
        payload
      } = context;

      // Check for provider configuration defaults
      let configuredDefault: string | undefined;
      const providerConfig = (context as any).providerConfig;
      const pluginConfig = (context as any).config;

      // Check provider config first, then plugin config
      const propertyConfig =
        providerConfig?.properties?.[property.id] ??
        (pluginConfig as any)?.properties?.[property.id];

      if (propertyConfig?.default) {
        if (typeof propertyConfig.default === 'function') {
          // If it's a function, call it with a basic context
          configuredDefault = propertyConfig.default({}) as string;
        } else {
          configuredDefault = propertyConfig.default as string;
        }
      }

      // Use configured default, then payload url, then static default
      const defaultUrl =
        configuredDefault ?? payload?.url ?? options.defaultUrl;
      const stateValue = global<string>(
        `${provderId}.${property.id}`,
        defaultUrl
      );

      builder.MediaPreview(property.id, {
        preview: {
          type: 'image',
          uri: stateValue.value
        },
        action: {
          label: 'ly.img.ai.imageSelection.selectImage.label',
          onClick: () => {
            if (cesdk == null) return;

            cesdk.ui.openPanel(panelIdForImageSelection, {
              payload: {
                onSelect: (assetResult: AssetResult) => {
                  if (assetResult.meta?.uri != null) {
                    stateValue.setValue(assetResult.meta?.uri);
                  }
                }
              }
            });
          }
        }
      });

      return () => {
        return {
          id: property.id,
          type: 'string',
          value: stateValue.value
        };
      };
    }
  };

  return customProperties;
}

function createPanels(providerId: string, cesdk?: CreativeEditorSDK) {
  if (cesdk == null) return;

  cesdk.ui.registerPanel<{
    onSelect: (assetResult: AssetResult) => void;
  }>(getImageSelectionPanelId(providerId), ({ builder, payload }) => {
    builder.Library(`${providerId}.library.image`, {
      entries: ['ly.img.image'],
      onSelect: async (asset) => {
        const uri = asset?.meta?.uri;
        if (uri == null) return;

        const mimeType = await cesdk.engine.editor.getMimeType(uri);
        if (mimeType === 'image/svg+xml') {
          cesdk.ui.showNotification({
            type: 'warning',
            message: 'ly.img.ai.imageSelection.error.svg'
          });
        } else if (mimeType.startsWith('image/')) {
          payload?.onSelect(asset);
          cesdk?.ui.closePanel(getImageSelectionPanelId(providerId));
        } else {
          cesdk.ui.showNotification({
            type: 'warning',
            message: `ly.img.ai.imageSelection.error.invalidType`
          });
        }
      }
    });
  });
}

function getImageSelectionPanelId(providerId: string) {
  return `ly.img.ai.${providerId}.imageSelection`;
}

export default renderImageUrlProperty;
