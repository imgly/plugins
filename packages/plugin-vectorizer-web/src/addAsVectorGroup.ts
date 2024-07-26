import CreativeEditorSDK from '@cesdk/cesdk-js';
import createVectorPathBlocks from './createVectorPathBlocks';
import { VectorPath } from './types';

function addAsVectorGroup(
  blockId: number,
  vectorPaths: VectorPath[],
  cesdk: CreativeEditorSDK
): number | void {
  const engine = cesdk.engine;

  const blockIds = createVectorPathBlocks(engine, vectorPaths);

  const origRotation = engine.block.getRotation(blockId);
  const origX = engine.block.getPositionX(blockId);
  const origY = engine.block.getPositionY(blockId);
  const origSelected = engine.block.isSelected(blockId);

  switch (engine.block.getType(blockId)) {
    case '//ly.img.ubq/page': {
      // this has been disabled
      const parentId = blockId;
      const containerId = engine.block.group(blockIds);
      engine.block.appendChild(parentId, containerId);
      const scale =
        engine.block.getFrameWidth(blockId) /
        engine.block.getFrameWidth(containerId);
      engine.block.setPositionX(containerId, origX);
      engine.block.setPositionY(containerId, origY);
      engine.block.setRotation(containerId, origRotation);
      engine.block.scale(containerId, scale);
      engine.block.setFillEnabled(parentId, false);
      engine.block.setSelected(containerId, origSelected);
      break;
    }
    case '//ly.img.ubq/graphic':
    default: {
      // replace the current block with the a new group of the vectors
      const parentId = engine.block.getParent(blockId)!;
      const containerId = engine.block.group(blockIds);
      engine.block.appendChild(parentId, containerId);
      const scale =
        engine.block.getFrameWidth(blockId) /
        engine.block.getFrameWidth(containerId);
      engine.block.setPositionX(containerId, origX);
      engine.block.setPositionY(containerId, origY);
      engine.block.setRotation(containerId, origRotation);
      engine.block.scale(containerId, scale);
      engine.block.destroy(blockId);
      engine.block.setSelected(containerId, origSelected);
      return containerId;
    }
  }
}

export default addAsVectorGroup;
