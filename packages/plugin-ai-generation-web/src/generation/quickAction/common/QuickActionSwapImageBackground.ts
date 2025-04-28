import CreativeEditorSDK from '@cesdk/cesdk-js';
import { ImageOutput, QuickAction, QuickActionContext } from '../../provider';
import { getImageUri } from '@imgly/plugin-utils';
import QuickActionBasePrompt from './QuickActionBasePrompt';
import enableImageFill from './enableImageFill';

function QuickActionChangeImage<I, O extends ImageOutput>(options: {
  id?: string;
  mapInput?: (input: { prompt: string; uri: string; blockId: number }) => I;
  onApply?: (
    options: { prompt: string; uri: string; blockId: number },
    context: QuickActionContext<I, O>
  ) => Promise<O>;
  cesdk: CreativeEditorSDK;
}): QuickAction<I, O> {
  const id = options.id ?? 'swapBackground';

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
      [`ly.img.ai.quickAction.${id}`]: 'Change Background...',
      [`ly.img.ai.quickAction.${id}.prompt.inputLabel`]: 'Change background...',
      [`ly.img.ai.quickAction.${id}.prompt.placeholder`]:
        'Describe the background you want...'
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
      scopes: ['fill/change'],
      enable: enableImageFill()
    },
    onApply: async (userPrompt, context) => {
      const [blockId] = options.cesdk.engine.block.findAllSelected();
      const uri = await getImageUri(blockId, options.cesdk.engine, {
        throwErrorIfSvg: true
      });

      const prompt = `Swap the background to ${userPrompt}`;
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
