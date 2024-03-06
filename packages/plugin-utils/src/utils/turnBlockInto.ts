import { PluginContext } from "@imgly/plugin-core";
import { getTransform } from "./getTransform";
import { setBlockTransform } from "./setBlockTransform";
import { createDefaultBlockByType } from "../utils/createDefaultBlockByType";

export const turnBlockInto = (ctx: PluginContext, toType: string, id: number) => {
    const { block, scene } = ctx.engine;

    const bId = createDefaultBlockByType(ctx, toType);

    if (block.hasFill(id)) {
        const fId = block.duplicate(block.getFill(id));
        block.hasFill(bId) && block.setFill(bId, fId);
    }
    if (block.hasShape(id)) {
        const sId = block.duplicate(block.getShape(id));
        block.hasShape(bId) && block.setShape(bId, sId);
    }

    setBlockTransform(ctx, bId, getTransform(ctx, id));

    if (toType === "page") {
        console.log("Turning into page");
        let pId = scene.get()!;
        const cIds = block.getChildren(pId);
        const sId = cIds.find((cId) => block.getType(cId) === "//ly.img.ubq/stack")
        const hasStack = sId !== -1
        console.log("Has stack", hasStack);
        pId = hasStack ? sId : pId;
        block.appendChild(pId, bId);
    } else {
        const pId = block.getParent(id) ?? scene.getCurrentPage() ?? scene.get()!;
        block.appendChild(pId, bId);
    }

    block.destroy(id);
};
