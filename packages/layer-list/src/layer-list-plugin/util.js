import isEqual from "lodash/isEqual";
import { useCallback, useEffect, useState } from "react";

const getSelectedBlockMeta = (engine, namespace, selectedBlock) => {
  try {
    const selectedMeta = engine.block.getMetadata(selectedBlock, namespace);
    const json = JSON.parse(selectedMeta);
    return json;
  } catch (error) {}
  return {};
};
const setSelectedBlockMeta = (engine, namespace, selectedBlock, data) => {
  try {
    const json = JSON.stringify(data);
    engine.block.setMetadata(selectedBlock, namespace, json);
    return data;
  } catch (error) {}
  return {};
};

export const useSelection = ({ engine }) => {
  const [selection, setSelection] = useState(engine.block.findAllSelected());

  useEffect(
    function syncHistory() {
      const unsubscribe = engine.block.onSelectionChanged(() => {
        setSelection((selection) => {
          const newSelection = engine.block.findAllSelected();
          if (isEqual(selection, newSelection)) {
            // Do not rerender by returning the same object reference
            return selection;
          }
          return newSelection;
        });
      });
      return () => {
        unsubscribe();
      };
    },
    [engine]
  );

  return {
    selection,
  };
};

export const useSelectedBlockMeta = ({ engine, namespace }) => {
  const { selection } = useSelection({ engine });

  const getter = useCallback(() => {
    return getSelectedBlockMeta(engine, namespace, selection?.[0]);
  }, [selection, engine, namespace]);
  const [value, setValue] = useState(getter());
  const setter = useCallback(
    (data) => {
      setSelectedBlockMeta(engine, namespace, selection?.[0], data);
      setValue(getter());
    },
    [selection, engine, namespace, getter]
  );

  return [value, setter];
};
