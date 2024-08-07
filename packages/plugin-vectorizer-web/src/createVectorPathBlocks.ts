import { CreativeEngine } from '@cesdk/cesdk-js';
import { VectorPath } from './types';

const createVectorPathBlocks = (
  engine: CreativeEngine,
  blocks: VectorPath[]
) => {
  const blockIds = blocks.map((block: any) => {
    const id = createVectorPathBlock(engine, block);

    return id;
  });

  return blockIds;
};

const createVectorPathBlock = (engine: CreativeEngine, block: VectorPath) => {
  const path = block.shape.path;
  const color = block.fill.color;
  const blockId = engine.block.create('//ly.img.ubq/graphic');
  engine.block.setKind(blockId, 'shape');
  const shape = engine.block.createShape('//ly.img.ubq/shape/vector_path');
  engine.block.setShape(blockId, shape);

  engine.block.setString(shape, 'vector_path/path', path);
  engine.block.setFloat(shape, 'vector_path/width', block.transform.width);
  engine.block.setFloat(shape, 'vector_path/height', block.transform.height);

  const fill = engine.block.createFill('color');
  engine.block.setColor(fill, 'fill/color/value', {
    r: color[0],
    g: color[1],
    b: color[2],
    a: color[3]
  });
  engine.block.setFill(blockId, fill);
  engine.block.setFloat(blockId, 'width', block.transform.width);
  engine.block.setFloat(blockId, 'height', block.transform.height);
  engine.block.setPositionX(blockId, block.transform.x);
  engine.block.setPositionY(blockId, block.transform.y);
  return blockId;
};

export default createVectorPathBlocks;
