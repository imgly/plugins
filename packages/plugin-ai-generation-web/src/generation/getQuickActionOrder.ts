import CreativeEditorSDK, { ComponentPayload } from '@cesdk/cesdk-js';
import getQuickActionCanvasMenuComponentId from './getCanvasMenuComponentId';
import { OutputKind } from './provider';

/**
 * Returns the current order of quick actions for a particular kind.
 */
function getQuickActionOrder<K extends OutputKind>(context: {
  kind: K;
  cesdk: CreativeEditorSDK;
  payload?: ComponentPayload;
}): string[] {
  const { kind, cesdk, payload } = context;
  const canvasMenuComponentId = getQuickActionCanvasMenuComponentId(kind);

  if (payload == null || !Array.isArray(payload.children)) {
    // Fallback to get the children order from the canvas menu order.
    // Happens e.g. for CE.SDK versions < 1.53.0 because the payload
    // is not passed correctly to the render function.
    const canvasMenuOrder = cesdk.ui.getCanvasMenuOrder();
    const component = canvasMenuOrder.find(({ id }) => {
      return id === canvasMenuComponentId;
    });

    if (component != null && Array.isArray(component.children)) {
      return component.children;
    } else {
      return [];
    }
  }
  return payload.children.filter(
    (child) => typeof child === 'string'
  ) as string[];
}

export default getQuickActionOrder;
