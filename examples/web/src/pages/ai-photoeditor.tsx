import { useRef } from 'react';
import CreativeEditorSDK, {
  CreativeEngine,
  SettingsBool
} from '@cesdk/cesdk-js';
import OpenAiImage from '@imgly/plugin-ai-image-generation-web/open-ai';
import PhotoEditorPlugin from './PhotoEditorPlugin';

const ALL_CROP_CONSTRAINTS = ['none', 'aspect-ratio', 'resolution'] as const;
type CropConstraint = (typeof ALL_CROP_CONSTRAINTS)[number];

function App() {
  const cesdk = useRef<CreativeEditorSDK>();
  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      ref={(domElement) => {
        if (domElement != null) {
          CreativeEditorSDK.create(domElement, {
            license: import.meta.env.VITE_CESDK_LICENSE_KEY,
            userId: 'plugins-vercel',
            role: 'Adopter',
            callbacks: {
              onUpload: 'local',
              onExport: 'download',
              onLoadArchive: 'uploadArchive'
            },
            featureFlags: {
              archiveSceneEnabled: true,
              dangerouslyDisableVideoSupportCheck: false
            },
            ui: {
              elements: {
                blocks: {
                  '//ly.img.ubq/page': {
                    manage: false
                  }
                },

                navigation: {
                  action: {
                    load: true,
                    export: true
                  }
                }
              }
            }
          }).then(async (instance) => {
            // @ts-ignore
            window.cesdk = instance;
            cesdk.current = instance;

            instance.ui.setDockOrder(['ly.img.ai.photoeditor']);

            setupPhotoEditingScene(
              instance,
              'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&dl=dom-hill-nimElTcTNyY-unsplash.jpg&w=1920'
            );

            await Promise.all([
              instance.addDefaultAssetSources(),
              instance.addDemoAssetSources({ sceneMode: 'Video' })
            ]);

            instance.addPlugin(
              PhotoEditorPlugin({
                image2image: OpenAiImage.GptImage1.Image2Image({
                  proxyUrl: import.meta.env.VITE_OPENAI_PROXY_URL
                })
              })
            );
          });
        } else if (cesdk.current != null) {
          cesdk.current.dispose();
        }
      }}
    ></div>
  );
}

async function setupPhotoEditingScene(
  instance: CreativeEditorSDK,
  uri: string
) {
  const engine = instance.engine;
  const size = await getImageSize(uri);
  if (!size || !size.width || !size.height) {
    throw new Error('Could not get image size');
  }
  const { width, height } = size;
  // hide page title:
  engine.editor.setSettingBool('page/title/show', false);

  const scene = engine.scene.create('Free');
  engine.scene.setDesignUnit('Pixel');
  const page = engine.block.create('page');
  // Add page to scene:
  engine.block.appendChild(scene, page);
  // Set page size:
  engine.block.setWidth(page, width);
  engine.block.setHeight(page, height);
  // Create image fill"
  const fill = engine.block.createFill('image');
  // Set fill url:
  engine.block.setSourceSet(fill, 'fill/image/sourceSet', [
    { uri, width, height }
  ]);
  engine.block.setFill(page, fill);
  // Set content fill mode to cover:
  engine.block.setContentFillMode(page, 'Cover');
  // Disable changing fill of page, hides e.g also the "replace" button
  engine.block.setScopeEnabled(page, 'fill/change', false);
  engine.block.setScopeEnabled(page, 'fill/changeType', false);
  // Disable stroke of page, since it does not make sense with current wording and takes up to much space
  engine.block.setScopeEnabled(page, 'stroke/change', false);
  engine.editor.setSettingBool(
    'ubq://page/moveChildrenWhenCroppingFill' as SettingsBool,
    true
  );
  engine.block.setClipped(page, true);

  // only allow resizing and moving of page in crop mode
  const unsubscribeStateChange = engine.editor.onStateChanged(() => {
    const editMode = engine.editor.getEditMode();
    const cropConstraint = getCropConstraintMetadata(engine);
    if (editMode !== 'Crop') {
      // close size preset panel
      instance.ui.closePanel('ly.img.page-crop');
      engine.editor.setSettingBool(
        'ubq://page/allowResizeInteraction' as SettingsBool,
        false
      );
      return;
    }
    if (cropConstraint === 'none') {
      engine.editor.setSettingBool(
        'ubq://page/restrictResizeInteractionToFixedAspectRatio' as SettingsBool,
        false
      );
      engine.editor.setSettingBool(
        'ubq://page/allowResizeInteraction' as SettingsBool,
        true
      );
    } else if (cropConstraint === 'aspect-ratio') {
      engine.editor.setSettingBool(
        'ubq://page/restrictResizeInteractionToFixedAspectRatio' as SettingsBool,
        true
      );
      engine.editor.setSettingBool(
        'ubq://page/allowResizeInteraction' as SettingsBool,
        true
      );
    } else if (cropConstraint === 'resolution') {
      engine.editor.setSettingBool(
        'ubq://page/allowResizeInteraction' as SettingsBool,
        false
      );
      engine.editor.setSettingBool(
        'ubq://page/restrictResizeInteractionToFixedAspectRatio' as SettingsBool,
        false
      );
    }
  });

  // If nothing is selected: select page by listening to selection changes
  const unsubscribeSelectionChange = engine.block.onSelectionChanged(() => {
    const selection = engine.block.findAllSelected();
    if (selection.length === 0) {
      const page = engine.scene.getCurrentPage();
      engine.block.select(page!);
    }
  });

  // Initially select the page
  engine.block.select(page);
  return () => {
    unsubscribeSelectionChange();
    unsubscribeStateChange();
  };
}

function getImageSize(url: string): Promise<{ width: number; height: number }> {
  const img = document.createElement('img');

  const promise = new Promise<{ width: number; height: number }>(
    (resolve, reject) => {
      img.onload = () => {
        // Natural size is the actual image size regardless of rendering.
        // The 'normal' `width`/`height` are for the **rendered** size.
        const width = img.naturalWidth;
        const height = img.naturalHeight;

        // Resolve promise with the width and height
        resolve({ width, height });
      };

      // Reject promise on error
      img.onerror = reject;
    }
  );

  // Setting the source makes it start downloading and eventually call `onload`
  img.src = url;

  return promise;
}

export function getCropConstraintMetadata(
  engine: CreativeEngine
): CropConstraint {
  const page = engine.scene.getCurrentPage();
  if (!page || !engine.block.findAllMetadata(page).includes('cropConstraint')) {
    return 'none';
  }
  return engine.block.getMetadata(page, 'cropConstraint') as CropConstraint;
}

export default App;
