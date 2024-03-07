import * as IMGLY from "@imgly/plugin-core";

const generateItems = (ctx: IMGLY.Context) => {
  return [...generateBlockHierarchy(ctx), ...generateCommandItems(ctx), ...generateProperyItems(ctx)];
};
const generateBlockHierarchy = (ctx: IMGLY.Context) => {
  const blocks = ctx.engine.block.findAll();

  return blocks.map((bId: number) => {
    const uuid = ctx.engine.block.getUUID(bId);
    const name = ctx.engine.block.getName(bId) || uuid;
    const titel = name || uuid;
    return {
      id: `imgly.block.${uuid}`,
      icon: "ListBulletIcon",
      children: titel,
      kind: "block",
      group: "Hierarchy",
      showType: false,
      onClick: () => ctx.engine.block.select(bId)
    };
  });
};
const generateProperyItems = (ctx: IMGLY.Context) => {
  const { block } = ctx.engine;
  const bIds = block.findAllSelected();
  const bId = bIds[0];
  if (!bId) return []; // for now

  const props = bIds.flatMap((bId: number) => block.findAllProperties(bId));
  const uniqueProps = Array.from(new Set(props));

  return uniqueProps.map((p) => {
    const titel = p;
    const value = 42;

    return {
      id: `imgly.property.${p}`,
      icon: "CogIcon",
      children: titel,
      kind: "property",
      group: "Properties",
      showType: false,
      onClick: () => prompt(`Change ${p} to`, value.toString())
    };
  });
};
const generateCommandItems = (ctx: IMGLY.Context): Array<any> => {
  const cmds = ctx
    .commands!
    .listCommands();

  return cmds
    .map((cmdId: string) => {
      const titel = ctx.i18n.translate(cmdId); // this comes from the metadata
      const desc = ctx.commands.getCommandDescription(cmdId);
      if (titel === undefined) throw new Error(`No translation found for command ${cmdId}`);
      return {
        id: cmdId,
        icon: "CommandLineIcon",
        children: titel,
        kind: "command",
        group: desc?.category || "Commands",
        showType: false,
        onClick: async () => {
          await ctx.commands!.executeCommand(cmdId, {});
        }
      };
    });
};
export function registerCommandPalette(imgly: IMGLY.BaseContext<string, string>, commandPaletteButton: (params: { builder: any; }) => void, setCommandItems) {
  imgly.ui?.unstable_registerComponent("plugin.imgly.commandpalette", commandPaletteButton);

  imgly.i18n.registerTranslations({ en: { "plugin.imgly.commandpalette.label": "✨ Run .." } });
  // Canvas Menu
  const canvasMenuItems = imgly.ui?.unstable_getCanvasMenuOrder() ?? [];
  const newCanvasMenuItems = ["plugin.imgly.commandpalette", ...canvasMenuItems];
  imgly.ui?.unstable_setCanvasMenuOrder(newCanvasMenuItems);

  // Bind our react command paltte to cesdk command palettes are listen on new commands being created 
  imgly.engine.event.subscribe([], (events) => {
    events
      .forEach(_ => {
        setCommandItems(generateItems(imgly));
      });
  });


  imgly.commands.subscribe("register", (_label: string) => setCommandItems(generateItems(imgly)));
  imgly.commands.subscribe("unregister", (_label: string) => setCommandItems(generateItems(imgly)));
  setCommandItems(generateItems(imgly));
}
