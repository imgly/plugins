import type CreativeEngine from '@cesdk/engine';

/**
 * Enable function for a single image fill block selected.
 */
function enableImageFill() {
  return ({ engine }: { engine: CreativeEngine }) => {
    const blockIds = engine.block.findAllSelected();
    if (blockIds == null || blockIds.length !== 1) return false;

    const [blockId] = blockIds;

    if (!engine.block.supportsFill(blockId)) return false;

    if (
      !['//ly.img.ubq/graphic', '//ly.img.ubq/page'].includes(
        engine.block.getType(blockId)
      )
    ) {
      return false;
    }

    const fillBlock = engine.block.getFill(blockId);
    return engine.block.getType(fillBlock) === '//ly.img.ubq/fill/image';
  };
}

export default enableImageFill;
