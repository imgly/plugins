import {Context} from "@imgly/plugin-core"
import { stringCapitalize } from "@imgly/plugin-utils";
import { groupBy } from "lodash";

export const helpNameAllUnnamedBlocksToType = async (ctx: Context, params: { blockIds: number[] }) => {
    const {block} = ctx.engine;
    const {blockIds = block.findAll()} = params;

    const grouped =  groupBy(blockIds, (id: number) => block.getType(id));
    Object.keys(grouped).forEach((type: string) => {
        const ids = grouped[type];
        ids.forEach((id: number, index:number) => {
            const name = block.getName(id)
            if (name.length === 0) {
                block.setName(id, stringCapitalize(`${type.split('/').pop()} ${index}`));
            }
        });
    });
    
}