export function getFeatureId(pluginId: string): string {
  return `${pluginId}.fillProcessing.feature`;
}

export function getCanvasMenuComponentIds(pluginId: string): string[] {
  return [`${pluginId}.canvasMenu`, `${pluginId}.fillProcessing.canvasMenu`];
}

export function getDockComponentIds(pluginId: string): string[] {
  return [`${pluginId}.dock`, `${pluginId}.fillProcessing.dock`];
}

export function getI18nCanvasMenuLabel(pluginId: string): string {
  return `plugin.${pluginId}.fillProcessing.canvasMenu.button.label`;
}

export function getI18nDockLabel(pluginId: string): string {
  return `plugin.${pluginId}.fillProcessing.dock.button.label`;
}
