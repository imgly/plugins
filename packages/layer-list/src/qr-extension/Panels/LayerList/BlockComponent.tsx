import { CreativeEngine, ObjectTypeLonghand } from '@cesdk/cesdk-js';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState } from 'react';
import { BlockIcon } from './BlockIcon/BlockIcon';
// @ts-ignore
import { getBlockName } from './getBlockName';
// @ts-ignore
import ChevronDownIcon from './icons/chevron_down.svg?react';
// @ts-ignore
import ChevronRightIcon from './icons/chevron_right.svg?react';
// @ts-ignore
import EyeClosedIcon from './icons/eye_closed.svg?react';
// @ts-ignore
import EyeOpenIcon from './icons/eye_open.svg?react';
// @ts-ignore
// @ts-ignore
import clsx from 'clsx';
import PlaceholderConnectedIcon from './icons/placeholder_connected.svg?react';
import { selectBlocks } from './selectBlocks';
import { canSelect, canToggleVisibility } from './utils';

const ENABLE_VISIBILITY_TOGGLE = false;

interface BlockComponentProps {
  block: number;
  type: ObjectTypeLonghand;
  engine: CreativeEngine;
  level: number;
  childrenCount?: number;
  isExpanded?: boolean;
  onExpand?: () => void;
}

export function BlockComponent({
  block,
  type,
  engine,
  level,
  childrenCount = 0,
  isExpanded = true,
  onExpand
}: BlockComponentProps) {
  const [isVisible, setIsVisible] = useState(engine.block.isVisible(block));
  const [isSelected, setIsSelected] = useState(
    engine.block.isSelected(block) || false
  );

  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: block });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };

  const [name, setName] = useState<string>(getBlockName(engine, block));
  // subscribe to block changes:
  useEffect(() => {
    const unsubscribe = engine.event.subscribe([block], (change) => {
      if (change.every((c) => c.type === 'Updated')) {
        setIsVisible(engine.block.isVisible(block));
        setIsSelected(engine.block.isSelected(block));
        setName(getBlockName(engine, block));
      }
    });
    return () => {
      unsubscribe();
    };
  }, [block, engine]);

  const selectable = canSelect(type);

  return (
    <div
      className={clsx({
        'flex justify-between items-center text-primary-foreground py-2 hover:bg-primary-hover pr-4 cursor-move':
          true,
        'bg-primary-selected hover:bg-primary-selected': isSelected
        // if type == page and not first, add border top
      })}
      style={{
        ...style,
        paddingLeft: `${level * 16 + 8}px`
      }}
      ref={setNodeRef}
      {...attributes}
      {...listeners}
    >
      <div className={clsx('flex gap-2')}>
        {childrenCount > 0 && (
          <button
            type="button"
            onClick={onExpand}
            className={clsx(
              'flex items-center justify-center rounded-full bg-primary-contrast-1'
            )}
          >
            {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
          </button>
        )}
        {childrenCount === 0 && <div style={{ width: '24px' }} />}

        <button
          type="button"
          onClick={(e) => {
            // if cmd or ctrl is pressed, add to selection
            if (e.metaKey || e.ctrlKey) {
              engine.block.setSelected(block, !isSelected);
              engine.editor.addUndoStep();
              return;
            }

            // if shift is pressed, select all blocks in between
            selectBlocks(engine, block, e.shiftKey);
          }}
          disabled={!selectable}
          className={clsx({
            'text-primary-foreground flex gap-2 items-center': true,
            'font-bold': level === 0
          })}
        >
          <BlockIcon block={block} engine={engine} />
          {name}
        </button>
      </div>
      <div className={clsx('flex items-center gap-2')}>
        {engine.block.isPlaceholderEnabled(block) && (
          <PlaceholderConnectedIcon />
        )}
        {ENABLE_VISIBILITY_TOGGLE && (
          <button
            type="button"
            onClick={() => {
              engine.block.setVisible(block, !engine.block.isVisible(block));
              engine.editor.addUndoStep();
            }}
            disabled={!canToggleVisibility(block, engine)}
          >
            {isVisible ? <EyeOpenIcon /> : <EyeClosedIcon />}
          </button>
        )}
      </div>
    </div>
  );
}
