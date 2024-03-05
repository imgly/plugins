import { z } from 'zod';

export const assetSchema = z.object({
  id: z.string().min(1),
  groups: z.array(z.string()).optional(),
  meta: z
    .object({
      mimeType: z.string().optional(),
      blockType: z.string().optional(),
      uri: z.string().optional(),
      thumbUri: z.string().optional(),
      previewUri: z.string().optional(),
      filename: z.string().optional(),
      vectorPath: z.string().optional(),
      width: z.coerce.number().optional(),
      height: z.coerce.number().optional(),
      duration: z.coerce.string().optional()
    })
    .optional()
});
export type Asset = z.infer<typeof assetSchema>;

export const assetDefinitionSchema = assetSchema.extend({
  label: z.string().optional(),
  tags: z.array(z.string()).optional()
});

export const assetsQueryResultSchema = z.object({
  assets: z.array(assetDefinitionSchema),
  currentPage: z.number(),
  nextPage: z.number().optional(),
  total: z.number()
});

export const assetIdSchema = z.string();
export type AssetId = z.infer<typeof assetIdSchema>;
