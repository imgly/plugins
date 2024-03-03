import { BlockAPI } from "@cesdk/cesdk-js";

export const inferBlockName = (block: BlockAPI, blockId: number) => {

    const uuid = block.getUUID(blockId);
    const name = block.getName(blockId)
    return name || uuid || blockId
}