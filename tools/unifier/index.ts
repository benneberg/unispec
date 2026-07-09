import type { KnowledgeArtifact } from "../../knowledge/types";
import type { ApiConfig } from "../../types";
import { resolveCluster } from "./resolver";
import type { ArtifactCluster, ResolutionDecision, UnificationManifest } from "./types";
import { performApiCall } from "../../services/llmService";

/**
 * Optional UniSpec Tool: The Unifier
 * Takes a registry of artifacts from multiple variants and produces a unification blueprint.
 */
export async function generateUnificationManifest(
  registry: KnowledgeArtifact[],
  projectName: string,
  apiConfig: ApiConfig,
  // Optional: Specific artifact IDs the user explicitly wants to extract as standalone
  explicitExtractions: string[] = []
): Promise<UnificationManifest> {
  console.log(`[Unifier] Starting unification process for ${projectName}...`);

  if (!registry || registry.length === 0) {
    return {
      projectName,
      targetArchitecture: "Single Standalone Project",
      decisions: [],
      extractedStandaloneModules: [],
      warnings: ["Knowledge Artifact Registry is empty. Analyze some variants first."]
    };
  }

  // 1. CLUSTERING: Group artifacts by conceptual name and type
  const clusters = clusterArtifacts(registry);
  console.log(`[Unifier] Clustered ${registry.length} artifacts into ${clusters.length} distinct concepts.`);

  // 2. RESOLUTION: Pick the best candidate for each cluster
  const decisions: ResolutionDecision[] = [];

  for (const cluster of clusters) {
    if (cluster.candidates.length > 1) {
      console.log(`[Unifier] Resolving multi-candidate cluster: "${cluster.conceptName}" (${cluster.candidates.length} candidates)`);
      try {
        const decision = await resolveCluster(cluster, apiConfig);
        decisions.push(decision);
      } catch (err) {
        console.error(`[Unifier] Error resolving cluster "${cluster.conceptName}":`, err);
        // Fallback: Default to first candidate
        const winner = cluster.candidates[0];
        decisions.push({
          winningArtifactId: winner.id,
          winningRepositoryId: winner.implementations[0]?.repositoryId || "unknown",
          reasoning: `Automatic fallback to first candidate due to resolution error: ${err instanceof Error ? err.message : String(err)}`,
          discardedArtifactIds: cluster.candidates.slice(1).map(c => c.id),
          requiredIntegrations: []
        });
      }
    } else {
      // Single-candidate wins by default
      const winner = cluster.candidates[0];
      decisions.push({
        winningArtifactId: winner.id,
        winningRepositoryId: winner.implementations[0]?.repositoryId || "unknown",
        reasoning: `Only one implementation discovered for concept "${cluster.conceptName}". Selected by default.`,
        discardedArtifactIds: [],
        requiredIntegrations: []
      });
    }
  }

  // 3. STANDALONE MODULES: Handle explicit user requests to isolate components
  const extractedStandaloneModules = explicitExtractions.map(id => {
    const artifact = registry.find(a => a.id === id);
    return {
      artifactId: id,
      reason: artifact 
        ? `User explicitly requested to isolate component "${artifact.name}" as a standalone shared module.`
        : "User requested standalone module isolation."
    };
  });

  // 4. DETECT ARCHITECTURAL WARNINGS & INCOMPATIBILITIES
  const warnings = await runIncompatibilityCheck(registry, decisions, apiConfig);

  // 5. ASSEMBLE MANIFEST
  const manifest: UnificationManifest = {
    projectName,
    targetArchitecture: determineTargetArchitecture(registry, decisions),
    decisions,
    extractedStandaloneModules,
    warnings
  };

  console.log(`[Unifier] Completed manifest for ${projectName} with ${decisions.length} decisions and ${warnings.length} warnings.`);
  return manifest;
}

/**
 * Smart clustering grouping highly overlapping or identically named artifacts
 */
function clusterArtifacts(artifacts: KnowledgeArtifact[]): ArtifactCluster[] {
  const clusters: { [key: string]: KnowledgeArtifact[] } = {};

  for (const artifact of artifacts) {
    // Normalize and clean concept name
    let concept = artifact.name.toLowerCase()
      .replace(/[\-_]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Standardize highly common variations to group them together
    if (concept.includes("auth") || concept.includes("login") || concept.includes("identity") || concept.includes("signin")) {
      concept = "authentication and authorization system";
    } else if (concept.includes("db") || concept.includes("database") || concept.includes("postgres") || concept.includes("sql") || concept.includes("schema")) {
      concept = "relational database & entity state engine";
    } else if (concept.includes("api") || concept.includes("gateway") || concept.includes("routes") || concept.includes("router")) {
      concept = "api route server routing gateway";
    } else if (concept.includes("ui") || concept.includes("theme") || concept.includes("css") || concept.includes("components") || concept.includes("tailwind")) {
      concept = "design system & global ui style components";
    }

    const clusterKey = `${artifact.type}:${concept}`;
    if (!clusters[clusterKey]) {
      clusters[clusterKey] = [];
    }
    clusters[clusterKey].push(artifact);
  }

  return Object.entries(clusters).map(([clusterKey, candidates]) => {
    const [type, concept] = clusterKey.split(":");
    return {
      conceptName: concept.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      artifactType: type,
      candidates
    };
  });
}

/**
 * Heuristically determine target unified architecture structure
 */
function determineTargetArchitecture(registry: KnowledgeArtifact[], decisions: ResolutionDecision[]): string {
  const types = registry.map(a => a.type);
  const hasServices = registry.some(a => a.type === 'service' || a.type === 'integration');
  const uniqueRepos = new Set(
    decisions.map(d => d.winningRepositoryId).filter(id => id !== "unknown")
  );

  if (uniqueRepos.size > 1 && hasServices) {
    return "Microservices Portfolio (Unified Mono-Repository / Workspace)";
  }
  return "Single Integrated Full-Stack Architecture (Clean Layered Pattern)";
}

/**
 * Fast LLM incompatibility and conflict check across selected winners
 */
async function runIncompatibilityCheck(
  registry: KnowledgeArtifact[],
  decisions: ResolutionDecision[],
  apiConfig: ApiConfig
): Promise<string[]> {
  const winners = decisions.map(d => {
    const art = registry.find(a => a.id === d.winningArtifactId);
    return art ? {
      id: art.id,
      name: art.name,
      type: art.type,
      purpose: art.purpose,
      language: art.implementations[0]?.language || "unknown",
      files: art.implementations[0]?.filePaths || [],
    } : null;
  }).filter(Boolean);

  const prompt = `
  Analyze this list of winning software components selected for a unified codebase.
  Your task is to identify any architectural incompatibilities, conflicting tech stacks, mixed programming languages, database discrepancies, or structural friction.

  Winning Unified Components:
  ${JSON.stringify(winners, null, 2)}

  Provide a JSON array of warning strings. Each warning should be a direct, professional advice notice (e.g. "Mixed languages detected: some services are Python while UI components are TypeScript.").
  
  Format: Return ONLY a valid JSON array of strings:
  [
    "Warning text...",
    "Another conflict..."
  ]
  `;

  try {
    const response = await performApiCall(prompt, apiConfig, true);
    let warningsList: string[];
    if (typeof response === "string") {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      warningsList = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
    } else {
      warningsList = Array.isArray(response) ? response : [];
    }
    
    // Add default sanity warnings if list is empty
    if (warningsList.length === 0) {
      const languages = new Set(winners.map(w => w?.language).filter(l => l && l !== "unknown"));
      if (languages.size > 1) {
        warningsList.push(`Heterogeneous multi-language stack detected: ${Array.from(languages).join(", ")}. Ensure unified Docker/package structures.`);
      }
    }
    return warningsList;
  } catch (err) {
    return [`Incompatibility check failed to complete: ${err instanceof Error ? err.message : String(err)}`];
  }
}
