import { z } from 'zod';

export const supportedExtensionSchema = z.enum(['.pdf', '.docx', '.md', '.txt']);

export const ementaMetadataSchema = z.object({
  filename: z.string(),
  format: supportedExtensionSchema,
  size: z.number().int().nonnegative(),
  modifiedAt: z.string().datetime(),
});

export const ementaAnalysisSchema = z.object({
  courseName: z.string().nullable(),
  workload: z.string().nullable(),
  objectives: z.array(z.string()),
  topics: z.array(z.string()),
  bibliography: z.array(z.string()),
  summary: z.string().min(1),
});

export const ementaDetailsSchema = ementaMetadataSchema.extend({
  text: z.string(),
  analysis: ementaAnalysisSchema,
});

export const ementaListItemSchema = ementaMetadataSchema.extend({
  summary: z.string().optional(),
  error: z.string().optional(),
});

export const listEmentasOutputSchema = z.object({
  ementas: z.array(ementaListItemSchema),
});

export const getEmentaInputSchema = z.object({
  filename: z.string().min(1).max(255),
});

export type EmentaMetadata = z.infer<typeof ementaMetadataSchema>;
export type EmentaAnalysis = z.infer<typeof ementaAnalysisSchema>;
export type EmentaDetails = z.infer<typeof ementaDetailsSchema>;
export type EmentaListItem = z.infer<typeof ementaListItemSchema>;
