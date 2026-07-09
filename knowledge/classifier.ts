import { ArtifactExtractionResponseSchema, ConsolidatedRegistryResponseSchema, type ArtifactExtractionResponse } from "./schema";
import type { KnowledgeArtifact, EvolutionReport } from "./types";
import { performApiCall } from "../services/llmService";
import type { ApiConfig, Variant } from "../types";

const CLASSIFICATION_PROMPT_TEMPLATE = `
You are an expert enterprise software architect analyzing a codebase.
Your goal is to extract "Knowledge Artifacts" from the provided code context.

A Knowledge Artifact is a meaningful engineering object discovered inside a codebase. It is NOT every file/function/class. It represents something humans would discuss independently (e.g., "Authentication System", "AI Agent Engine", "Prompt Pipeline").

Artifact Types: "product", "capability", "component", "service", "integration", "pattern", "decision", "experiment".

RULES FOR PROMOTION (CRITICAL):
An artifact MUST ONLY be created if it meets ALL criteria:
1. Has a clear purpose.
2. Can be described independently.
3. Has meaningful architecture decisions.
4. Could potentially be reused.
5. Has independent evolution.

DO NOT create artifacts for: simple helper functions, temporary files, basic UI elements, internal variables.

INPUT CONTEXT:
{context}

OUTPUT FORMAT:
Return a strict JSON object matching the required schema. Ensure to output exactly valid JSON. 
Include a "reasoning" field explaining your choices and why other modules were rejected based on promotion rules.
`;

export async function classifyArtifacts(
  extractedContext: string, 
  repositoryId: string,
  apiConfig: ApiConfig
): Promise<KnowledgeArtifact[]> {
  
  const prompt = CLASSIFICATION_PROMPT_TEMPLATE.replace("{context}", extractedContext);
  
  // 1. Get raw JSON response from LLM proxy
  const parsedJson = await performApiCall(prompt, apiConfig, true);
  
  // 2. Validate and clean data using Zod
  const validatedResponse: ArtifactExtractionResponse = ArtifactExtractionResponseSchema.parse(parsedJson);

  // 3. Enrich artifacts with repository context and current date
  const enrichedArtifacts: KnowledgeArtifact[] = validatedResponse.artifacts.map(artifact => ({
    ...artifact,
    // Ensure repository ID is tracked in implementations
    implementations: (artifact.implementations || []).map(impl => ({
      ...impl,
      repositoryId: impl.repositoryId || repositoryId
    })),
    // Update metrics with current timestamp
    metrics: {
      ...artifact.metrics,
      lastUpdated: new Date().toISOString()
    }
  }));

  console.log(`[Classifier] Extracted ${enrichedArtifacts.length} artifacts. Reasoning: ${validatedResponse.reasoning}`);

  return enrichedArtifacts;
}

export function generateSpecFromArtifacts(artifacts: KnowledgeArtifact[]) {
  const products = artifacts.filter(a => a.type === "product");
  const capabilities = artifacts.filter(a => a.type === "capability");
  const components = artifacts.filter(a => a.type === "component" || a.type === "service");
  const integrations = artifacts.filter(a => a.type === "integration");
  const patterns = artifacts.filter(a => a.type === "pattern");
  const decisions = artifacts.filter(a => a.type === "decision");
  const experiments = artifacts.filter(a => a.type === "experiment");

  return {
    functional: `### Classified Products & Capabilities
${products.map(p => `#### 📦 Product: ${p.name}\n**Purpose**: ${p.purpose}\n\n${p.description}`).join('\n\n')}

${capabilities.map(c => `#### ✨ Capability: ${c.name}\n**Purpose**: ${c.purpose}\n\n${c.description}`).join('\n\n')}
`,
    architecture: `### Extracted Architectural Patterns, Decisions & Services
${patterns.map(p => `#### 🛠️ Pattern: ${p.name}\n**Description**: ${p.description}\n**Reuse Potential**: ${p.metrics.reusePotential.toUpperCase()}`).join('\n\n')}

${decisions.map(d => `#### 📌 Decision: ${d.name}\n**Explanation**: ${d.description}\n**Maturity**: ${d.metrics.maturity.toUpperCase()}`).join('\n\n')}

${components.map(c => `#### 🧩 Component/Service: ${c.name}\n**Purpose**: ${c.purpose}\n\n${c.description}`).join('\n\n')}
`,
    dataModel: `### Data Model & Entity Structure
Classified structural artifacts that model application state and data layout:

${artifacts.filter(a => a.type === "component" && (a.description.toLowerCase().includes("data") || a.description.toLowerCase().includes("database") || a.description.toLowerCase().includes("schema") || a.name.toLowerCase().includes("data") || a.name.toLowerCase().includes("db"))).map(a => `#### 💾 Entity Group: ${a.name}\n**Purpose**: ${a.purpose}\n\n${a.description}`).join('\n\n') || "No distinct database or entity layout schemas were classified as individual high-level artifacts."}
`,
    apiEndpoints: `### Active Services & Integrations
${integrations.map(i => `#### 🌐 Integration: ${i.name}\n**Details**: ${i.description}\n**Maturity**: ${i.metrics.maturity.toUpperCase()}`).join('\n\n') || "No distinct external integrations or services were classified."}
`,
    strengths: [
      `High-confidence semantic alignment across ${artifacts.length} verified artifacts.`,
      ...patterns.map(p => `Leverages robust architecture pattern: ${p.name}.`),
      ...decisions.map(d => `Documented strategic design decision: ${d.name}.`)
    ].slice(0, 5),
    weaknesses: [
      experiments.length > 0 ? `Contains experimental code or unvetted logic in: ${experiments.map(e => e.name).join(', ')}.` : "No major experimental/unvetted architecture components flagged.",
      artifacts.filter(a => a.metrics.confidence < 0.7).length > 0 ? "Some artifacts classified with sub-optimal confidence scores under v2 promotion rules." : "All classified artifacts passed rigorous confidence promotion boundaries."
    ],
    notes: `Derived purely from the Semantic Knowledge Registry. Analysis has been refined to distinguish reusable components from helper functions.`
  };
}

export async function consolidateRegistry(
  variants: Variant[],
  apiConfig: ApiConfig
): Promise<{ artifacts: KnowledgeArtifact[]; evolutionReports: EvolutionReport[] }> {
  const allArtifacts: KnowledgeArtifact[] = [];
  for (const variant of variants) {
    if (variant.knowledgeArtifacts) {
      allArtifacts.push(...variant.knowledgeArtifacts);
    }
  }

  if (allArtifacts.length === 0) {
    return { artifacts: [], evolutionReports: [] };
  }

  const prompt = `
  You are the master Knowledge Consolidation engine for UniSpec v2.
  Your task is to take a set of raw, un-deduplicated Knowledge Artifacts extracted from multiple software variants, and synthesize them into a single, clean, cohesive Knowledge Artifact Registry.

  Merge identical or highly overlapping artifacts (e.g. if Variant A has "Supabase Client Integration" as prototype, and Variant B has "PostgreSQL Database Engine" as production, merge them into a single coherent database service, incrementing "sourceCount", combining their implementation paths, and documenting the maturity transition!).
  If there is a maturity shift or a version evolution, generate an EvolutionReport tracking the previous maturity, new maturity, and the transition reasons.

  Respond with a single, valid JSON object following this schema:
  {
    "artifacts": [
      {
        "id": "unique-id-slug",
        "type": "product | capability | component | service | integration | pattern | decision | experiment",
        "name": "Human-Readable Name",
        "purpose": "1-2 sentence purpose statement",
        "description": "Detailed explanation of the consolidated artifact",
        "metrics": {
          "confidence": 0.5 to 1.0,
          "reusePotential": "low | medium | high",
          "maturity": "experimental | prototype | production",
          "sourceCount": 1,
          "lastUpdated": "ISO Timestamp string"
        },
        "discoveredFrom": ["list of variant source names"],
        "implementations": [
          {
            "repositoryId": "string id of the variant",
            "filePaths": ["file paths inside the variant"],
            "language": "typescript",
            "notes": "any implementation notes"
          }
        ],
        "relationships": [
          {
            "targetArtifactId": "id of target",
            "type": "depends_on | extends | implements | conflicts_with",
            "description": "why"
          }
        ]
      }
    ],
    "evolutionReports": [
      {
        "timestamp": "ISO Timestamp string",
        "previousMaturity": "experimental | prototype | production",
        "newMaturity": "experimental | prototype | production",
        "notes": "A description of what changed or which variant pushed it to production",
        "transitionReason": "Why the maturity level changed"
      }
    ],
    "reasoning": "Explain your merging and consolidation strategy."
  }

  Input Artifacts to Consolidate:
  ${JSON.stringify(allArtifacts, null, 2)}
  `;

  const response = await performApiCall(prompt, apiConfig);

  let jsonResponse;
  if (typeof response === "string") {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Failed to extract valid JSON from consolidation output: ${response}`);
    }
    jsonResponse = JSON.parse(jsonMatch[0]);
  } else {
    jsonResponse = response;
  }

  const validatedResponse = ConsolidatedRegistryResponseSchema.parse(jsonResponse);

  return {
    artifacts: validatedResponse.artifacts,
    evolutionReports: validatedResponse.evolutionReports,
  };
}
