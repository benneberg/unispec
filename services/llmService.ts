import { type ApiConfig, type Variant, type ComparisonData, type ExtractedSpecs, type ConsolidatedDocs, type LowLevelExtraction, type MidLevelSynthesis, type HighLevelIntent, type NormalizationResult, type ValidationReport, type Workspace } from '../types';

async function performApiCall(prompt: string, apiConfig: ApiConfig, expectJson: boolean = true): Promise<any> {
  const { provider, apiKey, model } = apiConfig;

  let url: string;
  let headers: HeadersInit;
  
  const body: { [key: string]: any } = {
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 4000,
  };

  if (expectJson) {
      body.response_format = { type: "json_object" };
  }

  if (provider === 'groq') {
    url = 'https://api.groq.com/openai/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  } else { // openrouter
    url = 'https://openrouter.ai/api/v1/chat/completions';
    headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin, // Required by OpenRouter
      'X-Title': 'App Merger Studio', // Recommended by OpenRouter
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  if (expectJson) {
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error("Failed to parse JSON response:", content);
        return { raw: content }; 
      }
  } else {
    return content;
  }
}

// Pass 0: Repository Summary
export const runRepositorySummary = async (variant: Variant, apiConfig: ApiConfig): Promise<string> => {
    let files: { [key: string]: string } = {};
    try {
        files = JSON.parse(variant.rawContent);
    } catch(e) {
        console.error("Could not parse variant rawContent as JSON for repository summary.");
        return variant.rawContent; // Fallback to raw content if not a file map
    }

    const fileList = Object.keys(files).map(path => {
        const content = files[path];
        const truncatedContent = content.substring(0, 1000); 
        return `### File: ${path}\n\`\`\`\n${truncatedContent}\n\`\`\``;
    }).join('\n\n');

    const prompt = `
    Analyze the following repository structure and file contents. Provide a concise, high-level summary that captures the application's main purpose, key technologies or frameworks used, and overall architecture. This summary will be used as input for a more detailed analysis later.
    Focus on creating a holistic overview, not a file-by-file description.
    Respond with a single JSON object with one key: "summary", containing the text summary.

    Repository Content:
    ${fileList.substring(0, 20000)}
    `;

    const result = await performApiCall(prompt, apiConfig);
    return result.summary || `Failed to generate repository summary for ${variant.name}.`;
};


// Pass 1: Low-Level Extraction
export const runLowLevelExtraction = async (content: string, variant: Variant, apiConfig: ApiConfig): Promise<LowLevelExtraction> => {
    const prompt = `
    Analyze the following application code/specification. Extract raw, low-level details.
    Respond with a valid JSON object with the following keys: "rawFeatures", "modules", "patterns", "fileLevelSummary".
    
    - rawFeatures: (string) A detailed list of all user-facing features found in the code.
    - modules: (string) A list of the key files, components, or code modules.
    - patterns: (string) A list of any identified coding paradigms or architectural patterns (e.g., MVC, Singleton, Observer).
    - fileLevelSummary: (string) A brief, technical summary of the code's primary purpose.

    Application Name: ${variant.name}
    Content:
    \`\`\`
    ${content.substring(0, 10000)}
    \`\`\`
    `;
    return performApiCall(prompt, apiConfig);
};

// Pass 2: Mid-Level Synthesis
export const runMidLevelSynthesis = async (lowLevelResult: LowLevelExtraction, variant: Variant, apiConfig: ApiConfig): Promise<MidLevelSynthesis> => {
    const prompt = `
    Given the low-level analysis of an application, synthesize it into mid-level concepts.
    Respond with a valid JSON object with keys: "functionalGroups", "subsystems".

    - functionalGroups: (string) Group the raw features into logical categories or user workflows (e.g., "User Authentication", "Data Visualization", "Admin Panel").
    - subsystems: (string) Identify the major subsystems or high-level architectural components (e.g., "Frontend Client", "API Gateway", "Database Service").

    Low-Level Analysis of ${variant.name}:
    ${JSON.stringify(lowLevelResult)}
    `;
    return performApiCall(prompt, apiConfig);
};

// Pass 3: High-Level Intent Reconstruction
export const runHighLevelIntent = async (midLevelResult: MidLevelSynthesis, variant: Variant, apiConfig: ApiConfig): Promise<HighLevelIntent> => {
    const prompt = `
    From the mid-level synthesis of an application, reconstruct its high-level design intent and philosophy.
    Respond with a valid JSON object with keys: "designPhilosophy", "architecturalApproach", "dataDesignIntentions", "implicitBusinessLogic", "constraintsAndTradeoffs".

    - designPhilosophy: (string) Describe the core design goal (e.g., "User-centric and highly interactive", "Data-driven with a focus on performance").
    - architecturalApproach: (string) Define the overall architecture (e.g., "Monolithic SPA", "Micro-frontend architecture", "Server-side rendered application").
    - dataDesignIntentions: (string) Explain the purpose and structure of the data model.
    - implicitBusinessLogic: (string) Infer and describe any key business rules or logic not explicitly stated.
    - constraintsAndTradeoffs: (string) Identify any apparent technical constraints or design trade-offs made.

    Mid-Level Synthesis of ${variant.name}:
    ${JSON.stringify(midLevelResult)}
    `;
    return performApiCall(prompt, apiConfig);
};

// Pass 4: Final Specification Build
export const runFinalSpecBuild = async (pipelineResults: ExtractedSpecs['pipelineResults'], variant: Variant, apiConfig: ApiConfig): Promise<Omit<ExtractedSpecs, 'pipelineResults' | 'repositorySummary'>> => {
    const prompt = `
    Based on the complete hierarchical analysis (low, mid, and high level), generate a final, polished specification.
    Respond with a valid JSON object with the following keys: "functional", "architecture", "dataModel", "apiEndpoints", "strengths", "weaknesses", "notes".
    
    - functional: (string) A detailed, well-structured description of key features and capabilities.
    - architecture: (string) The technical structure, patterns, and frameworks used.
    - dataModel: (string) An explanation of entities, relationships, and schemas.
    - apiEndpoints: (string) A description of the API endpoints. If none, state "Not applicable".
    - strengths: (string[]) An array of key strengths.
    - weaknesses: (string[]) An array of key weaknesses.
    - notes: (string) Any other important implementation details.

    Full Analysis of ${variant.name}:
    ${JSON.stringify(pipelineResults)}
    `;
    return performApiCall(prompt, apiConfig);
};


export const compareVariants = async (variants: Variant[], apiConfig: ApiConfig): Promise<ComparisonData> => {
    const prompt = `
    Perform a meta-comparison of the following application variants based on their hierarchical analysis. 
    Focus on design philosophy, architectural approach, and key trade-offs.
    Respond with a valid JSON object with keys: "featureMatrix", "architectureDiff", "dataModelDiff", "recommendations", "tradeoffs".

    - featureMatrix: (string) A markdown table comparing key functional groups across variants.
    - architectureDiff: (string) A summary comparing the architectural approaches, patterns, and design philosophies.
    - dataModelDiff: (string) A comparison of the data design intentions and data models.
    - recommendations: (string) Actionable suggestions for merging the variants, considering their high-level intent.
    - tradeoffs: (string) A list of key trade-offs and decisions to be made for the final consolidated app.

    Variants Analysis:
    ${variants.map(v => `
    ## ${v.name}:
    ### High-Level Intent: 
    ${JSON.stringify(v.extractedSpecs?.pipelineResults?.highLevel).substring(0, 1000)}
    ### Functional Groups: 
    ${JSON.stringify(v.extractedSpecs?.pipelineResults?.midLevel?.functionalGroups).substring(0, 1000)}
    `).join('\n')}
    `;
    return performApiCall(prompt, apiConfig);
};

export const detectAndNormalize = async (variants: Variant[], comparison: ComparisonData, apiConfig: ApiConfig): Promise<NormalizationResult> => {
    const prompt = `
    As a senior system architect, your task is to analyze the provided application variants and their comparison report to identify conflicts and create a harmonized, normalized model for a new, unified application.

    Respond with a valid JSON object with the following keys: "conflicts", "harmonizedDomainModel", "normalizedModules", "notes".

    1.  **conflicts**: An array of conflict objects. For each conflict, identify:
        *   \`area\`: (enum: 'Data Model', 'API', 'UX Flow', 'Naming Convention', 'Architecture', 'Other') The category of the conflict.
        *   \`description\`: (string) A clear and concise explanation of the conflict.
        *   \`variantsInvolved\`: (string[]) An array of the names of the variants that exhibit this conflict.
        *   \`recommendation\`: (string) A specific, actionable recommendation for resolving the conflict in the unified app.

    2.  **harmonizedDomainModel**: (string) Based on your conflict analysis, describe a clean, unified domain model (entities, relationships, and key attributes) for the final application. This should be in markdown format.

    3.  **normalizedModules**: (string) Propose a high-level, normalized module or component structure for the final application. This should be in markdown format.

    4.  **notes**: (string) Any other critical observations or strategic advice for the consolidation process.

    ## Variants Summary:
    ${variants.map(v => `${v.name}: ${JSON.stringify(v.extractedSpecs).substring(0, 1500)}`).join('\n')}

    ## Comparison Analysis:
    ${JSON.stringify(comparison).substring(0, 2000)}
    `;
    return performApiCall(prompt, apiConfig);
};


export const consolidateSpecifications = async (variants: Variant[], comparison: ComparisonData, normalization: NormalizationResult, apiConfig: ApiConfig): Promise<ConsolidatedDocs> => {
    const prompt = `
    Create a consolidated master specification from the provided application variants, comparison analysis, and the crucial normalization report.
    The normalization report contains the definitive, harmonized models that MUST be used as the foundation for the new documentation.
    Generate complete documentation for each of the following sections.
    Respond with a valid JSON object with the following keys, where each key contains the content in markdown format: "prd", "architecture", "modules", "dataModel", "decisions", "migration".
    
    - prd: A full Product Requirements Document (PRD).
    - architecture: A detailed System Architecture document based on the harmonized model.
    - modules: A breakdown of the system into modules, reflecting the normalized structure.
    - dataModel: A specification for the unified data model, based on the harmonized model.
    - decisions: A log of key architectural and design decisions made, informed by the conflict resolutions.
    - migration: A high-level implementation and migration roadmap.

    ## Variants Summary:
    ${variants.map(v => `${v.name}: ${JSON.stringify(v.extractedSpecs).substring(0, 1000)}`).join('\n')}

    ## Comparison Analysis:
    ${JSON.stringify(comparison).substring(0, 1500)}
    
    ## CRITICAL: Normalization and Harmonization Report (This is the source of truth for the new design):
    ${JSON.stringify(normalization).substring(0, 2500)}
    `;
    return performApiCall(prompt, apiConfig);
};

export const generateVisualsAndBlueprint = async (docs: ConsolidatedDocs, apiConfig: ApiConfig): Promise<Pick<ConsolidatedDocs, 'architectureDiagrams' | 'implementationBlueprint'>> => {
  const prompt = `
  As a senior software architect, your task is to generate visual architecture diagrams and a practical implementation blueprint based on the provided consolidated documentation.
  Respond with a single, valid JSON object with two top-level keys: "architectureDiagrams" and "implementationBlueprint".

  1. **architectureDiagrams**: An object containing Mermaid.js syntax for the following diagrams. If a diagram is not applicable, omit the key.
      - "c4": (string) A C4 Container diagram showing the main components and their interactions.
      - "sequence": (string) A sequence diagram for a primary user flow described in the PRD.
      - "schema": (string) An Entity-Relationship Diagram (ERD) representing the harmonized data model.

  2. **implementationBlueprint**: An object containing code and structure for the new application.
      - "folderStructure": (string) A text-based tree view of the recommended folder structure.
      - "packageJson": (string) The content for a package.json file, including recommended dependencies.
      - "typeDefinitions": (string) Key TypeScript interfaces or types based on the data model.
      - "apiSkeletons": (string) Skeleton code for primary API endpoints or services.

  ## Consolidated Documentation:
  ### PRD:
  ${docs.prd?.substring(0, 2000)}

  ### System Architecture:
  ${docs.architecture?.substring(0, 2000)}

  ### Data Model:
  ${docs.dataModel?.substring(0, 2000)}
  `;

  return performApiCall(prompt, apiConfig);
};

export const runRoundTripValidation = async (docs: ConsolidatedDocs, variants: Variant[], apiConfig: ApiConfig): Promise<ValidationReport> => {
  const prompt = `
  As a meticulous QA engineer, your task is to perform a "round-trip validation" to ensure no critical requirements were lost during the consolidation of multiple application variants into a single specification.
  Compare the final consolidated documentation against the extracted specifications of the original variants.

  Respond with a valid JSON object with two keys: "summary" and "findings".

  1. **summary**: (string) A brief, high-level summary of your validation findings.
  
  2. **findings**: An array of finding objects. For each significant discrepancy or confirmation, create an object with the following structure:
     * \`variant\`: (string) The name of the original variant the finding relates to.
     * \`area\`: (string) The area of the specification (e.g., "User Authentication", "Core Feature X", "Data Model").
     * \`finding\`: (string) A clear description of what you found.
     * \`type\`: (enum: "lost", "misrepresented", "confirmed")
       - "lost": A feature/requirement from the original variant is completely missing in the final spec.
       - "misrepresented": A feature/requirement is present but its details or intent have been significantly altered.
       - "confirmed": A key feature has been successfully and accurately merged.

  ## Final Consolidated Documentation:
  ### PRD:
  ${docs.prd?.substring(0, 4000)}
  ### Architecture:
  ${docs.architecture?.substring(0, 4000)}

  ## Original Variant Specifications:
  ${variants.map(v => `
  ### Variant: ${v.name}
  ${JSON.stringify(v.extractedSpecs).substring(0, 2000)}
  `).join('\n')}
  `;

  return performApiCall(prompt, apiConfig);
};

export const runQAndA = async (
  question: string, 
  workspace: { 
    variants: Variant[], 
    comparison: ComparisonData | null, 
    normalization: NormalizationResult | null, 
    docs: ConsolidatedDocs | null 
  },
  apiConfig: ApiConfig
): Promise<string> => {
  const context = `
  You are an expert software architect AI assistant. Your task is to answer questions based *only* on the provided context about a software project. Do not invent information or provide advice beyond the scope of the context. If the answer is not in the context, state that clearly.

  ## Project Context ##

  ### Original Variants Specifications:
  ${workspace.variants.map(v => `
  #### Variant: ${v.name}
  ${JSON.stringify(v.extractedSpecs).substring(0, 1500)}
  `).join('\n')}

  ### Comparison & Normalization Report:
  ${JSON.stringify(workspace.comparison).substring(0, 1500)}
  ${JSON.stringify(workspace.normalization).substring(0, 1500)}

  ### Final Consolidated Documentation:
  ${JSON.stringify(workspace.docs).substring(0, 3000)}

  ## User's Question ##
  Based *only* on the context provided above, answer the following question:
  "${question}"
  `;

  const response = await performApiCall(context, apiConfig, false);
  return response;
};
