import { CreativeEngine } from '@cesdk/cesdk-js';
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import clsx from 'clsx';
import { BlockComponent } from './BlockComponent';
import { useBlockExpansion } from './BlockExpansionProvider';
import { EXCLUDE_BLOCKS, IBlockTree } from './utils';

export function BlockTreeComponent({
  tree,
  engine,
  level = 0
}: {
  tree: IBlockTree;
  engine: CreativeEngine;
  level?: number;
}) {
  const { blockExpansion, updateBlockExpansionKey } = useBlockExpansion();
  const isExpanded = blockExpansion.get(tree.id) !== false;
  const isExcluded = EXCLUDE_BLOCKS.includes(tree.type);

  // This allows for handling clicks onto layers. Dragging is only activated after a certain distance is reached.
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 0.01
    }
  });
  const mouseSensor = useSensor(MouseSensor);
  const touchSensor = useSensor(TouchSensor);
  const keyboardSensor = useSensor(KeyboardSensor);

  const sensors = useSensors(
    mouseSensor,
    touchSensor,
    keyboardSensor,
    pointerSensor
  );

  if (isExcluded && tree.children.length === 0) {
    return null;
  }
  // if block is excluded, only render the children
  if (isExcluded) {
    return tree.children.map((child) => (
      <BlockTreeComponent
        key={child.id}
        tree={child}
        engine={engine}
        level={level}
      />
    ));
  }

  return (
    <div
      className={clsx({
        'flex flex-col': true,
        'border-b border-b-stroke-contrast-1': level === 0
      })}
    >
      {!isExcluded && (
        <BlockComponent
          engine={engine}
          block={tree.id}
          type={tree.type}
          level={level}
          childrenCount={tree.children.length}
          isExpanded={isExpanded}
          onExpand={() => {
            updateBlockExpansionKey(tree.id, !isExpanded);
          }}
        />
      )}

      {isExpanded && (
        <DndContext
          sensors={sensors}
          onDragEnd={(e) => {
            const droppedAfterBlockId = e.over?.id as number;
            const movedBlockId = e.active.id as number;
            if (!droppedAfterBlockId) {
              return;
            }
            const parent = engine.block.getParent(droppedAfterBlockId);
            if (!parent) {
              return;
            }
            const droppedAfterBlockIndex = engine.block
              .getChildren(parent)
              .indexOf(droppedAfterBlockId);
            engine.block.insertChild(
              parent,
              movedBlockId,
              droppedAfterBlockIndex
            );
            engine.editor.addUndoStep();
          }}
        >
          <SortableContext items={tree.children.map((child) => child.id)}>
            {tree.children.map((child) => (
              <BlockTreeComponent
                key={child.id}
                tree={child}
                engine={engine}
                level={level + 1}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
