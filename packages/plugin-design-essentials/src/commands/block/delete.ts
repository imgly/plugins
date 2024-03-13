import { Context } from "@imgly/plugin-core";
export const scopes = ["block"]

export default async (ctx: Context, params: { blockIds?: number[] }) => {
  const { block } = ctx.engine;
  const { blockIds = block.findAllSelected() } = params;
  blockIds.forEach((id: number) => {
      ctx.engine.block.isValid(id) && ctx.engine.block.destroy(id)
  });
}