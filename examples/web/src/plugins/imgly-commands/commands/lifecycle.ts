import { type CommandsType } from "@imgly/plugin-commands-polyfill";
import CreativeEditorSDK, { BooleanOperation } from "@cesdk/cesdk-js";



export const registerLifecycleCommands = (cesdk: CreativeEditorSDK & CommandsType) => {
  const block = cesdk.engine.block;
  const commands = cesdk.engine.commands!;

  commands.registerCommand("imgly.block.lifecycle.delete", async (params: { blockIds?: number[]; }) => {
    const blockIds = params.blockIds ?? block.findAllSelected();
    blockIds.forEach((id: number) => {
      block.isValid(id) && block.destroy(id)
    });
  });

  commands.registerCommand("imgly.block.lifecycle.duplicate", async (params: { blockIds?: number[]; }) => {
    const blockIds = params.blockIds ?? block.findAllSelected();
    blockIds.forEach((id: number) => {
      block.isValid(id);
      const newBlock = block.duplicate(id);
      const parent = block.getParent(id);
      if (parent && block.isValid(parent)) {
        block.appendChild(parent, newBlock);
      }
      block.setSelected(newBlock, true);
      block.setSelected(id, false);
    });
  });

  commands.registerCommand("imgly.block.container.group", async (params: { blockIds?: number[]; }) => {
    const blockIds = params.blockIds ?? block.findAllSelected();
    const group = block.group(blockIds);
    block.setSelected(group, true);
  })


  commands.registerCommand("imgly.block.container.ungroup", async (params: { blockIds?: number[]; }) => {
    const blockIds = params.blockIds ?? block.findAllSelected();
    blockIds
    .filter((id: number) => block.isValid(id) && block.getType(id) === "//ly.img.ubq/group") 
    .forEach((bId: number) => {  
      const groupChildIds = block.getChildren(bId);
      block.ungroup(bId); // ungroup should return groupChildIds
      groupChildIds.forEach((id: number) => block.setSelected(id, true));
    })
    
  })

  {
    const combineOperations = ["Union", "Difference", "Intersection", "XOR"]
    combineOperations.forEach((operation: string) => {
      
      commands.registerCommand(`imgly.block.combine.${operation.toLowerCase()}`, async (params: { blockIds?: number[]; }) => {
        const blockIds = params.blockIds ?? block.findAllSelected();
        const newBlockId = block.combine(blockIds, operation as BooleanOperation);
        block.setSelected(newBlockId, true);
      });
    })
  }

};
