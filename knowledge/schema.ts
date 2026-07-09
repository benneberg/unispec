import { z } from "zod";

export const QualityMetricsSchema = z.object({
  confidence: z.number().min(0).max(1),
  reusePotential: z.enum(["low", "medium", "high"]),
  maturity: z.enum(["experimental", "prototype", "production"]),
  sourceCount: z.number().int().nonnegative(),
  lastUpdated: z.string(),
});

export const ImplementationSchema = z.object({
  repositoryId: z.string(),
  filePaths: z.array(z.string()),
  language: z.string(),
  notes: z.string().optional(),
});

export const ArtifactRelationshipSchema = z.object({
  targetArtifactId: z.string(),
  type: z.enum(["depends_on", "extends", "implements", "conflicts_with"]),
  description: z.string(),
});

export const KnowledgeArtifactSchema = z.object({
  id: z.string(),
  type: z.enum([
    "product", "capability", "component", "service", 
    "integration", "pattern", "decision", "experiment"
  ]),
  name: z.string(),
  purpose: z.string(),
  description: z.string(),
  metrics: QualityMetricsSchema,
  discoveredFrom: z.array(z.string()),
  implementations: z.array(ImplementationSchema),
  relationships: z.array(ArtifactRelationshipSchema),
});

// Schema for the LLM to return an array of artifacts
export const ArtifactExtractionResponseSchema = z.object({
  artifacts: z.array(KnowledgeArtifactSchema),
  reasoning: z.string().describe("Brief explanation of why these artifacts were chosen and why others were rejected based on promotion rules.")
});

export const EvolutionReportSchema = z.object({
  timestamp: z.string(),
  previousMaturity: z.enum(["experimental", "prototype", "production"]),
  newMaturity: z.enum(["experimental", "prototype", "production"]),
  notes: z.string(),
  transitionReason: z.string(),
});

export const ConsolidatedRegistryResponseSchema = z.object({
  artifacts: z.array(KnowledgeArtifactSchema),
  evolutionReports: z.array(EvolutionReportSchema),
  reasoning: z.string(),
});

export type ArtifactExtractionResponse = z.infer<typeof ArtifactExtractionResponseSchema>;
export type ConsolidatedRegistryResponse = z.infer<typeof ConsolidatedRegistryResponseSchema>;
