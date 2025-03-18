import CreativeEditorSDK, { AssetResult } from '@cesdk/cesdk-js';
import { type RenderCustomProperty } from '@imgly/plugin-utils-ai-generation';

function renderCustomProperties(
  provderId: string,
  cesdk: CreativeEditorSDK
): RenderCustomProperty {
  createPanels(provderId, cesdk);

  const customProperties: RenderCustomProperty = {
    image_url: (context, property) => {
      const {
        builder,
        experimental: { global },
        payload
      } = context;
      const defaultUrl =
        payload?.url ??
        'https://fal.media/files/elephant/8kkhB12hEZI2kkbU8pZPA_test.jpeg';

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

export default renderCustomProperties;
