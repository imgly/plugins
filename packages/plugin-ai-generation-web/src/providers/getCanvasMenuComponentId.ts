import { OutputKind } from '../core/provider';

function getQuickActionCanvasMenuComponentId<K extends OutputKind>(
  kind: K
): string {
  return `ly.img.ai.${kind}.canvasMenu`;
}

export default getQuickActionCanvasMenuComponentId;
