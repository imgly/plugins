import { ReactNode, createContext, useContext, useState } from "react";

// Context that stores a map for each block id that associates it whether it is expanded or not
export const BlockExpansionContext = createContext<{
  blockExpansion: Map<number, boolean>;
  updateBlockExpansionKey: (key: number, value: boolean) => void;
}>({
  blockExpansion: new Map(),
  updateBlockExpansionKey: () => {},
});

// Provider that handles the expansion of the blocks
export const BlockExpansionProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [blockExpansion, setBlockExpansion] = useState<Map<number, boolean>>(
    new Map()
  );

  const updateMap = (key: number, value: boolean) => {
    setBlockExpansion((map) => new Map(map.set(key, value)));
  };

  return (
    <BlockExpansionContext.Provider
      value={{
        blockExpansion,
        updateBlockExpansionKey: updateMap,
      }}
    >
      {children}
    </BlockExpansionContext.Provider>
  );
};

export const useBlockExpansion = () => {
  const context = useContext(BlockExpansionContext);
  if (!context) {
    throw new Error(
      "useBlockExpansion must be used within a BlockExpansionProvider"
    );
  }
  return context;
};
