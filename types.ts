
import { type KnowledgeArtifact, type EvolutionReport } from './knowledge/types';
import { type UnificationManifest } from './tools/unifier/types';

export interface LowLevelExtraction {
  rawFeatures: string;
  modules: string;
  patterns: string;
  fileLevelSummary: string;
}

export interface MidLevelSynthesis {
  functionalGroups: string;

  subsystems: string;
}

export interface HighLevelIntent {
  designPhilosophy: string;
  architecturalApproach: string;
  dataDesignIntentions: string;
  implicitBusinessLogic: string;
  constraintsAndTradeoffs: string;
}

export interface ExtractedSpecs {
  // Final, synthesized specs
  functional?: string | object;
  architecture?: string | object;
  dataModel?: string | object;
  apiEndpoints?: string | object;
  strengths?: string[];
  weaknesses?: string[];
  notes?: string;
  // Summary of a full repository
  repositorySummary?: string;
  // Results from the analysis pipeline
  pipelineResults?: {
    lowLevel?: LowLevelExtraction;
    midLevel?: MidLevelSynthesis;
    highLevel?: HighLevelIntent;
  };
}

export interface CCCArtifacts {
  llmMd?: string | null;
  publicApi?: string | null;
  capabilities?: string | null;
  dependencyGraph?: string | null;
  typesExtracted?: string | null;
  callGraph?: string | null;
}

export interface ExtractionBundle {
  artifactId: string;
  artifactName: string;
  sourceVariant: string;
  files: { path: string; content: string; role: 'primary' | 'dependency' | 'type' }[];
  interfaceContract: string;
  installNotes: string;
}

export interface Variant {
  id: string;
  name: string;
  sourceType: 'upload' | 'github' | 'manual';
  rawContent: string;
  fileName?: string;
  repoUrl?: string;
  owner?: string;
  repo?: string;
  extractedSpecs: ExtractedSpecs | null;
  knowledgeArtifacts?: KnowledgeArtifact[];
  extractionProgress: number; // 0: not started, 1: stage 1 done, etc.
  totalExtractionSteps: number; // 4 for file/manual, 5 for repo
  tokenEstimate?: number;
  truncated?: boolean;
  hasCCC?: boolean;
  cccArtifacts?: CCCArtifacts | null;
}

export interface Workspace {
  id: string;
  name: string;
  variants: Variant[];
  knowledgeArtifacts?: KnowledgeArtifact[];
  evolutionReports?: EvolutionReport[];
  createdAt: string;
  consolidatedSpecs?: ConsolidatedDocs | null;
  unificationManifest?: UnificationManifest | null;
}

export interface ApiConfig {
  provider: 'groq' | 'openrouter';
  apiKey: string;
  model: string;
}

export interface ComparisonData {
  featureMatrix?: object | string;
  architectureDiff?: object | string;
  dataModelDiff?: object | string;
  recommendations?: object | string;
  tradeoffs?: object | string;
  raw?: string;
}

export interface ArchitectureDiagrams {
  c4?: string;
  sequence?: string;
  schema?: string;
  knowledgeHierarchical?: string;
}

export interface ImplementationBlueprint {
  folderStructure?: string;
  packageJson?: string;
  typeDefinitions?: string;
  apiSkeletons?: string;
}

export interface ValidationFinding {
  variant: string;
  area: string;
  finding: string;
  type: 'lost' | 'misrepresented' | 'confirmed';
}

export interface ValidationReport {
  summary: string;
  findings: ValidationFinding[];
}


export interface ProvenanceEntry {
  section: string;
  sourceVariant: string;
  originalFile?: string;
  justification: string;
  confidence: number; // 0.0 to 1.0
}

export interface ConsolidatedDocs {
  prd?: string;
  architecture?: string;
  modules?: string;
  dataModel?: string;
  decisions?: string;
  migration?: string;
  consolidated?: string;
  architectureDiagrams?: ArchitectureDiagrams;
  implementationBlueprint?: ImplementationBlueprint;
  validationReport?: ValidationReport;
  provenance?: ProvenanceEntry[];
}

export interface Conflict {
  area: 'Data Model' | 'API' | 'UX Flow' | 'Naming Convention' | 'Architecture' | 'Other';
  description: string;
  variantsInvolved: string[];
  recommendation: string;
}

export interface NormalizationResult {
  conflicts: Conflict[];
  harmonizedDomainModel: string;
  normalizedModules: string;
  notes: string;
}

export interface QAMessage {
  role: 'user' | 'model';
  content: string;
}
