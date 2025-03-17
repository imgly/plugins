import { type Provider, type ImageOutput } from "@imgly/plugin-utils-ai-generation";

const CustomProvider: Provider<'image', { prompt: string }, ImageOutput> = {
  id: 'custom',
  kind: 'image',
  initialize: async () => {
    console.log('initialize custom provider');
  },
  input: {
    panel: {
      type: 'custom',
      render: ({ builder, state }, { isGenerating }) => {
        builder.Section('prompt.section', {
          children: () => {
            builder.TextArea('prompt', {
              inputLabel: 'Prompt',
              isDisabled: isGenerating,
              ...state('prompt', '')
            });
          }
        });

        return () => {
          return {
            input: {
              prompt: state<string>('prompt', '').value
            },
            image: {
              width: 1024,
              height: 1024
            }
          };
        };
      }
    }
  },

  output: {
    abortable: true,
    history: '@imgly/indexedDB',
    generate: async () => {
      const result: { kind: 'image'; url: string } = {
        kind: 'image',
        url: 'https://placehold.co/1024'
      };
      return new Promise<{ kind: 'image'; url: string }>((resolve) => {
        setTimeout(() => {
          resolve(result);
        }, 3000);
      });
    }
  }
};

export default CustomProvider;
