import { ButtonOptions } from '@cesdk/cesdk-js';
import { Output, QuickAction, QuickActionContext } from '../../provider';

/**
 * Quick action base for quick actions to open a panel.
 */
function QuickActionBaseButton<I, O extends Output>(options: {
  buttonOptions?: ButtonOptions;
  quickAction: Omit<QuickAction<I, O>, 'render' | 'renderExpanded'>;

  onClick: (context: QuickActionContext<I, O>) => Promise<void>;
}): QuickAction<I, O> {
  const id = options.quickAction.id;
  return {
    ...options.quickAction,
    render: ({ builder }, context) => {
      builder.Button(`${id}.button`, {
        label: `ly.img.ai.quickAction.${id}`,
        icon: '@imgly/Sparkle',
        labelAlignment: 'left',
        variant: 'plain',
        ...options.buttonOptions,
        onClick: async () => {
          try {
            options.onClick(context);
            context.closeMenu();
          } catch (error) {
            context.handleGenerationError(error);
          }
        }
      });
    }
  };
}

export default QuickActionBaseButton;
