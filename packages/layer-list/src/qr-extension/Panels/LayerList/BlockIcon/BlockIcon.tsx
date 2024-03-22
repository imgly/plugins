import { CreativeEngine } from '@cesdk/cesdk-js';
// @ts-ignore
import ImageIcon from './icons/image.svg?react';
// @ts-ignore
import ShapeIcon from './icons/shape.svg?react';
// @ts-ignore
import StickerIcon from './icons/sticker.svg?react';
// @ts-ignore
import TextIcon from './icons/text.svg?react';
// @ts-ignore
import GroupIcon from './icons/group.svg?react';
// @ts-ignore
import FrameIcon from './icons/frame.svg?react';

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
