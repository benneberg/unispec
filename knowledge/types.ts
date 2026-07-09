export type ArtifactType =
  | "product"
  | "capability"
  | "component"
  | "service"
  | "integration"
  | "pattern"
  | "decision"
  | "experiment";

export type ReusePotential = "low" | "medium" | "high";
export type Maturity = "experimental" | "prototype" | "production";

export interface QualityMetrics {
  confidence: number; // 0.0 to 1.0
  reusePotential: ReusePotential;
  maturity: Maturity;
  sourceCount: number;
  lastUpdated: string; // ISO date string
}

export interface Implementation {
  repositoryId: string;
  filePaths: string[];
  language: string;
  notes?: string;
}

export interface ArtifactRelationship {
  targetArtifactId: string;
  type: "depends_on" | "extends" | "implements" | "conflicts_with";
  description: string;
}

export interface KnowledgeArtifact {
  id: string; // e.g., "artifact-ai-agent-orchestration"
  type: ArtifactType;
  name: string; // e.g., "AI Agent Orchestration"
  purpose: string; // 1-2 sentences
  description: string; // Detailed explanation
  metrics: QualityMetrics;
  discoveredFrom: string[]; // File paths or repo IDs
  implementations: Implementation[];
  relationships: ArtifactRelationship[];
}

export interface EvolutionReport {
  timestamp: string;
  previousMaturity: Maturity;
  newMaturity: Maturity;
  notes: string;
  transitionReason: string;
}
