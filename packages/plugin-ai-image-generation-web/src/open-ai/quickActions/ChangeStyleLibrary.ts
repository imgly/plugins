import {
  enableQuickActionForImageFill,
  QuickActionDefinition
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import {
  createStyleAssetSource,
  addStyleAssetSource,
  STYLE_PROMPTS
} from '../GptImage1.constants';

/**
 * The action name.
 */
const ACTION_NAME = 'gpt-image-1.changeStyleLibrary';

/**
 * The ID of the quick action.
 */
export const ID = `ly.img.${ACTION_NAME}`;

/**
 * The i18n prefix for the quick action.
 */
export const I18N_PREFIX = `ly.img.plugin-ai-image-generation-web.quickAction.${ACTION_NAME}`;

/**
 * The input generated from this quick action which needs
 * to be mapped to the specific provider.
 */
export type InputType = {
  prompt: string;
  uri: string;
};

/**
 * Function to create the ChangeStyleLibrary quick action.
 */
const ChangeStyleLibrary = (context: {
  cesdk: CreativeEditorSDK;
  modelKey: string;
  baseURL?: string;
}): QuickActionDefinition<InputType> => {
  const { cesdk, modelKey, baseURL } = context;

  // Setup asset source for styles
  const styleAssetSourceId = `${modelKey}/styles`;
  const defaultBaseURL =
    'https://cdn.img.ly/assets/plugins/plugin-ai-image-generation-web/v1/gpt-image-1/';
  const styleAssetSource = createStyleAssetSource(styleAssetSourceId, {
    baseURL: baseURL ?? defaultBaseURL
  });
  addStyleAssetSource(styleAssetSource, { cesdk });

  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}`]: 'Change Style',
      [`${I18N_PREFIX}.description`]: 'Apply different art styles to your image'
    }
  });

  const quickAction: QuickActionDefinition<InputType> = {
    id: ID,
    type: 'quick',
    kind: 'image',

    label: `${I18N_PREFIX}`,
    enable: enableQuickActionForImageFill(),
    scopes: ['fill/change'],

    render: ({ builder, experimental, generate, engine, close }) => {
      experimental.builder.Popover(`${ID}.popover`, {
        label: `${I18N_PREFIX}`,
        icon: '@imgly/Appearance',
        labelAlignment: 'left',
        variant: 'plain',
        trailingIcon: '@imgly/ChevronRight',
        placement: 'right',
        children: () => {
          builder.Library(`${ID}.popover.library`, {
            entries: [`${modelKey}/styles`],
            onSelect: async (assetResult) => {
              try {
                const [blockId] = engine.block.findAllSelected();
                const uri = await getImageUri(blockId, engine, {
                  throwErrorIfSvg: true
                });

                const styleId = assetResult.id;
                const stylePrompt = STYLE_PROMPTS[styleId];
                if (stylePrompt == null) {
                  throw new Error(`Style not found: ${styleId}`);
                }

                await generate({
                  prompt: stylePrompt,
                  uri
                });

                close();
              } catch (error) {
                // eslint-disable-next-line no-console
                console.error('Generation error:', error);
              }
            }
          });
        }
      });
    }
  };
  return quickAction;
};

/**
 * Extend ImageQuickActionInputs with this action's input type.
 * This will ensure that the types are correctly recognized
 * in the ImageProvider.
 *
 * COPY this file to other quick action to support type safety
 */
declare module '../../types' {
  interface ImageQuickActionInputs {
    [ID]: InputType;
  }
}

export default ChangeStyleLibrary;
