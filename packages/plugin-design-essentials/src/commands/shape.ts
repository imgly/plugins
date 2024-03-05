import { PluginContext } from "@imgly/plugin-core";


// each export must be a command
export const shapeSetEllipse = async (ctx: PluginContext, params: { blockIds?: number[] }) => {
    const {block} = ctx.engine;
    const {blockIds = block.findAllSelected()} = params;


    blockIds.forEach((bId: number) => {
        if (!block.hasShape(bId)) return;
        const sId = block.getShape(bId);
        block.isValid(sId) && block.destroy(sId);

        const eId = block.createShape("//ly.img.ubq/shape/ellipse");
        block.setShape(bId, eId);
    })


}