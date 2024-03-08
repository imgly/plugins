import { Context } from "@imgly/plugin-core";

// UTILS 
export const createDefaultBlockByType = (ctx: Context, type: string) => {
    const { block } = ctx.engine;
    switch (type) {

        case "graphic": {
            const bId = block.create("graphic");
            const sId = block.createShape("rect");
            const fId = block.createFill("//ly.img.ubq/fill/image");
            block.setShape(bId, sId);
            block.setFill(bId, fId);
            return bId;
        }
        case "page": {
            const bId = block.create("page");
            return bId;
        }
        case "text": {
            const bId = block.create("graphic");
            block.replaceText(bId, "Hello World");
            return bId;
        }
        default: throw new Error("Invalid type");
    }
};



export const createDefaultBlockByKind = (ctx: Context, kind: string) => {
    const { block } = ctx.engine;
    switch (kind) {

        case "image": {
            const bId = block.create("graphic");
            const sId = block.createShape("rect");
            const fId = block.createFill("//ly.img.ubq/fill/image");
            block.setShape(bId, sId);
            block.setFill(bId, fId);
            return bId;
        }
        case "video": {
            const bId = block.create("graphic");
            const sId = block.createShape("rect");
            const fId = block.createFill("//ly.img.ubq/fill/video");
            block.setShape(bId, sId);
            block.setFill(bId, fId);
            return bId;
        }
        case "page": {
            const bId = block.create("page");
            return bId;
        }
        case "text": {
            const bId = block.create("text");
            block.replaceText(bId, "Hello World");
            return bId;
        }
        default: throw new Error("Invalid type");
    }
};
