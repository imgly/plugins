import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { type AssetResult } from '@cesdk/engine';
import { fal } from '@fal-ai/client';
import { type OpenAPIV3 } from 'openapi-types';
import type Initializer from './initializer';
import previewUri from './previewUri';
import Transformer from './transformer';

// Set to true to prevent the AI generation from running
const DRY_RUN = true;

const DEFAULT_ID = 'fal-ai';

const ASSET_LIBRARY_ENTRY_ID = 'ly.img.fal-ai.entry';

let counter = 0;

/**
 * The image size enums for the AI generation fal.ai is using.
 */
const IMAGE_SIZE_ENUMS: Record<string, { width: number; height: number }> = {
  square_hd: { width: 1024, height: 1024 },
  square: { width: 512, height: 512 },
  portrait_4_3: { width: 768, height: 1024 },
  portrait_16_9: { width: 720, height: 1280 },
  landscape_4_3: { width: 1024, height: 768 },
  landscape_16_9: { width: 1280, height: 720 }
};

function initializeFromSchema(
  cesdk: CreativeEditorSDK,
  initializer: Initializer,
  schema: OpenAPIV3.Document
) {
  fal.config({
    // @ts-ignore
    proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
  });

  const { title } = schema.info;
  const xIMGLY = (schema.info as any)['x-imgly'];
  const id = xIMGLY?.id ?? DEFAULT_ID;

  const assetSourceId = id;
  const panelId = `//ly.img.panel/${id}`;

  cesdk.setTranslations({
    en: {
      [`panel.${panelId}`]: title,
      [`libraries.${id}.label`]: title
    }
  });

  const assetSourceIds = cesdk.engine.asset.findAllSources();
  if (!assetSourceIds.includes(assetSourceId)) {
    cesdk.engine.asset.addLocalSource(assetSourceId);
  }

  const entry = cesdk.ui.getAssetLibraryEntry(ASSET_LIBRARY_ENTRY_ID);
  if (entry == null) {
    cesdk.ui.addAssetLibraryEntry({
      id: ASSET_LIBRARY_ENTRY_ID,
      sourceIds: [assetSourceId],
      gridColumns: 2,
      gridItemHeight: 'auto',
      previewLength: 3,

      gridBackgroundType: 'cover'
    });
  } else {
    cesdk.ui.updateAssetLibraryEntry(ASSET_LIBRARY_ENTRY_ID, {
      sourceIds: [...entry.sourceIds, assetSourceId]
    });
  }

  registerComponents(cesdk, { id, title, panelId });
  registerPanels(cesdk, { id, panelId, schema, initializer });
}

function registerPanels(
  cesdk: CreativeEditorSDK,
  {
    id,
    panelId,
    schema,
    initializer
  }: {
    id: string;
    panelId: string;
    schema: OpenAPIV3.Document;
    initializer: Initializer;
  }
) {
  cesdk.ui.registerPanel(panelId, ({ builder, state, engine }) => {
    const falInitialized = state<boolean>(
      'falInitialized',
      initializer.isInitialized()
    );

    if (falInitialized.value === false) {
      builder.Section('ly.img.fal-ai.notInitialized.section', {
        children: () => {
          builder.Text('ly.img.fal-ai.notInitialized', {
            content:
              'You need to initialize the fal.ai client first. Please provide the credentials or the proxy URL.'
          });

          const credentials = state<string>('credentials', '');
          const proxyUrl = state<string>('proxyUrl', '');

          builder.TextInput('ly.img.fal-ai.credentials', {
            inputLabel: 'Credentials',
            ...credentials
          });

          builder.TextInput('ly.img.fal-ai.proxyUrl', {
            inputLabel: 'Proxy URL',
            ...proxyUrl
          });

          builder.Button('ly.img.fal-ai.initialize', {
            label: 'Initialize',
            isDisabled: credentials.value === '' && proxyUrl.value === '',
            onClick: () => {
              initializer.initialize({
                credentials: credentials.value,
                proxyUrl: proxyUrl.value
              });
              falInitialized.setValue(initializer.isInitialized());
            }
          });
        }
      });

      return;
    }

    const transformer = new Transformer(schema, state);
    const result = transformer.transform();

    builder.Section('ly.img.fal-ai.section', {
      children: () => {
        result.components.forEach((component) => {
          if (!component.hide && component.builderComponent in builder) {
            const componentId = `ly.img.${id}.${component.builderComponent}.${component.propertyName}`;
            try {
              builder[component.builderComponent](
                componentId,
                // @ts-ignore
                {
                  ...component.state,
                  ...component.builderProperties
                }
              );
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(e);
              builder.Text(componentId, {
                content: (e as any).toString()
              });
            }
          }
        });
      }
    });

    builder.Section('ly.img.fal-ai.generate.section', {
      children: () => {
        const generating = state<boolean>('generating', false);
        builder.Button('ly.img.fal-ai.generate.button', {
          label: 'Generate',
          isLoading: generating.value,
          color: 'accent',
          onClick: async () => {
            generating.setValue(true);
            let block: number | undefined;

            try {
              const { input } = transformer.getRequestInput(
                result.requestValues
              );
              // Replace the leading slash in the path
              const path = transformer.path.replace(/^\//, '');

              const imageSizeInput: string | { width: number; height: number } =
                // @ts-ignore
                input.image_size;

              const imageSize =
                imageSizeInput != null && typeof imageSizeInput === 'string'
                  ? IMAGE_SIZE_ENUMS[imageSizeInput]
                  : imageSizeInput;

              const assetResult: AssetResult = {
                id: `${DEFAULT_ID}/${counter++}`,
                meta: {
                  previewUri,
                  fillType: '//ly.img.ubq/fill/image',
                  width: imageSize.width,
                  height: imageSize.height
                }
              };

              block = await engine.asset.defaultApplyAsset(assetResult);
              if (block == null) throw new Error('Could not create block');
              const fill = engine.block.getFill(block);

              cesdk.engine.block.setState(block, {
                type: 'Pending',
                progress: 0
              });

              if (!DRY_RUN) {
                const response = await fal.subscribe(path, {
                  // Map the states to the input object
                  input,
                  logs: true
                });

                const images = response?.data?.images;
                if (images != null && Array.isArray(images)) {
                  await Promise.all(
                    images.map(async (image) => {
                      const url = image?.url;
                      if (url == null) return;

                      await engine.block.addImageFileURIToSourceSet(
                        fill,
                        'fill/image/sourceSet',
                        response.data.images[0].url
                      );

                      const sourceSet = engine.block.getSourceSet(
                        fill,
                        'fill/image/sourceSet'
                      );
                      const [source] = sourceSet;

                      const meta = {
                        uri: url,
                        thumbUri: url,
                        fillType: '//ly.img.ubq/fill/image',
                        width: source.width,
                        height: source.height
                      };

                      const payload = {
                        sourceSet
                      };

                      engine.asset.addAssetToSource(id, {
                        id: url,
                        groups: [],
                        tags: {
                          en: ['fal.ai']
                        },
                        meta,
                        payload
                      });
                    })
                  );
                }
              } else {
                // eslint-disable-next-line no-console
                console.log(
                  `[DRY RUN]: Requesting AI generation on path '${path}' with input:`,
                  JSON.stringify(input, undefined, 2)
                );
                await wait(1000);
                // @ts-ignore
                const prompt: string = input.prompt;
                const placeholderURL = `https://placehold.co/${
                  imageSize.width
                }x${imageSize.height}?text=${prompt
                  .replace(' ', '+')
                  .replace('\n', '+')}`;
                await engine.block.addImageFileURIToSourceSet(
                  fill,
                  'fill/image/sourceSet',
                  placeholderURL
                );

                engine.asset.addAssetToSource(id, {
                  id: `${DEFAULT_ID}/${counter++}`,
                  groups: [],
                  tags: {
                    en: ['fal.ai']
                  },
                  meta: {
                    uri: placeholderURL,
                    thumbUri: placeholderURL,
                    fillType: '//ly.img.ubq/fill/image',
                    width: imageSize.width,
                    height: imageSize.height
                  }
                });
              }

              cesdk.engine.block.setState(block, { type: 'Ready' });
            } catch (e: any) {
              let message = (e as any).toString();
              if ('body' in e && 'detail' in e.body) {
                message = e.body.detail;
              }
              cesdk.ui.showNotification({
                type: 'error',
                message
              });
              if (block != null && engine.block.isValid(block)) {
                engine.block.setState(block, {
                  type: 'Error',
                  error: 'Unknown'
                });
              }
            } finally {
              generating.setValue(false);
            }
          }
        });
      }
    });

    builder.Section('ly.img.fal-ai.generated.section', {
      children: () => {
        builder.Library('ly.img.fal-ai.generated', {
          entries: [
            {
              id: ASSET_LIBRARY_ENTRY_ID,
              sourceIds: [id],
              gridColumns: 2,
              gridItemHeight: 'auto',
              previewLength: 3,

              gridBackgroundType: 'cover'
            }
          ]
        });
      }
    });
  });
}

function registerComponents(
  cesdk: CreativeEditorSDK,
  {
    id,
    title,
    panelId
  }: {
    id: string;
    title: string;
    panelId: string;
  }
) {
  cesdk.ui.registerComponent(`ly.img.${id}.dock`, ({ builder }) => {
    const isOpen = cesdk.ui.isPanelOpen(panelId);
    builder.Button('ly.img.fal-ai.dock', {
      label: title,
      icon: '@imgly/plugin/fal-ai',
      isSelected: isOpen,
      onClick: () => {
        if (isOpen) {
          cesdk.ui.closePanel(panelId);
        } else {
          cesdk.ui.findAllPanels({ open: true }).forEach((panel) => {
            if (panel.startsWith('//ly.img.panel/fal-ai/')) {
              cesdk.ui.closePanel(panel);
            }
          });
          cesdk.ui.openPanel(panelId);
        }
      }
    });
  });
}

async function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export default initializeFromSchema;
