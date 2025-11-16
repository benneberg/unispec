
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
  extractionProgress: number; // 0: not started, 1: stage 1 done, etc.
  totalExtractionSteps: number; // 4 for file/manual, 5 for repo
}

export interface Workspace {
  id: string;
  name: string;
  variants: Variant[];
  createdAt: string;
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
