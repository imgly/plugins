import { type WithCommands } from "@imgly/plugin-commands-polyfill";
import CreativeEditorSDK from "@cesdk/cesdk-js";

export const registerLifecycleCommands = (cesdk: WithCommands<CreativeEditorSDK>) => {
  const block = cesdk.engine.block;
  const commands = cesdk.engine.polyfill_commands;

  commands.registerCommand("lifecycle.delete", async (params: { blockIds?: number[]; }) => {
    const blockIds = params.blockIds ?? block.findAllSelected();
    blockIds.forEach((id: number) => {
      console.log("deleting block", id)
      block.isValid(id) && block.destroy(id)
    });
  });

  commands.registerCommand("lifecycle.duplicate", async (params: { blockIds?: number[]; }) => {
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

};
