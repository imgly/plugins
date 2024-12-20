export function getFeatureId(pluginId: string): string {
  return `${pluginId}.fillProcessing.feature`;
}

export function getCanvasMenuComponentIds(pluginId: string): string[] {
  return [`${pluginId}.canvasMenu`, `${pluginId}.fillProcessing.canvasMenu`];
}

export function getDockComponentIds(pluginId: string): string[] {
  return [`${pluginId}.dock`, `${pluginId}.fillProcessing.dock`];
}

export function getInspectorBarComponentIds(pluginId: string): string[] {
  return [
    `${pluginId}.inspectorBar`,
    `${pluginId}.fillProcessing.inspectorBar`
  ];
}

export function getNavigationBarComponentIds(pluginId: string): string[] {
  return [
    `${pluginId}.navigationBar`,
    `${pluginId}.fillProcessing.navigationBar`
  ];
}

export function getCanvasBarComponentIds(pluginId: string): string[] {
  return [`${pluginId}.canvasBar`, `${pluginId}.fillProcessing.canvasBar`];
}

export function getI18nCanvasMenuLabel(pluginId: string): string {
  return `plugin.${pluginId}.fillProcessing.canvasMenu.button.label`;
}

export function getI18nDockLabel(pluginId: string): string {
  return `plugin.${pluginId}.fillProcessing.dock.button.label`;
}

export function getI18nInspectorBarLabel(pluginId: string): string {
  return `plugin.${pluginId}.fillProcessing.inspectorBar.button.label`;
}

export function getI18nNavigationBarLabel(pluginId: string): string {
  return `plugin.${pluginId}.fillProcessing.navigationBar.button.label`;
}

export function getI18nCanvasBarLabel(pluginId: string): string {
  return `plugin.${pluginId}.fillProcessing.canvasBar.button.label`;
}
