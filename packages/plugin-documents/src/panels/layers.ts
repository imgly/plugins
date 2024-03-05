// import { PluginContext } from '@imgly/plugin-core';


// export const layerList = async (ctx: PluginContext, builder: any, params: any) => {
//     const { block } = ctx.engine;
//     const { Button, Section, Separator } = builder;
//     const blockIds = block.findAllSelected();

//     Section('layer.section', {
//         title: 'Layers',
//         children: () =>
//             blockIds.forEach((bId: number) =>
//                 Button(bId.toString(), {
//                     label: block.getName(bId) || block.getUUID(bId).toString(),
//                     onClick: () => block.select(bId)
//                 }))
//     });

// }   
