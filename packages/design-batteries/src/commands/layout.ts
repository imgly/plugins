import { PluginContext } from "@imgly/plugin-api-utils";
import { toSafeInteger } from "lodash";
import { computeMultiSelectionBounds } from "../utils/computeMultiSelectionBounds";

export const layoutHorizontally = async (ctx: PluginContext, params: { blockIds?: number[]; padding?: number; }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(), padding = 0
    } = params;

    const isGroup = (blockIds.length === 1 && block.getType(blockIds[0]) !== '//ly.img.ubq/group');
    const isMultiSelection = blockIds.length > 1;

    if (!isGroup && !isMultiSelection) {
        return;
    };

    const children = isGroup ? block.getChildren(blockIds[0]) : blockIds;
    if (children.length === 0) return;


    let curXPos = block.getPositionX(children[0]);
    let curYPos = block.getPositionY(children[0]);
    children.forEach((childId: number) => {
        block.setPositionY(childId, curYPos);
        block.setPositionX(childId, curXPos);
        const width = block.getFrameWidth(childId);
        curXPos += width;
        curXPos += padding;
    });
};

export const layoutVertically = async (ctx: PluginContext, params: { blockIds?: number[]; padding?: number; }) => {
    const { block } = ctx.engine;
    const {
        blockIds = block.findAllSelected(), padding = 0
    } = params;
    const isGroup = (blockIds.length === 1 && block.getType(blockIds[0]) !== '//ly.img.ubq/group');
    const isMultiSelection = blockIds.length > 1;

    if (!isGroup && !isMultiSelection) {
        return;
    };

    const children = isGroup ? block.getChildren(blockIds[0]) : blockIds;
    if (children.length === 0) return;

    let curXPos = block.getPositionX(children[0]);
    let curYPos = block.getPositionY(children[0]);
    children.forEach((childId: number) => {
        block.setPositionX(childId, curXPos);
        block.setPositionY(childId, curYPos);
        const height = block.getFrameHeight(childId);
        curYPos += height;
        curYPos += padding;
    });
};


export const layoutMasonry = async (ctx: PluginContext, params: { blockIds?: number[]; cols?: number; paddingX?: number; paddingY?: number; }) => {
    const { block } = ctx.engine;
    let {
        blockIds = block.findAllSelected(), paddingX = 16, paddingY = 16, cols = 2
    } = params;


    cols = toSafeInteger(prompt("Enter the number of columns", "2"));
    const isGroup = (blockIds.length === 1 && block.getType(blockIds[0]) !== '//ly.img.ubq/group');
    const isMultiSelection = blockIds.length > 1;

    if (!isGroup && !isMultiSelection) {
        return;
    };

    const children = isGroup ? block.getChildren(blockIds[0]) : blockIds;
    const groupWidth = isGroup ? block.getFrameWidth(blockIds[0]) : computeMultiSelectionBounds(ctx, blockIds).width;
    const childWidth = groupWidth / cols - paddingX;

    console.log(children);
    let rowHeights: Array<number> = [];
    for (let i = 0; i < cols; i++) {
        rowHeights.push(0);
    }

    let curXPos = block.getPositionX(children[0]);
    let curYPos = block.getPositionY(children[0]);
    children.forEach((childId: number) => {
        const w = block.getFrameWidth(childId);
        const h = block.getFrameHeight(childId);
        const aspect = h / w;
        const newWidth = childWidth;
        const newHeight = aspect * newWidth;
        block.setWidth(childId, newWidth);
        block.setHeight(childId, newHeight);
        // get column with the "lowest" height 
        const minIndex = rowHeights.indexOf(Math.min(...rowHeights));
        console.log(minIndex, rowHeights[minIndex]);
        const xPos = curXPos + minIndex * (childWidth + paddingX);
        const yPos = curYPos + rowHeights[minIndex];
        rowHeights[minIndex] += newHeight + paddingY;
        block.setPositionX(childId, xPos);
        block.setPositionY(childId, yPos);
    });
};
