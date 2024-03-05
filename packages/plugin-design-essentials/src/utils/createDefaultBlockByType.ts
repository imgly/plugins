import { PluginContext } from "@imgly/plugin-core";

// UTILS 
export const createDefaultBlockByType = (ctx: PluginContext, type: string) => {
    const { block } = ctx.engine;
    switch (type) {

        case "graphic": {
            const bId = block.create("graphic");
            const sId = block.createShape("rect");
            const fId = block.createFill("//ly.img.ubq/fill/image");
            block.setShape(bId, sId);
            block.setFill(bId, fId);
            block.setName(bId, type.toUpperCase());
            return bId;
        }
        case "page": {
            const bId = block.create("page");
            block.setName(bId, type.toUpperCase());
            return bId;
        }
        case "text": {
            const bId = block.create("graphic");
            block.replaceText(bId, "Hello World");
            block.setName(bId, type.toUpperCase());
            return bId;
        }
        default: throw new Error("Invalid type");
    }
};
