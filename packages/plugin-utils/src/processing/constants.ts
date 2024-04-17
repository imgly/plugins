export function getFeatureId(pluginId: string): string {
  return `${pluginId}.fillProcessing.feature`;
}

export function getCanvasMenuComponentId(pluginId: string): string {
  return `${pluginId}.fillProcessing.canvasMenu`;
}

export function getI18nCanvasMenuLabel(pluginId: string): string {
  return `plugin.${pluginId}.fillProcessing.canvasMenu.button.label`;
}
