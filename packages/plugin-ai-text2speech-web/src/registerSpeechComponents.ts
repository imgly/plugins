import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { uuid } from '@imgly/plugin-utils';
import createVoicesAssetSource from './createVoicesAssetSource';
// import generateTextForSpeech from './prompts/generateTextForSpeech';
import { generateSpeech, getAudioDuration, truncate } from './speechUtils';

const PREFIX = 'ly.img.textToSpeech';
export const LOCAL_HISTORY_ASSET_SOURCE_ID = `${PREFIX}/history`;
export const HISTORY_ASSET_LIBRARY_ENTRY_ID = `${PREFIX}/entry`;

function registerSpeechComponents(
  cesdk: CreativeEditorSDK,
) {
  addIconSet(cesdk);

  const voiceAssetSourceId = createVoicesAssetSource(cesdk);
  cesdk.engine.asset.addLocalSource(LOCAL_HISTORY_ASSET_SOURCE_ID);
  cesdk.ui.addAssetLibraryEntry({
    id: HISTORY_ASSET_LIBRARY_ENTRY_ID,
    sourceIds: [LOCAL_HISTORY_ASSET_SOURCE_ID],
    canRemove: true,
    gridItemHeight: 'square',
    gridColumns: 3,
    gridBackgroundType: 'cover',
    cardLabel: (asset) => asset.label,
    cardLabelPosition: () => 'inside',
    cardBackgroundPreferences: ({ meta }) => {
      console.log(meta);
      return {
        type: 'image',
        url:
          meta?.thumbUri ??
          'https://cdn.img.ly/assets/demo/v1/ly.img.audio/thumbnails/audio-wave.png'
      };
    }
  });
  cesdk.ui.addAssetLibraryEntry({
    id: 'ly.img.generate.speech.voiceSelection',
    sourceIds: [voiceAssetSourceId],
    gridColumns: 3
  });

  cesdk.setTranslations({
    en: {
      'panel.ly.img.generate.speech': 'Generate Speech',
      'panel.ly.img.generate.speech.voiceSelection': 'Select a Voice'
    }
  });
  cesdk.ui.registerComponent('ly.img.generate.speech.dock', ({ builder }) => {
    const isPanelOpen = cesdk.ui.isPanelOpen('ly.img.generate.speech');

    builder.Button('ly.img.generate.speech.dock', {
      label: 'Generate Speech',
      icon: '@imgly/TextToSpeech',
      isSelected: isPanelOpen,
      onClick: () => {
        if (isPanelOpen) {
          cesdk.ui.closePanel('ly.img.generate.speech');
        } else {
          cesdk.ui.openPanel('ly.img.generate.speech');
        }
      }
    });
  });

  cesdk.ui.registerPanel<{
    id: string;
    onSelect: (voiceId: string, name: string, thumbnail?: string) => void;
  }>('ly.img.generate.speech.voiceSelection', ({ builder, payload }) => {
    builder.Library('ly.img.generate.speech.voiceSelection.library', {
      searchable: true,
      entries: ['ly.img.generate.speech.voiceSelection'],
      onSelect: async (entry) => {
        console.log('selected', entry);
        const { id, label } = entry;
        payload?.onSelect(
          id,
          label ?? id,
          entry.meta?.thumbUri as string | undefined
        );
        cesdk.ui.closePanel('ly.img.generate.speech.voiceSelection');
      }
    });
  });

  cesdk.ui.registerPanel<{ text: string }>(
    '@imgly/plugin-ai-text2speech',
    ({ builder, state, engine, experimental, payload }) => {
      const text = payload?.text ?? '';
      const voiceState = state<{
        voiceId: string;
        name: string;
        thumbnail?: string;
      }>('voice', {
        voiceId: 'JBFqnCBsd6RMkjVDRZzb',
        name: 'George',
        thumbnail: 'https://ubique.img.ly/static/voices/george.webp'
      });
      const promptState = experimental.global<string>(
        'ly.img.ai.inference.speech.text',
        text
      );
      const speedState = state<number>('speed', 1);
      const generatingTextState = state<boolean>('generatingText', false);
      const generatingState = state<boolean>('generating', false);

      const cancelGenerateText = () => {};
      const generateText = async () => {
        // generatingTextState.setValue(true);
        // const abortController = new AbortController();
        // const signal = abortController.signal;
        // cancelGenerateText = () => abortController.abort();

        // try {
        //   const stream = await generateTextForSpeech(
        //     anthropic,
        //     state('ly.img.generate.speech.createPrompt', '').value,
        //     signal
        //   );
        //   let inferredText = '';
        //   for await (const chunk of stream) {
        //     if (signal.aborted) {
        //       break;
        //     }
        //     inferredText += chunk;
        //     promptState.setValue(inferredText);
        //   }
        // } catch (error) {
        //   console.log(error);
        //   cesdk.ui.showNotification({
        //     type: 'error',
        //     message: 'Error generating text'
        //   });
        // } finally {
        //   generatingTextState.setValue(false);
        // }
      };
      builder.Section('ly.img.generate.speech.section', {
        children: () => {
          builder.TextArea('ly.img.generate.speech.prompt', {
            inputLabel: 'Text',
            isDisabled: generatingTextState.value,
            ...promptState
          });
          // experimental.builder.Popover(
          //   'ly.img.generate.speech.generatePrompt',
          //   {
          //     variant: 'plain',
          //     placement: 'right',
          //     inputLabel: '',
          //     label: 'Generate Text...',
          //     icon: '@imgly/Sparkle',
          //     isLoading: generatingTextState.value,
          //     suffix: generatingTextState.value
          //       ? {
          //           icon: '@imgly/Cross',
          //           onClick: () => {
          //             cancelGenerateText();
          //             generatingTextState.setValue(false);
          //           }
          //         }
          //       : undefined,
          //     trailingIcon: null,
          //     children: ({ close }) => {
          //       builder.Section('ly.img.generate.speech.createPrompt.section', {
          //         children: () => {
          //           builder.TextArea('ly.img.generate.speech.createPrompt', {
          //             inputLabel: 'Prompt',
          //             ...state('ly.img.generate.speech.createPrompt', '')
          //           });
          //           builder.Text(
          //             'ly.img.generate.speech.createPrompt.description',
          //             {
          //               content:
          //                 'Generate a text for your speech. Describe the content you want to generate.'
          //             }
          //           );
          //           builder.Button(
          //             'ly.img.generate.speech.createPromptButton',
          //             {
          //               label: 'Generate',
          //               onClick: async () => {
          //                 close();
          //                 generateText();
          //               }
          //             }
          //           );
          //         }
          //       });
          //     }
          //   }
          // );
          builder.Separator('ly.img.generate.speech.separator.0');
          builder.Button('ly.img.generate.speech.openVoiceSelection', {
            inputLabel: 'Voice',
            icon: '@imgly/Appearance',
            trailingIcon: '@imgly/ChevronRight',
            labelAlignment: 'left',
            label: voiceState.value.name,
            onClick: () => {
              cesdk.ui.openPanel('ly.img.generate.speech.voiceSelection', {
                payload: {
                  id: voiceState.value.voiceId,
                  onSelect: (
                    voiceId: string,
                    name: string,
                    thumbnail?: string
                  ) => {
                    console.log('setting voice', voiceId, name, thumbnail);
                    voiceState.setValue({ voiceId, name, thumbnail });
                  }
                }
              });
            }
          });

          builder.Slider('ly.img.generate.speech.speed', {
            inputLabel: 'Speed',
            min: 0.7,
            max: 1.2,
            step: 0.05,
            ...speedState
          });

          builder.Separator('ly.img.generate.speech.separator.1');

          builder.Button('ly.img.generate.speech.generate', {
            label: 'Generate',
            color: 'accent',
            isDisabled: generatingTextState.value || promptState.value === '',
            isLoading: generatingState.value,
            onClick: async () => {
              generatingState.setValue(true);
              const voiceId = voiceState.value.voiceId;
              const prompt = promptState.value;

              const audioBlob = await generateSpeech(prompt, voiceId, {
                speed: parseFloat(speedState.value.toFixed(10))
              });
              const audioUrl = URL.createObjectURL(audioBlob);
              const audioDuration = await getAudioDuration(audioUrl);

              const asset = {
                id: uuid(),
                meta: {
                  uri: audioUrl,
                  blockType: '//ly.img.ubq/audio',
                  mimeType: 'audio/x-m4a',
                  thumbUri: voiceState.value.thumbnail,
                  duration: audioDuration.toFixed(2)
                }
              };

              cesdk.engine.asset.addAssetToSource(
                LOCAL_HISTORY_ASSET_SOURCE_ID,
                {
                  ...asset,
                  label: {
                    en: truncate(prompt, 50)
                  }
                }
              );

              await engine.asset.defaultApplyAsset(asset);
              generatingState.setValue(false);
            }
          });

          builder.Separator('ly.img.generate.speech.separator.3');
          builder.Library('ly.img.generate.speech.history', {
            searchable: false,
            entries: [HISTORY_ASSET_LIBRARY_ENTRY_ID]
          });
        }
      });
    }
  );
}

function addIconSet(cesdk: CreativeEditorSDK) {
  cesdk.ui.addIconSet(
    '@imgly/generate-speech',
    `
<svg width="0" height="0" xmlns="http://www.w3.org/2000/svg">
<symbol width="24" height="24" viewBox="0 0 24 24" fill="none" id="@imgly/TextToSpeech">
    <path fill-rule="evenodd" clip-rule="evenodd" d="M2 9C2 6.23858 4.23858 4 7 4H17C19.7614 4 22 6.23858 22 9V14C22 16.7614 19.7614 19 17 19H14.3028L9.33205 22.3138C8.33521 22.9784 7 22.2638 7 21.0657V19C4.23858 19 2 16.7614 2 14V9ZM7 6C5.34315 6 4 7.34315 4 9V14C4 15.6569 5.34315 17 7 17H7.5C8.32843 17 9 17.6716 9 18.5V20.1315L13.3193 17.2519C13.5657 17.0877 13.8553 17 14.1514 17H17C18.6569 17 20 15.6569 20 14V9C20 7.34315 18.6569 6 17 6H7Z" fill="currentColor"/>
<path d="M14.4581 7.7285C14.3815 7.52409 14.0924 7.52409 14.0157 7.7285L13.5587 8.94721C13.5347 9.0111 13.4843 9.06151 13.4204 9.08547L12.2017 9.54249C11.9973 9.61914 11.9973 9.90827 12.2017 9.98492L13.4204 10.4419C13.4843 10.4659 13.5347 10.5163 13.5587 10.5802L14.0157 11.7989C14.0924 12.0033 14.3815 12.0033 14.4581 11.7989L14.9152 10.5802C14.9391 10.5163 14.9895 10.4659 15.0534 10.4419L16.2721 9.98492C16.4765 9.90827 16.4765 9.61914 16.2721 9.54249L15.0534 9.08547C14.9895 9.06151 14.9391 9.0111 14.9152 8.94721L14.4581 7.7285Z" fill="currentColor"/>
<path d="M10.9905 9.91634C10.8729 9.61038 10.44 9.61038 10.3223 9.91634L9.52031 12.0016C9.48395 12.0961 9.40924 12.1708 9.3147 12.2072L7.22947 13.0092C6.92351 13.1269 6.92351 13.5597 7.22947 13.6774L9.3147 14.4794C9.40924 14.5158 9.48395 14.5905 9.52031 14.685L10.3223 16.7703C10.44 17.0762 10.8729 17.0762 10.9905 16.7703L11.7926 14.685C11.8289 14.5905 11.9036 14.5158 11.9982 14.4794L14.0834 13.6774C14.3893 13.5597 14.3893 13.1269 14.0834 13.0092L11.9982 12.2072C11.9036 12.1708 11.8289 12.0961 11.7926 12.0016L10.9905 9.91634Z" fill="currentColor"/>
</symbol>
</svg>
    `
  );
}
export default registerSpeechComponents;
