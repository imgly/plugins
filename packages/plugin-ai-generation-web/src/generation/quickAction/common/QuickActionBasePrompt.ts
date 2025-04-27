import { ButtonOptions, TextAreaOptions } from '@cesdk/cesdk-js';
import { Output, QuickAction, QuickActionContext } from '../../provider';

/**
 * Quick action base for quick actions that require a prompt.
 * Will render a text area for the prompt.
 */
function QuickActionBasePrompt<I, O extends Output>(options: {
  buttonOptions?: ButtonOptions;
  textAreaOptions?: TextAreaOptions;
  quickAction: Omit<QuickAction<I, O>, 'render' | 'renderExpanded'>;
  onApply: (prompt: string, context: QuickActionContext<I, O>) => Promise<O>;
}): QuickAction<I, O> {
  const id = options.quickAction.id;
  return {
    ...options.quickAction,
    render: ({ builder }, { toggleExpand }) => {
      builder.Button(`${id}.button`, {
        label: `ly.img.ai.quickAction.${id}`,
        icon: '@imgly/Sparkle',
        labelAlignment: 'left',
        variant: 'plain',
        ...options.buttonOptions,
        onClick: toggleExpand
      });
    },
    renderExpanded: ({ builder, state, experimental }, context) => {
      const promptState = state(`${id}.prompt`, '');

      builder.TextArea(`${id}.textarea`, {
        inputLabel: `ly.img.ai.quickAction.${id}.prompt.inputLabel`,
        placeholder: `ly.img.ai.quickAction.${id}.prompt.placeholder`,
        ...options.textAreaOptions,
        ...promptState
      });

      builder.Separator(`${id}.separator`);

      experimental.builder.ButtonRow(`${id}.footer`, {
        justifyContent: 'space-between',
        children: () => {
          builder.Button(`${id}.footer.cancel`, {
            label: 'common.back',
            icon: '@imgly/ChevronLeft',
            onClick: context.toggleExpand
          });

          builder.Button(`${id}.footer.apply`, {
            label: `ly.img.ai.quickAction.${id}.apply`,
            icon: '@imgly/MagicWand',
            color: 'accent',
            isDisabled: promptState.value.length === 0,
            onClick: async () => {
              try {
                const prompt = promptState.value;
                if (!prompt) return;

                options.onApply(prompt, context);
                context.toggleExpand();
                context.closeMenu();
              } catch (error) {
                context.handleGenerationError(error);
              }
            }
          });
        }
      });
    }
  };
}

export default QuickActionBasePrompt;
