import type CreativeEditorSDK from '@cesdk/cesdk-js';
import { PLUGIN_ICON } from './iconSprite';

function registerComponents(options: {
  cesdk: CreativeEditorSDK;
  providerId: string;
}): void {
  const { cesdk, providerId } = options;
  const dockComponentId = `${providerId}.dock`;
  const panelId = providerId;

  cesdk.ui.registerComponent(dockComponentId, ({ builder }) => {
    const isPanelOpen = cesdk.ui.isPanelOpen(panelId);

    const replaceLibraryOpen = cesdk.ui.isPanelOpen(
      '//ly.img.panel/assetLibrary.replace'
    );

    builder.Button(`${dockComponentId}.button`, {
      label: `panel.${panelId}`,
      icon: PLUGIN_ICON,
      isDisabled: replaceLibraryOpen,
      isSelected: isPanelOpen,
      onClick: () => {
        if (isPanelOpen) {
          cesdk.ui.closePanel(panelId);
        } else {
          cesdk.ui.openPanel(panelId);
          cesdk.ui.closePanel('//ly.img.panel/assetLibrary');
        }
      }
    });
  });
}

export default registerComponents;
