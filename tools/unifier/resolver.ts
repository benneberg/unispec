import { z } from "zod";
import { performApiCall } from "../../services/llmService";
import type { ApiConfig } from "../../types";
import type { ArtifactCluster, ResolutionDecision } from "./types";

// Zod schema to ensure the LLM returns strict, valid JSON matching ResolutionDecision
export const ResolutionDecisionSchema = z.object({
  winningArtifactId: z.string(),
  winningRepositoryId: z.string(),
  reasoning: z.string(),
  discardedArtifactIds: z.array(z.string()),
  requiredIntegrations: z.array(z.string()),
});

const RESOLUTION_PROMPT = `
You are a Principal Software Architect. You are given a "Cluster" of competing implementations for the same engineering concept (e.g., different Authentication systems, frontends, or database wrappers from multiple codebases).

YOUR GOAL:
Select the single best implementation to be the "Winner" for our unified project.

GRADING RUBRIC (Evaluate in this order):
1. Maturity & Quality: Prefer 'production' over 'prototype' or 'experimental'. Look at the 'confidence' and 'reusePotential' metrics.
2. Completeness & Functionality: Does the implementation have rich descriptions, more source file mappings, and clear purposes?
3. Modernization: Prefer modern framework/language integrations and clean patterns.
4. Ecosystem Fit: Will it play nicely with common architectural modules?

INPUT CLUSTER:
Concept: {conceptName}
Type: {conceptType}
Candidates:
{candidatesJson}

OUTPUT FORMAT:
You MUST respond with a valid JSON object matching this schema:
{
  "winningArtifactId": "id-of-the-winner",
  "winningRepositoryId": "repository-id-of-the-winner",
  "reasoning": "A highly professional, objective explanation of why this artifact won based on the grading rubric (maturity, reuse potential, completeness, and modernization).",
  "discardedArtifactIds": ["list-of-other-candidate-ids-in-this-cluster"],
  "requiredIntegrations": ["Any necessary follow-up integrations or bridge files needed, e.g. 'Integrate with custom DB provider'"]
}

Do not include any other conversational text or surrounding markdown wrappers. Return ONLY the JSON object.
`;

export async function resolveCluster(
  cluster: ArtifactCluster,
  apiConfig: ApiConfig
): Promise<ResolutionDecision> {
  // 1. Format the candidates for the prompt
  const candidatesJson = cluster.candidates.map(c => ({
    id: c.id,
    repoId: c.implementations[0]?.repositoryId || "unknown",
    maturity: c.metrics.maturity,
    confidence: c.metrics.confidence,
    reusePotential: c.metrics.reusePotential,
    purpose: c.purpose,
    description: c.description,
    sourceFiles: c.implementations[0]?.filePaths || []
  }));

  const prompt = RESOLUTION_PROMPT
    .replace("{conceptName}", cluster.conceptName)
    .replace("{conceptType}", cluster.artifactType)
    .replace("{candidatesJson}", JSON.stringify(candidatesJson, null, 2));

  // 2. Call the LLM (expectJson = true)
  const response = await performApiCall(prompt, apiConfig, true);

  // 3. Handle response format and parsing safely
  let jsonResponse: any;
  if (typeof response === "string") {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`LLM did not return a valid JSON block for resolving cluster ${cluster.conceptName}`);
    }
    jsonResponse = JSON.parse(jsonMatch[0]);
  } else {
    jsonResponse = response;
  }

  // 4. Validate with Zod and return
  const validatedDecision = ResolutionDecisionSchema.parse(jsonResponse);
  return validatedDecision;
}
