import { z } from "zod";

export const assetSourceManifestSchema = z.object({
  id: z.string(),
  name: z.object({
    en: z.string(),
  }),
  canGetGroups: z.optional(z.boolean()).default(false),
  credits: z
    .object({
      name: z.string(),
      url: z.string().optional(),
    })
    .optional(),
  license: z
    .object({
      name: z.string(),
      url: z.string().optional(),
    })
    .optional(),
  canAddAsset: z.optional(z.boolean()).default(false),
  canRemoveAsset: z.boolean().default(false),
  supportedMimeTypes: z
    .union([z.array(z.string()), z.undefined()])
    .optional()
    .default([]),
});

export type AssetSourceManifest = z.input<typeof assetSourceManifestSchema>;
