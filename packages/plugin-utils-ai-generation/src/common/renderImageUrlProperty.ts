import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { RenderCustomProperty } from '../generation/provider';

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

  createPanels(provderId, cesdk);

  const customProperties: RenderCustomProperty = {
    [propertyKey]: (context, property) => {
      const {
        builder,
        experimental: { global },
        payload
      } = context;
      const defaultUrl = payload?.url ?? options.defaultUrl;
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
          label: 'Select Image',
          onClick: () => {
            cesdk?.ui.openPanel(`${provderId}.imageSelection`, {
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
  }>(`${providerId}.imageSelection`, ({ builder, payload }) => {
    builder.Library(`${providerId}.library.image`, {
      entries: ['ly.img.image'],
      onSelect: async (asset) => {
        payload?.onSelect(asset);
        cesdk?.ui.closePanel(`${providerId}.imageSelection`);
      }
    });
  });
}

export default renderImageUrlProperty;
