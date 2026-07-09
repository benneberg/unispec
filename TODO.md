# TODO & Validation Roadmap Tracker

This file tracks the completed core milestones of UniSpec, as well as the open validation-readiness tasks from the newly defined ROADMAP.

---

## Completed Milestones (UniSpec Core & Tools)

### Phase 1 — Make It Work
- [x] **[ConsolidatedDocsDisplay]** Replace `<pre>` character limiting with a Markdown renderer (e.g. `react-markdown`).  
  **Status**: Completed. Replaced `<pre>` display with a clean, fluid `react-markdown` viewer, offering safe and beautiful spec rendering.
- [x] **[llmService]** Correct `mid-level` check in `App.tsx` extraction loop to ensure it doesn't fail on missing keys.  
  **Status**: Completed. Implemented defensive object checks, initialization of `pipelineResults`, and proper validation constraints.

### Phase 2 — Make It Reliable
- [x] **[App.tsx]** Extract the Autonomous Agent State Machine into a custom `useAgent` hook.  
  **Status**: Completed. Extracted complex orchestrator logic and state transitions into a custom `/hooks/useAgent.ts` hook.
- [x] **[llmService]** Add retry logic for "Failed to parse JSON response" errors from LLMs.  
  **Status**: Completed. Implemented automatic response sanitization and retry mechanisms in `/services/llmService.ts`.

### Phase 3 — Make It Production Ready
- [x] **[Architecture]** Implement Backend proxy routes for all LLM calls to secure API keys.  
  **Status**: Completed. Created a secure backend POST endpoint `/api/llm` in `/server.ts` and updated `/services/llmService.ts` to call this proxy route, keeping API keys hidden from client-side DevTools.
- [x] **[WorkspaceContext]** Implement `localStorage` synchronization for `WorkspaceState`.  
  **Status**: Completed. Synced current portfolios and specs to local browser storage, surviving cache clears and page reloads.

### Phase 4 — Future Enhancements
- [x] **[GitHub Service]** Implement full-tree cloning via backend proxy to remove 75-file limit.  
  **Status**: Completed. Created a `/api/github/clone` backend endpoint that fetches entire trees recursively with smart file exclusions, optional token auth, and raises the retrieval threshold to 300 source files.

### Phase 5 — Semantic Knowledge Registry Upgrade (UniSpec v2)
- [x] **[Type System & Schemas]** Create `KnowledgeArtifact` and `EvolutionReport` structures, validating outputs with strict **Zod** schema boundary rules.  
  **Status**: Completed. Extended global interfaces and built schemas in `/knowledge/schema.ts` to block raw repository registry corruption.
- [x] **[Pipeline & Extraction]** Refactor extraction steps to add a dedicated "Pass 4: Semantic Classification" step mapping source directories to promoted artifacts.  
  **Status**: Completed. Replaced raw finalization with a structured classifier, computing quality metrics like confidence, reuse potential, and maturity level.
- [x] **[Consolidation Engine]** Implement `consolidateRegistry` to merge overlaps, deduplicate components, and log version evolution reports.  
  **Status**: Completed. Built deep consolidation logic mapping maturity drift between software variants.
- [x] **[Visual Knowledge Maps]** Add interactive Mermaid.js top-down hierarchical maps illustrating Products -> Capabilities -> Services -> Implementations.  
  **Status**: Completed. Integrated rendering and bulk ZIP export layouts in `App.tsx` and `/components/ArchitectureDiagrams.tsx`.
- [x] **[Interactive Registry Explorer UI]** Design a high-fidelity visual slate dashboard displaying promoted artifacts, metrics, and maturity shifts.  
  **Status**: Completed. Created `/components/KnowledgeRegistryDisplay.tsx` featuring multi-tab views and metrics widgets.

### Phase 6 — Optional UniSpec Unifier Tool Plugin
- [x] **[Core Architecture]** Decouple Unifier hands (unification, refactoring, manifest compilation) from UniSpec Core brain.  
  **Status**: Completed. Created isolated tool structure in `/tools/unifier/` keeping Core fast and independent.
- [x] **[Artifact Clustering Heuristics]** Implement smart concept clustering grouping highly overlapping implementations.  
  **Status**: Completed. Built rule-based semantic-aligned grouping mechanics mapping matching types and labels.
- [x] **[Architectural Grading & Resolving Matrix]** Employ Principal Architect rubric grading candidates on maturity, reuse potential, completeness, and modernization.  
  **Status**: Completed. Programmed structured LLM-resolver validating outputs against strict Zod schemas.
- [x] **[Warning & Mixed Tech Pass]** Build a post-resolution engine scanning winners for incompatible stacks, mixed languages, or conflicting DB engines.  
  **Status**: Completed. Integrated full-ecosystem compatibility checks.
- [x] **[Unifier Interface & Manifest Exporter]** Design interactive high-fidelity slate config dashboard displaying conceptual decisions, standalone isolated modules, and exportable manifest JSON blueprints.  
  **Status**: Completed. Created `/components/UnifierToolDisplay.tsx` and wired up full-state saving in active Workspace portfolio records.

---

## Open Validation Readiness Milestones (New Roadmap Tasks)

### Phase 7 — Fix the Context Exhaustion Problem
- [ ] **[Phase 1.1]** Build a deterministic, non-LLM `ContentCompressor` utility in `server.ts` with `/api/compress` endpoint to create skeletons of file maps.
- [ ] **[Phase 1.2]** Wire the compressor into `llmService.ts` for `runRepositorySummary` and `runLowLevelExtraction` calls to stay within standard token budgets.
- [ ] **[Phase 1.3]** Add a per-variant token budget display in the UI (`VariantCard.tsx`) showing estimated token cost and truncation status.

### Phase 8 — Close the Extraction Gap (Real Code Output)
- [ ] **[Phase 2.1]** Implement `filePaths` resolution to the manifest and define `ExtractionBundle` type structures.
- [ ] **[Phase 2.2]** Add `/api/extract-bundle` endpoint in `server.ts` to extract actual file content and compile LLM interface usage contracts & install notes.
- [ ] **[Phase 2.3]** Implement "Export Bundle" buttons in `UnifierToolDisplay.tsx` to generate client-side downloadable ZIP bundles using `JSZip` containing source files, contract `README.md`, and provenance references.

### Phase 9 — Add a Provenance Map to Merged Output
- [ ] **[Phase 3.1]** Extend `ConsolidatedDocs` and types with structured `ProvenanceEntry[]` tracking.
- [ ] **[Phase 3.2]** Update master consolidation prompts to emit strict JSON `provenance` arrays mapping sections back to sources.
- [ ] **[Phase 3.3]** Build an interactive "Provenance Map" visual table tab or collapsible panel in `ConsolidatedDocsDisplay.tsx`.

### Phase 10 — CCC Integration (Optional Path)
- [ ] **[Phase 4.1]** Enhance `/api/github/clone` in `server.ts` to detect `.llm-context/` directory and return CCC artifacts.
- [ ] **[Phase 4.2]** Support `cccArtifacts` and `hasCCC` properties on the client-side `Variant` type.
- [ ] **[Phase 4.3]** Wire pipeline passes in `llmService.ts` to consume pre-compiled CCC contexts directly, bypassing Pass 1 completely when available.
- [ ] **[Phase 4.4]** Show "CCC ✓" badges on `VariantCard.tsx` when pre-compiled assets are present.
- [ ] **[Phase 4.5]** Provide dynamic helper guidelines in `WorkspaceSetup.tsx` suggesting CCC pre-instrumentation for external repositories.

### Phase 11 — Validation Testing Prep
- [ ] **[Phase 5.1]** Create a Pipeline Cost Estimator modal/warning showing expected variants, estimated token counts, and API costs.
- [ ] **[Phase 5.2]** Implement per-pass failure isolation in `useAgent.ts` so that individual extraction failures degrade gracefully instead of halting the entire pipeline.
- [ ] **[Phase 5.3]** Create an "Export Full Session" tool that lets testers download the complete active workspace state as a standalone JSON file for offline auditing.
- [ ] **[Phase 5.4]** Conduct deliberate stress-testing with 3–4 contrasting validation codebases to test merging, multi-tech stacks, and size budgets.
