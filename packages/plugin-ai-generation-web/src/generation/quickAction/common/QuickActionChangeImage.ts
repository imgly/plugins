import CreativeEditorSDK from '@cesdk/cesdk-js';
import { ImageOutput, QuickAction, QuickActionContext } from '../../provider';
import QuickActionBasePrompt from './QuickActionBasePrompt';
import enableImageFill from './enableImageFill';
import { getImageUri } from '@imgly/plugin-utils';

function QuickActionChangeImage<I, O extends ImageOutput>(options: {
  id?: string;
  cesdk: CreativeEditorSDK;
  mapInput?: (input: { prompt: string; uri: string; blockId: number }) => I;
  onApply?: (
    options: { prompt: string; uri: string; blockId: number },
    context: QuickActionContext<I, O>
  ) => Promise<O>;
}): QuickAction<I, O> {
  const id = options.id ?? 'changeImage';

  if (options.mapInput == null && options.onApply == null) {
    throw new Error(
      `QuickAction '${id}': Either mapInput or onApply must be provided to QuickActionChangeImage`
    );
  }

  if (options.mapInput != null && options.onApply != null) {
    throw new Error(
      `QuickAction '${id}': Only one of mapInput or onApply can be provided to QuickActionChangeImage, not both`
    );
  }

  options.cesdk.i18n.setTranslations({
    en: {
      [`ly.img.ai.quickAction.${id}.apply`]: 'Change',
      [`ly.img.ai.quickAction.${id}`]: 'Edit Image...',
      [`ly.img.ai.quickAction.${id}.prompt.inputLabel`]: 'Change image...',
      [`ly.img.ai.quickAction.${id}.prompt.placeholder`]:
        'Describe what you want to change...'
    }
  });

  return QuickActionBasePrompt<I, O>({
    buttonOptions: {
      icon: '@imgly/plugin-ai-generation/image'
    },
    quickAction: {
      id,
      version: '1',
      confirmation: true,
      lockDuringConfirmation: false,
      scopes: ['fill/change'],
      enable: enableImageFill()
    },
    onApply: async (prompt, context) => {
      const [blockId] = options.cesdk.engine.block.findAllSelected();
      const uri = await getImageUri(blockId, options.cesdk.engine, {
        throwErrorIfSvg: true
      });

      if (options.mapInput) {
        const input = options.mapInput({ prompt, uri, blockId });
        return context.generate(input);
      } else if (options.onApply) {
        return options.onApply(
          {
            prompt,
            uri,
            blockId
          },
          context
        );
      } else {
        throw new Error('Please provide either mapInput or onApply');
      }
    }
  });
}

export default QuickActionChangeImage;
