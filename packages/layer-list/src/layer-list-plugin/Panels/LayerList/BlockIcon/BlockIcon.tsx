import { CreativeEngine } from '@cesdk/cesdk-js';
import FrameIcon from './icons/frame.svg?react';
import GroupIcon from './icons/group.svg?react';
import ImageIcon from './icons/image.svg?react';
import ShapeIcon from './icons/shape.svg?react';
import StickerIcon from './icons/sticker.svg?react';
import TextIcon from './icons/text.svg?react';

// Renders the block icon based on it's type
export function BlockIcon({
  block,
  engine
}: {
  block: number;
  engine: CreativeEngine;
}) {
  const blockKind = engine.block.getKind(block);
  switch (blockKind) {
    case 'image':
      return <ImageIcon />;
    case 'text':
      return <TextIcon />;
    case 'shape':
      return <ShapeIcon />;
    case 'sticker':
      return <StickerIcon />;
    case 'group':
      return <GroupIcon />;
    case 'page':
      return <FrameIcon />;

    default:
      return null;
  }
}
