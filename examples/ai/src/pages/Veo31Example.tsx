import { useRef } from 'react';
import CreativeEditorSDK from '@cesdk/cesdk-js';
import AiApps from '@imgly/plugin-ai-apps-web';
import FalAiVideo from '@imgly/plugin-ai-video-generation-web/fal-ai';

/**
 * Veo 3.1 Integration Example
 *
 * This example demonstrates how to integrate all Google Veo 3.1 video generation providers
 * into a CreativeEditorSDK application. Veo 3.1 provides three types of video generation:
 *
 * 1. Text-to-Video: Generate videos from text descriptions
 * 2. Image-to-Video: Animate static images into videos
 * 3. First-Last Frame: Interpolate smooth video transitions between two images
 *
 * Each type comes in two variants:
 * - Standard: Higher quality, longer processing time
 * - Fast: Faster processing, optimized for quick iterations
 *
 * Note: The "Animate Between Images" quick action automatically appears when 2 images
 * are selected in the canvas. No image generation providers are required - the video
 * plugin's quick action will automatically enable the image canvas menu.
 */
function Veo31Example() {
  const cesdk = useRef<CreativeEditorSDK>();

  return (
    <div
      style={{ width: '100vw', height: '100vh' }}
      ref={(domElement) => {
        if (domElement != null) {
          CreativeEditorSDK.create(domElement, {
            license: import.meta.env.VITE_CESDK_LICENSE_KEY,
            userId: 'veo31-example',
            callbacks: {
              onUpload: 'local',
              onExport: 'download'
            },
            featureFlags: {
              // Enable archive support for saving/loading scenes
              archiveSceneEnabled: true
            },
            ui: {
              elements: {
                navigation: {
                  action: {
                    export: true
                  }
                }
              }
            }
          }).then(async (instance) => {
            // Store SDK instance reference
            cesdk.current = instance;
            // @ts-ignore - Expose for debugging
            window.cesdk = instance;

            // Add default asset sources for media library
            await Promise.all([
              instance.addDefaultAssetSources(),
              instance.addDemoAssetSources({ sceneMode: 'Video' })
            ]);

            // Configure UI layout: Place AI Apps dock first
            instance.ui.setDockOrder(['ly.img.ai.apps.dock', ...instance.ui.getDockOrder()]);

            // Add AI canvas menus to enable quick actions like "Animate Between Images"
            // This quick action appears when 2 images are selected
            instance.ui.setCanvasMenuOrder([
              {
                id: 'ly.img.ai.image.canvasMenu'
              },
              ...instance.ui.getCanvasMenuOrder()
            ]);

            // Load a video editing scene
            await instance.engine.scene.loadFromArchiveURL(
              'https://img.ly/showcases/cesdk/cases/ai-editor/ai_editor_video.archive'
            );

            // Add AI Apps plugin with all 6 Veo 3.1 providers
            instance.addPlugin(
              AiApps({
                providers: {
                  // ===================================================
                  // Text-to-Video Providers
                  // Generate videos from text descriptions
                  // ===================================================
                  text2video: [
                    // Standard Veo 3.1: Highest quality text-to-video
                    // Best for: Final output, marketing content, detailed scenes
                    FalAiVideo.Veo31TextToVideo({
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),

                    // Fast Veo 3.1: Optimized for speed
                    // Best for: Rapid prototyping, testing ideas, iterative workflows
                    FalAiVideo.Veo31FastTextToVideo({
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    })
                  ],

                  // ===================================================
                  // Image-to-Video Providers
                  // Animate static images into dynamic videos
                  // ===================================================
                  image2video: [
                    // Standard Veo 3.1: High-quality image animation
                    // Best for: Product showcases, photo-realistic animations
                    FalAiVideo.Veo31ImageToVideo({
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),

                    // Fast Veo 3.1: Quick image animation
                    // Best for: Social media content, quick previews
                    FalAiVideo.Veo31FastImageToVideo({
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),

                    // ===================================================
                    // First-Last Frame Providers (Frame Interpolation)
                    // Create smooth transitions between two images
                    // ===================================================
                    //
                    // USAGE: Select 2 images in the canvas, then click the
                    // "Animate Between Images" quick action that appears in
                    // the context menu. This will open the video generation
                    // panel with both images pre-loaded as first/last frames.

                    // Standard First-Last Frame: Premium interpolation quality
                    // Best for: Story transitions, morphing effects, cinematic sequences
                    FalAiVideo.Veo31FirstLastFrameToVideo({
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    }),

                    // Fast First-Last Frame: Quick interpolation
                    // Best for: Quick transitions, draft animations
                    FalAiVideo.Veo31FastFirstLastFrameToVideo({
                      proxyUrl: import.meta.env.VITE_FAL_AI_PROXY_URL
                    })
                  ]
                }
              })
            );

            console.log('Veo 3.1 providers initialized successfully');
          }).catch((error) => {
            console.error('Failed to initialize CreativeEditorSDK:', error);
            alert('Failed to initialize the editor. Please check the console for details.');
          });
        } else if (cesdk.current != null) {
          // Cleanup: Dispose SDK when component unmounts
          cesdk.current.dispose();
        }
      }}
    />
  );
}

export default Veo31Example;
