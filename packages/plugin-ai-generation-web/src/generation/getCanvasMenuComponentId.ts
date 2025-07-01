import { OutputKind } from './provider';

function getQuickActionCanvasMenuComponentId<K extends OutputKind>(
  kind: K
): string {
  return `ly.img.ai.${kind}.canvasMenu`;
}

export default getQuickActionCanvasMenuComponentId;
