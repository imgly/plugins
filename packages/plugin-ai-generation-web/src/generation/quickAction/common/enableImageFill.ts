import type CreativeEngine from '@cesdk/engine';

/**
 * Enable function for a single image fill block selected.
 */
function enableImageFill() {
  return ({ engine }: { engine: CreativeEngine }) => {
    const blockIds = engine.block.findAllSelected();
    if (blockIds == null || blockIds.length !== 1) return false;

    const [blockId] = blockIds;
    if (
      engine.block.getType(blockId) !== '//ly.img.ubq/graphic' &&
      !engine.block.supportsFill(blockId)
    ) {
      return false;
    }

    const fillBlock = engine.block.getFill(blockId);
    return engine.block.getType(fillBlock) === '//ly.img.ubq/fill/image';
  };
}

export default enableImageFill;
