import {
  enableQuickActionForImageFill,
  QuickActionDefinition
} from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

/**
 * The action name.
 */
const ACTION_NAME = 'artistTransfer';

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
  artist: string;
  uri: string;
};

/**
 * Available artists for artist transfer.
 */
const ARTIST_OPTIONS = [
  {
    id: 'van-gogh',
    label: 'Van Gogh',
    prompt:
      'Render this image in the style of Vincent van Gogh, using expressive brushstrokes and swirling motion.'
  },
  {
    id: 'monet',
    label: 'Monet',
    prompt:
      'Transform this image into the soft, impressionistic style of Claude Monet with natural light and delicate color blending.'
  },
  {
    id: 'picasso',
    label: 'Picasso',
    prompt:
      'Apply a Pablo Picasso cubist style with abstract geometry and fragmented shapes.'
  },
  {
    id: 'dali',
    label: 'Dalí',
    prompt:
      "Make this image resemble Salvador Dalí's surrealist style, with dreamlike distortion and soft shadows."
  },
  {
    id: 'matisse',
    label: 'Matisse',
    prompt:
      "Stylize the image using Henri Matisse's bold colors and simplified, flowing shapes."
  },
  {
    id: 'warhol',
    label: 'Warhol',
    prompt:
      "Convert this image into Andy Warhol's pop art style with flat colors, repetition, and bold outlines."
  },
  {
    id: 'michelangelo',
    label: 'Michelangelo',
    prompt:
      'Render the image in the classical Renaissance style of Michelangelo, with dramatic anatomy and fresco-like detail.'
  },
  {
    id: 'da-vinci',
    label: 'Da Vinci',
    prompt:
      'Make this image look like a Leonardo da Vinci painting, using soft transitions, balanced composition, and natural tones.'
  },
  {
    id: 'rembrandt',
    label: 'Rembrandt',
    prompt:
      "Apply Rembrandt's style with rich contrast, warm tones, and dramatic use of light and shadow."
  },
  {
    id: 'mondrian',
    label: 'Mondrian',
    prompt:
      "Transform the image into Piet Mondrian's abstract geometric style with grids and primary colors."
  },
  {
    id: 'kahlo',
    label: 'Frida Kahlo',
    prompt:
      'Stylize this image in the expressive, symbolic style of Frida Kahlo with vivid colors and surreal framing.'
  },
  {
    id: 'hokusai',
    label: 'Hokusai',
    prompt:
      'Render the image in the style of Hokusai, using bold outlines, flat color, and traditional Japanese woodblock aesthetics.'
  }
];

const ArtistTransfer: GetQuickActionDefinition<InputType> = ({ cesdk }) => {
  cesdk.i18n.setTranslations({
    en: {
      [`${I18N_PREFIX}`]: 'Painted By',
      [`${I18N_PREFIX}.description`]:
        'Transform image in the style of famous artists'
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
          builder.Section(`${ID}.popover.section`, {
            children: () => {
              experimental.builder.Menu(`${ID}.popover.menu`, {
                children: () => {
                  ARTIST_OPTIONS.forEach((artist) => {
                    builder.Button(`${ID}.popover.menu.${artist.id}`, {
                      label: artist.label,
                      labelAlignment: 'left',
                      variant: 'plain',
                      onClick: async () => {
                        try {
                          const [blockId] = engine.block.findAllSelected();
                          const uri = await getImageUri(blockId, engine, {
                            throwErrorIfSvg: true
                          });

                          await generate({
                            artist: artist.prompt,
                            uri
                          });

                          close();
                        } catch (error) {
                          // eslint-disable-next-line no-console
                          console.error('Generation error:', error);
                          cesdk.ui.showNotification({
                            type: 'error',
                            message:
                              (error as Error).message ||
                              'Failed to apply artist style. Please try again.',
                            duration: 'medium'
                          });
                        }
                      }
                    });
                  });
                }
              });
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
declare module '../types' {
  interface ImageQuickActionInputs {
    [ID]: InputType;
  }
}

export default ArtistTransfer;
