import type CreativeEditorSDK from '@cesdk/cesdk-js';
import clsx from 'clsx';
import _ from 'lodash';
import { useEffect, useState } from 'react';
import { BlockExpansionProvider } from './BlockExpansionProvider';
import { BlockTreeComponent } from './BlockTreeComponent';
import { getBlockTree } from './getBlockTree';
import { IBlockTree } from './utils';

export function LayerListPanel({ cesdk }: { cesdk: CreativeEditorSDK }) {
  const engine = cesdk.engine;
  const [blockTree, setBlockTree] = useState<IBlockTree | null>(null);

  useEffect(() => {
    const update = () => {
      // Only update the block tree if it has changed. Returns the new block tree if it has changed, otherwise returns the old block tree to prevent unnecessary re-renders.
      setBlockTree((oldTree) => {
        const scene = engine.scene.get()!;
        const newTree = getBlockTree(engine, scene);
        if (_.isEqual(oldTree, newTree)) {
          return oldTree;
        }
        return newTree;
      });
    };
    const unsubscribe = engine.event.subscribe([], () => {
      update();
    });
    const unsubscribe2 = engine.editor.onHistoryUpdated(() => {
      update();
    });
    update();
    return () => {
      unsubscribe();
      unsubscribe2();
    };
  }, [engine]);

  return (
    <div className={clsx('text-base font-sans')}>
      <BlockExpansionProvider>
        {engine && blockTree && (
          <BlockTreeComponent engine={engine} tree={blockTree} />
        )}
      </BlockExpansionProvider>
    </div>
  );
}
