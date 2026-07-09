# UniSpec — Validation Readiness Roadmap

**Goal:** Get UniSpec stable enough to run 3–4 real codebases through it and produce
meaningful, auditable output. Not feature-complete — validation-ready.

Each phase is independent and additive. Phases 1–3 are required before testing.
Phases 4–5 are high-value but can run in parallel with testing.

---

## Phase 1 — Fix the Context Exhaustion Problem
**Priority: CRITICAL. The pipeline will silently fail on real repos without this.**

The current pipeline sends raw source through `substring()` cuts at arbitrary byte
offsets. This produces truncated mid-sentence content, causes JSON parse failures
downstream, and gives the LLM incomplete signal to reason from.

### 1.1 — Build a `ContentCompressor` utility in `server.ts`

Add a new backend endpoint `/api/compress` that accepts a file map (the same
`Record<string, string>` the GitHub clone endpoint returns) and produces a
compressed IR before any LLM call happens.

The compressor should do this deterministically — no LLM involved:

```typescript
// server.ts — add this endpoint
app.post('/api/compress', (req, res) => {
  const { files }: { files: Record<string, string> } = req.body;
  const compressed = compressFileMap(files);
  res.json(compressed);
});

interface CompressedVariant {
  skeleton: string;       // signatures, exports, types only — no bodies
  fileIndex: string[];    // list of all files with line counts
  tokenEstimate: number;  // rough char/4 estimate
  truncated: boolean;
}

function compressFileMap(files: Record<string, string>): CompressedVariant {
  const lines: string[] = [];
  let totalChars = 0;
  const TOKEN_BUDGET = 60000; // ~15k tokens of skeleton content per variant

  for (const [filePath, content] of Object.entries(files)) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    
    // Skip non-source files entirely
    if (!['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'cs'].includes(ext || '')) continue;
    
    const skeleton = extractSkeleton(content, ext || '');
    if (!skeleton.trim()) continue;
    
    const entry = `\n### ${filePath}\n${skeleton}`;
    if (totalChars + entry.length > TOKEN_BUDGET) {
      lines.push(`\n### [BUDGET EXCEEDED — ${Object.keys(files).length} total files, showing skeleton only]`);
      break;
    }
    lines.push(entry);
    totalChars += entry.length;
  }

  return {
    skeleton: lines.join('\n'),
    fileIndex: Object.keys(files),
    tokenEstimate: Math.round(totalChars / 4),
    truncated: totalChars >= TOKEN_BUDGET,
  };
}

function extractSkeleton(content: string, ext: string): string {
  const lines = content.split('\n');
  const keep: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Keep: imports, exports, function/class signatures, type declarations, comments
    if (
      trimmed.startsWith('import ') ||
      trimmed.startsWith('export ') ||
      trimmed.startsWith('interface ') ||
      trimmed.startsWith('type ') ||
      trimmed.startsWith('class ') ||
      trimmed.startsWith('function ') ||
      trimmed.startsWith('async function ') ||
      trimmed.startsWith('const ') && trimmed.includes('=>') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/*') ||
      trimmed.startsWith('*') ||
      trimmed.startsWith('def ') ||      // Python
      trimmed.startsWith('fn ') ||       // Rust
      trimmed.startsWith('func ') ||     // Go
      trimmed.startsWith('@')            // Decorators
    ) {
      keep.push(line);
    }
  }
  return keep.join('\n');
}
```

### 1.2 — Wire the compressor into `llmService.ts`

Replace the raw content passing in `runRepositorySummary` and `runLowLevelExtraction`
with compressed skeletons. The raw content is only needed for Pass 0 (repo summary) and
Pass 1 (low-level). Passes 2–4 operate on previous pass output, so they are unaffected.

```typescript
// In llmService.ts — runRepositorySummary
// BEFORE:
const fileList = Object.keys(files).map(path => {
  const truncatedContent = content.substring(0, 1000);
  return `### File: ${path}\n\`\`\`\n${truncatedContent}\n\`\`\`;
}).join('\n\n');
const prompt = `... ${fileList.substring(0, 20000)} ...`;

// AFTER: call /api/compress first, then use compressed.skeleton
const compressRes = await fetch('/api/compress', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ files }),
});
const compressed = await compressRes.json();
// compressed.skeleton is already token-budget-safe — use it directly
const prompt = `... ${compressed.skeleton} ...`;
```

### 1.3 — Add a per-variant token budget display in the UI

In `VariantCard.tsx`, after GitHub clone completes, show:
- Estimated token cost (from `compressed.tokenEstimate`)
- Whether the variant was truncated
- File count

This lets you immediately see before running the pipeline whether a codebase is
going to be a problem.

---

## Phase 2 — Close the Extraction Gap (Real Code Output)
**Priority: HIGH. Right now extraction gives you names, not portable code.**

The `UnificationManifest` correctly identifies *which* artifact wins and *why*, but
`extractedStandaloneModules` only stores `{ artifactId, reason }`. There is no
actual file output — no folder, no bundled code, no interface contract.

### 2.1 — Add `filePaths` resolution to the manifest

The `KnowledgeArtifact` already has `implementations[].filePaths`. The Unifier
needs to use these to produce an actual extraction bundle.

Add a new type to `tools/unifier/types.ts`:

```typescript
export interface ExtractionBundle {
  artifactId: string;
  artifactName: string;
  sourceVariant: string;
  files: {
    path: string;
    content: string;   // actual source content
    role: 'primary' | 'dependency' | 'type';
  }[];
  interfaceContract: string;  // LLM-generated usage contract
  installNotes: string;       // what needs to change to use this standalone
}
```

### 2.2 — Add `/api/extract-bundle` endpoint to `server.ts`

```typescript
app.post('/api/extract-bundle', async (req, res) => {
  const { artifact, variantFiles, apiConfig } = req.body;
  // artifact: KnowledgeArtifact
  // variantFiles: Record<string, string> — the full file map for the source variant
  // apiConfig: for the interface contract LLM call

  const bundle: ExtractionBundle = {
    artifactId: artifact.id,
    artifactName: artifact.name,
    sourceVariant: artifact.implementations[0]?.repositoryId || 'unknown',
    files: [],
    interfaceContract: '',
    installNotes: '',
  };

  // Pull the actual file contents for declared filePaths
  for (const impl of artifact.implementations) {
    for (const filePath of impl.filePaths || []) {
      const content = variantFiles[filePath];
      if (content) {
        bundle.files.push({ path: filePath, content, role: 'primary' });
      }
    }
  }

  // LLM pass: generate interface contract + install notes
  const contractPrompt = `
You are extracting a standalone module from a larger codebase.
Artifact: ${artifact.name}
Purpose: ${artifact.purpose}
Files included:
${bundle.files.map(f => `### ${f.path}\n${f.content.substring(0, 800)}`).join('\n\n')}

Generate:
1. An interface contract (how to consume this module in another project — exports, required config, expected inputs/outputs)
2. Install notes (what dependencies, env vars, or setup steps are needed)

Respond as JSON: { "interfaceContract": "...", "installNotes": "..." }
  `;
  const contractResult = await performApiCallServer(contractPrompt, apiConfig);
  bundle.interfaceContract = contractResult.interfaceContract || '';
  bundle.installNotes = contractResult.installNotes || '';

  res.json(bundle);
});
```

### 2.3 — Add an "Export Bundle" button in `UnifierToolDisplay.tsx`

For each `extractedStandaloneModule` in the manifest, show an "Export Bundle" button
that calls `/api/extract-bundle` and downloads a ZIP containing:
- The actual source files
- A `README.md` with the interface contract and install notes
- A `PROVENANCE.md` recording which variant/repo this came from

Use `JSZip` (already likely available or add it) to build the ZIP client-side from
the server response.

---

## Phase 3 — Add a Provenance Map to Merged Output
**Priority: HIGH. Without this, the consolidated spec is unauditable.**

Currently `ConsolidatedDocs` contains spec text with no record of which variant
each section came from. When you later look at the output you cannot answer
"why did it decide this?" or override a specific decision.

### 3.1 — Add provenance tracking to `ConsolidatedDocs`

In `types.ts`, extend `ConsolidatedDocs`:

```typescript
export interface ProvenanceEntry {
  section: string;        // e.g. "Authentication Architecture"
  sourceVariant: string;  // variant name
  artifactId?: string;    // if traceable to a KnowledgeArtifact
  confidence: number;     // 0-1, from artifact metrics if available
  reasoning: string;      // why this source was chosen
}

export interface ConsolidatedDocs {
  // ... existing fields ...
  provenance?: ProvenanceEntry[];  // ADD THIS
}
```

### 3.2 — Instruct the consolidation LLM to emit provenance

In `llmService.ts`, in the consolidation prompt (look for `consolidateAllIntoMasterDoc`
or similar), add a `provenance` key to the expected JSON output:

```
Also return a "provenance" array. Each entry must have:
- section: the section name this decision covers
- sourceVariant: which variant this came from
- reasoning: why this variant's approach was preferred
- confidence: a 0.0–1.0 score for how confident you are in this choice
```

### 3.3 — Display provenance in `ConsolidatedDocsDisplay.tsx`

Add a "Provenance" tab or collapsible panel showing the provenance table:
`Section | Source Variant | Confidence | Reasoning`. This is the audit trail
that makes the merged output trustworthy.

---

## Phase 4 — CCC Integration (Optional Path, High Value)
**Priority: MEDIUM for validation testing. Treat as a preferred ingestion path.**

CCC solves the same pre-compression problem as Phase 1, but more thoroughly and
with richer artifacts (call graph, symbol index, type graph). The integration makes
Phase 1 optional if CCC artifacts are present.

### 4.1 — Detect CCC artifacts on GitHub clone

In `server.ts`, after the GitHub clone completes, check if `.llm-context/` exists
in the fetched file map:

```typescript
// After clone succeeds, check for CCC artifacts
const hasCCC = Object.keys(fileContents).some(p => p.startsWith('.llm-context/'));

if (hasCCC) {
  // Extract the CCC artifacts into a structured object
  const cccArtifacts = {
    llmMd: fileContents['.llm-context/LLM.md'] || null,
    publicApi: fileContents['.llm-context/public-api.txt'] || null,
    capabilities: fileContents['.llm-context/capabilities.json'] || null,
    dependencyGraph: fileContents['.llm-context/dependency-graph.md'] || null,
    typesExtracted: fileContents['.llm-context/types-extracted.ts'] || null,
    callGraph: fileContents['.llm-context/call-graph.json'] || null,
  };
  // Return these alongside the file map
  res.json({ ..., cccArtifacts, hasCCC: true });
} else {
  res.json({ ..., hasCCC: false });
}
```

### 4.2 — Add `cccArtifacts` to the `Variant` type

```typescript
// types.ts
export interface CCCArtifacts {
  llmMd?: string;
  publicApi?: string;
  capabilities?: string;
  dependencyGraph?: string;
  typesExtracted?: string;
  callGraph?: string;
}

export interface Variant {
  // ... existing fields ...
  cccArtifacts?: CCCArtifacts;
  hasCCC?: boolean;
}
```

### 4.3 — Use CCC artifacts as pipeline input when present

In `llmService.ts`, in `runRepositorySummary` and `runLowLevelExtraction`, add a
branch at the top:

```typescript
export const runRepositorySummary = async (variant: Variant, apiConfig: ApiConfig) => {
  // Preferred path: CCC artifacts exist
  if (variant.hasCCC && variant.cccArtifacts?.llmMd) {
    const cccContext = [
      variant.cccArtifacts.llmMd,
      variant.cccArtifacts.publicApi || '',
      variant.cccArtifacts.capabilities || '',
    ].join('\n\n---\n\n');

    const prompt = `
Analyze this pre-compiled context for a codebase (generated by CCC — Code Context Compiler).
Provide a concise high-level summary of the application's purpose, key technologies, and architecture.
Respond as JSON: { "summary": "..." }

CCC Context:
${cccContext.substring(0, 15000)}
    `;
    const result = await performApiCall(prompt, apiConfig);
    return result.summary || 'Failed to generate summary from CCC artifacts.';
  }

  // Fallback path: raw files (use compressor from Phase 1)
  // ... existing logic with compressor ...
};
```

Do the same for `runLowLevelExtraction` — map CCC artifact fields to the
`LowLevelExtraction` shape directly, skipping the LLM call entirely where possible:

```typescript
if (variant.hasCCC && variant.cccArtifacts) {
  // CCC already did the low-level extraction deterministically
  return {
    rawFeatures: variant.cccArtifacts.publicApi || '',
    modules: variant.cccArtifacts.capabilities || '',
    patterns: variant.cccArtifacts.dependencyGraph || '',
    fileLevelSummary: variant.cccArtifacts.llmMd || '',
  };
}
```

This skips Pass 1's LLM call entirely for CCC-instrumented repos — faster, cheaper,
more accurate.

### 4.4 — Show a CCC badge in `VariantCard.tsx`

When `variant.hasCCC === true`, show a small "CCC ✓" badge on the variant card.
This immediately tells you during testing which variants have richer input and helps
interpret output quality differences.

### 4.5 — Add a "Run CCC first" tip in `WorkspaceSetup.tsx`

When a user adds a GitHub URL, check if the repo has `.llm-context/` in its tree
(quick check via GitHub API before full clone). If not, show a callout:

> "For better analysis quality, run `ccc` in this repo first and push the
> `.llm-context/` directory. UniSpec will automatically use it."

---

## Phase 5 — Validation Testing Prep
**Do this before running your 3–4 codebases.**

### 5.1 — Add a pipeline cost estimator before run

Before the agent starts, show a modal or inline warning with:
- N variants × estimated token cost each
- Estimated LLM API calls (currently: 5 passes × N variants + comparison + consolidation)
- Estimated total tokens
- Estimated cost at Groq/OpenRouter rates

This prevents surprise rate limit hits mid-pipeline.

### 5.2 — Add per-pass failure isolation

Currently if Pass 2 fails on variant 3, the whole pipeline errors. Change the
agent in `useAgent.ts` to continue with degraded data:

```typescript
// In extractSpecs, wrap each pass:
try {
  lowLevel = await runLowLevelExtraction(content, variant, apiConfig);
} catch (e) {
  lowLevel = { rawFeatures: '[Pass failed]', modules: '', patterns: '', fileLevelSummary: '' };
  dispatch({ type: 'ADD_AGENT_LOG', payload: `WARN: Low-level pass failed for ${variant.name}, continuing with degraded data` });
}
```

You want the pipeline to complete with partial data so you can see *where* it breaks,
not just get an error state that tells you nothing.

### 5.3 — Export a full analysis session as JSON

Add an "Export Session" button that downloads the complete workspace state as a
single JSON file:

```json
{
  "exportedAt": "ISO timestamp",
  "workspace": { ... },
  "variants": [ { name, extractedSpecs, knowledgeArtifacts } ],
  "comparisonData": { ... },
  "normalizationResult": { ... },
  "consolidatedDocs": { ... },
  "unificationManifest": { ... },
  "agentLog": [ ... ]
}
```

This is essential for validation testing — you can export, analyze what happened,
adjust prompts, and re-import without re-running everything.

### 5.4 — Choose your 3–4 validation codebases deliberately

Pick codebases that stress different parts of the pipeline:

| Codebase | What it tests |
|---|---|
| Two versions of the same project (e.g. v1 and v2 of one of your tools) | Core merge logic — should produce clean diffs |
| Two projects in the same domain but different tech stacks | Conflict detection and incompatibility warnings |
| One CCC-instrumented repo + one raw repo | CCC integration quality delta |
| A large repo (200+ files) | Context budget handling under pressure |

Run each pair through the pipeline, export the session JSON, and evaluate:
- Did the provenance map make sense?
- Did the Unifier pick the right winner for each cluster?
- Did the extraction bundles contain the right files?
- Where did the pipeline degrade or hallucinate?

---

## Implementation Order

```
Week 1
  Phase 1.1 — ContentCompressor in server.ts         (2–3h)
  Phase 1.2 — Wire compressor into llmService.ts     (1h)
  Phase 1.3 — Token budget display in VariantCard    (1h)

Week 1–2
  Phase 3.1 — ProvenanceEntry type                   (30min)
  Phase 3.2 — Provenance in consolidation prompt     (1h)
  Phase 3.3 — Provenance display in UI               (2h)

Week 2
  Phase 2.1 — ExtractionBundle type                  (30min)
  Phase 2.2 — /api/extract-bundle endpoint           (2h)
  Phase 2.3 — Export Bundle button + ZIP download    (2h)

Week 2–3
  Phase 5.1 — Cost estimator                         (1h)
  Phase 5.2 — Per-pass failure isolation             (1h)
  Phase 5.3 — Export session as JSON                 (1h)

Week 3 (if CCC repos available)
  Phase 4.1–4.5 — CCC integration                   (3–4h)

Week 3–4
  Validation runs on chosen codebases
  Document findings, adjust prompts, iterate
```

---

## What You Are NOT Building Yet

These are intentionally out of scope for validation readiness:

- Semantic/embedding search across artifacts
- Real-time collaboration or shared workspaces  
- VSCode extension or MCP server
- Java/Swift extractor support
- Database persistence (localStorage is fine for validation)
- Auth or multi-user support

Get the pipeline validated first. Then decide what to build.

---

## Definition of "Validation Ready"

UniSpec is ready for real-codebase testing when:

1. The pipeline completes on a 200-file repo without context exhaustion or silent truncation
2. The consolidated output has a readable provenance map (you can trace every section to a source)
3. The Unifier produces at least one downloadable extraction bundle with actual code in it
4. A failed pass degrades gracefully instead of halting the whole pipeline
5. You can export the full session as JSON for offline analysis

When all five are true, run your codebases and let the output tell you what to fix next.
