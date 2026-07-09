import type { KnowledgeArtifact } from "../../knowledge/types";

// A cluster represents the same conceptual artifact found in multiple repos
export interface ArtifactCluster {
  conceptName: string; // e.g., "Authentication System"
  artifactType: string;
  candidates: KnowledgeArtifact[]; // The different implementations
}

// The decision made for a single cluster
export interface ResolutionDecision {
  winningArtifactId: string;
  winningRepositoryId: string;
  reasoning: string;
  discardedArtifactIds: string[];
  requiredIntegrations: string[]; // e.g., "Needs the DB Layer from Repo B"
}

// The final output blueprint
export interface UnificationManifest {
  projectName: string;
  targetArchitecture: string;
  decisions: ResolutionDecision[];
  extractedStandaloneModules: {
    artifactId: string;
    reason: string;
  }[];
  warnings: string[]; // e.g., "Repo A and Repo B use conflicting state management"
}
