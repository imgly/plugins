import CreativeEditorSDK from '@cesdk/cesdk-js';

/**
 * Registers a dock component for AI generation that opens
 * the AI generation panel and closes any other AI panels.
 */
function registerDockComponent(options: {
  cesdk: CreativeEditorSDK;
  panelId: string;
}) {
  const { cesdk, panelId } = options;
  if (panelId.startsWith('ly.img.ai/')) {
    // eslint-disable-next-line no-console
    console.warn(
      `Dock components for AI generation should open a panel with an id starting with "ly.img.ai/" – "${panelId}" was provided.`
    );
  }

  const dockComponentId = `${panelId}.dock`;
  cesdk.ui.registerComponent(dockComponentId, ({ builder }) => {
    const isOpen = cesdk.ui.isPanelOpen(panelId);

    builder.Button(`${panelId}.dock.button`, {
      label: `${panelId}.dock.label`,
      isSelected: isOpen,
      icon: '@imgly/Sparkle',
      onClick: () => {
        cesdk.ui.findAllPanels().forEach((panel) => {
          if (panel.startsWith('ly.img.ai/')) {
            cesdk.ui.closePanel(panel);
          }
          if (!isOpen && panel === '//ly.img.panel/assetLibrary') {
            cesdk.ui.closePanel(panel);
          }
        });

        if (!isOpen) {
          cesdk.ui.openPanel(panelId);
        } else {
          cesdk.ui.closePanel(panelId);
        }
      }
    });
  });
}

export default registerDockComponent;
