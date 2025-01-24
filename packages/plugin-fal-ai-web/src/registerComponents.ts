import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { DOCK_COMPONENT_ID, PANEL_ID } from './constants';
import { PluginConfiguration } from './types';

function registerComponents(
  cesdk: CreativeEditorSDK,
  _config: PluginConfiguration
): void {
  cesdk.ui.registerComponent(DOCK_COMPONENT_ID, ({ builder }) => {
    const isPanelOpen = cesdk.ui.isPanelOpen(PANEL_ID);

    const replaceLibraryOpen = cesdk.ui.isPanelOpen(
      '//ly.img.panel/assetLibrary.replace'
    );

    builder.Button(`${DOCK_COMPONENT_ID}.button`, {
      label: `panel.${PANEL_ID}`,
      icon: '@imgly/plugin/fal-ai',
      isDisabled: replaceLibraryOpen,
      isSelected: isPanelOpen,
      onClick: () => {
        if (isPanelOpen) {
          cesdk.ui.closePanel(PANEL_ID);
        } else {
          cesdk.ui.openPanel(PANEL_ID);
          cesdk.ui.closePanel('//ly.img.panel/assetLibrary');
        }
      }
    });
  });
}

export default registerComponents;
