import CreativeEditorSDK, { EditorPlugin } from '@cesdk/cesdk-js';
import {
  ImageOutput,
  initProvider,
  Middleware,
  OutputKind,
  Provider,
  isAsyncGenerator,
  CommonProperties
} from '@imgly/plugin-ai-generation-web';

export type GetProvider<K extends OutputKind> = ({
  cesdk
}: {
  cesdk: CreativeEditorSDK;
}) => Promise<Provider<K, any, any>>;

const PLUGIN_ID = '@imgly/plugin-ai-photo-edit';
const PANEL_ID = PLUGIN_ID;

const PhotoEditorPlugin: (options: {
  image2image: GetProvider<'image'>;
}) => EditorPlugin = (options) => ({
  id: PLUGIN_ID,
  name: 'AI Photo Edit',
  version: '0.0.0',

  initialize: async ({ cesdk }) => {
    if (cesdk == null) return;

    const provider = await options.image2image({ cesdk });

    const inputPanel = provider.input.panel;
    if (inputPanel != null && inputPanel.type === 'schema') {
      const providerDefinedOrder = inputPanel.order;
      inputPanel.order = (passedOrder) => {
        let order = passedOrder;
        if (providerDefinedOrder != null) {
          if (Array.isArray(providerDefinedOrder)) {
            order = providerDefinedOrder;
          } else if (typeof providerDefinedOrder === 'function') {
            order = providerDefinedOrder(passedOrder);
          }
        }

        const promptIndex = order.findIndex((item) => item === 'prompt');
        if (promptIndex === -1) {
          return [...order, 'style'];
        } else {
          // Insert 'style' after 'prompt'
          return [
            ...order.slice(0, promptIndex + 1),
            'style',
            ...order.slice(promptIndex + 1)
          ];
        }
      };

      inputPanel.userFlow = 'generation-only';
      inputPanel.renderCustomProperty = {
        ...(inputPanel.renderCustomProperty ?? {}),
        ...CommonProperties.StyleTransfer(provider.id, {
          cesdk,
          i18n: {
            prompt: {
              inputLabel: 'Prompt',
              placeholder: 'Replace the setting with a tropical beach at sunset'
            }
          }
        }),
        image_url: () => {
          return () => {
            const page = cesdk.engine.scene.getCurrentPage()!;
            const fill = cesdk.engine.block.getFill(page);
            const sourceSet = cesdk.engine.block.getSourceSet(
              fill,
              'fill/image/sourceSet'
            );
            const imageSource = sourceSet[0];
            return {
              type: 'string',
              id: 'image_url',
              value: imageSource.uri
            };
          };
        }
      };
    }

    const output = provider.output;
    output.history = false;
    output.middleware = [
      getApplyToPhotoMiddleware({ cesdk }),
      ...(output.middleware ?? [])
    ];

    const { renderBuilderFunctions } = await initProvider(
      provider,
      { cesdk, engine: cesdk.engine },
      { dryRun: false, debug: true }
    );

    const panelRenderFunction = renderBuilderFunctions?.panel;
    if (panelRenderFunction == null) return;

    cesdk.i18n.setTranslations({
      en: {
        [`panel.${PANEL_ID}`]: 'AI Edit',
        [`${PLUGIN_ID}.dock`]: 'AI Edit'
      }
    });
    cesdk.ui.addIconSet('@imgly/plugin-ai-photoeditor', iconSprite);
    cesdk.ui.registerComponent('ly.img.ai.photoeditor', ({ builder }) => {
      const isPanelOpen = cesdk.ui.isPanelOpen(PANEL_ID);

      builder.Button('ly.img.ai.photoeditor.button', {
        icon: '@imgly/Sparkle',
        label: `${PLUGIN_ID}.dock`,
        isSelected: isPanelOpen,
        onClick: async () => {
          if (isPanelOpen) {
            cesdk.ui.closePanel(PANEL_ID);
          } else {
            cesdk.ui.openPanel(PANEL_ID);
          }
        }
      });
    });

    cesdk.ui.registerPanel(PANEL_ID, (context) => {
      panelRenderFunction(context);
    });
  }
});

const getApplyToPhotoMiddleware =
  <I>({ cesdk }: { cesdk: CreativeEditorSDK }): Middleware<I, ImageOutput> =>
  async (input, options, next) => {
    const page = cesdk.engine.scene.getCurrentPage()!;
    const fill = cesdk.engine.block.getFill(page);
    const sourceSet = cesdk.engine.block.getSourceSet(
      fill,
      'fill/image/sourceSet'
    );
    const imageSource = sourceSet[0];

    cesdk.engine.block.setState(page, { type: 'Pending', progress: 0 });
    try {
      const result = await next(input, options);
      if (isAsyncGenerator(result)) {
        return result;
      }
      const imageUrl = result.url;

      cesdk.engine.block.setSourceSet(fill, 'fill/image/sourceSet', [
        { ...imageSource, uri: imageUrl }
      ]);
      cesdk.engine.editor.addUndoStep();

      return result;
    } catch (error) {
      throw error;
    } finally {
      cesdk.engine.block.setState(page, { type: 'Ready' });
    }
  };

const iconSprite = `
        <svg>
          <symbol
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            id="@imgly/Sparkle"
          >
          <path d="M5.35545 2.06745C5.24149 1.72556 4.7579 1.72556 4.64394 2.06745L4.05898 3.82232C4.02166 3.93429 3.9338 4.02215 3.82184 4.05948L2.06694 4.64459C1.72506 4.75858 1.72509 5.24217 2.06699 5.3561L3.82179 5.9409C3.93378 5.97822 4.02166 6.06609 4.05899 6.17808L4.64394 7.93291C4.7579 8.2748 5.24149 8.2748 5.35545 7.93291L5.9404 6.17806C5.97773 6.06608 6.06559 5.97821 6.17757 5.94089L7.93242 5.35594C8.27431 5.24198 8.27431 4.75839 7.93242 4.64442L6.17757 4.05947C6.06559 4.02215 5.97773 3.93428 5.9404 3.8223L5.35545 2.06745Z" fill="currentColor"/>
<path d="M17.9632 3.23614C17.8026 2.80788 17.1968 2.80788 17.0362 3.23614L16.0787 5.78951C16.0285 5.92337 15.9229 6.02899 15.789 6.07918L13.2356 7.0367C12.8074 7.19729 12.8074 7.80307 13.2356 7.96366L15.789 8.92118C15.9229 8.97138 16.0285 9.077 16.0787 9.21085L17.0362 11.7642C17.1968 12.1925 17.8026 12.1925 17.9632 11.7642L18.9207 9.21086C18.9709 9.077 19.0765 8.97138 19.2104 8.92118L21.7637 7.96366C22.192 7.80307 22.192 7.1973 21.7637 7.0367L19.2104 6.07918C19.0765 6.02899 18.9709 5.92337 18.9207 5.78951L17.9632 3.23614Z" fill="currentColor"/>
<path d="M9.30058 7.82012C9.54712 7.1791 10.454 7.1791 10.7006 7.82012L12.3809 12.189C12.4571 12.3871 12.6136 12.5436 12.8117 12.6198L17.1806 14.3001C17.8216 14.5466 17.8216 15.4536 17.1806 15.7001L12.8117 17.3804C12.6136 17.4566 12.4571 17.6131 12.3809 17.8112L10.7006 22.1801C10.454 22.8211 9.54712 22.8211 9.30058 22.1801L7.62024 17.8112C7.54406 17.6131 7.38754 17.4566 7.18947 17.3804L2.82061 15.7001C2.17959 15.4536 2.17959 14.5466 2.82061 14.3001L7.18947 12.6198C7.38754 12.5436 7.54406 12.3871 7.62024 12.189L9.30058 7.82012Z" fill="currentColor"/>

          </symbol>
        </svg>
`;

export default PhotoEditorPlugin;
