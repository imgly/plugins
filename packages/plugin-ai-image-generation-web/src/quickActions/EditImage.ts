import { enableQuickActionForImageFill, QuickActionDefinition } from '@imgly/plugin-ai-generation-web';
import { getImageUri } from '@imgly/plugin-utils';

import { GetQuickActionDefinition } from './types';

export type ChangeImageInput = {
  prompt: string;
  uri: string;
}

const getChangeImageQuickAction: GetQuickActionDefinition = () => {
  const quickAction: QuickActionDefinition<ChangeImageInput> = {
    id: 'changeImage',
    type: 'quick',
    kind: 'image',

    label: 'Edit Image...',
    description: 'Change image based on description',
    enable: enableQuickActionForImageFill(),
    scopes: ['fill/change'],

    render: ({
      builder,
      experimental,
      isExpanded,
      toggleExpand,
      generate,
      engine,
      state,
      close
    }) => {
      if (isExpanded) {
        const promptState = state('changeImage.prompt', '');

        builder.TextArea('changeImage.textarea', {
          inputLabel: 'Change image...',
          placeholder: 'Describe what you want to change...',
          ...promptState
        });

        builder.Separator('changeImage.separator');

        experimental.builder.ButtonRow('changeImage.footer', {
          justifyContent: 'space-between',
          children: () => {
            builder.Button('changeImage.footer.cancel', {
              label: 'Back',
              icon: '@imgly/ChevronLeft',
              onClick: toggleExpand
            });

            builder.Button('changeImage.footer.apply', {
              label: 'Change',
              icon: '@imgly/MagicWand',
              color: 'accent',
              isDisabled: promptState.value.length === 0,
              onClick: async () => {
                try {
                  const prompt = promptState.value;
                  if (!prompt) return;

                  const [blockId] = engine.block.findAllSelected();
                  const uri = await getImageUri(blockId, engine, {
                    throwErrorIfSvg: true
                  });

                  await generate({
                    prompt,
                    uri
                  });

                  toggleExpand();
                  close();
                } catch (error) {
                  console.error('Generation error:', error);
                }
              }
            });
          }
        });
      } else {
        builder.Button('changeImage.button', {
          label: 'Edit Image...',
          icon: '@imgly/Sparkle',
          labelAlignment: 'left',
          variant: 'plain',
          onClick: toggleExpand
        });
      }
    }
  };
  return quickAction;
};

export default getChangeImageQuickAction;
