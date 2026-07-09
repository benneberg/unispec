# TODO

# Phase 1 — Make It Work
- [x] **[ConsolidatedDocsDisplay]** Replace `<pre>` character limiting with a Markdown renderer (e.g. `react-markdown`).  
  **Status**: Completed. Replaced `<pre>` display with a clean, fluid `react-markdown` viewer, offering safe and beautiful spec rendering.
- [x] **[llmService]** Correct `mid-level` check in `App.tsx` extraction loop to ensure it doesn't fail on missing keys.  
  **Status**: Completed. Implemented defensive object checks, initialization of `pipelineResults`, and proper validation constraints.

# Phase 2 — Make It Reliable
- [x] **[App.tsx]** Extract the Autonomous Agent State Machine into a custom `useAgent` hook.  
  **Status**: Completed. Extracted complex orchestrator logic and state transitions into a custom `/hooks/useAgent.ts` hook.
- [x] **[llmService]** Add retry logic for "Failed to parse JSON response" errors from LLMs.  
  **Status**: Completed. Implemented automatic response sanitization and retry mechanisms in `/services/llmService.ts`.

# Phase 3 — Make It Production Ready
- [x] **[Architecture]** Implement Backend proxy routes for all LLM calls to secure API keys.  
  **Status**: Completed. Created a secure backend POST endpoint `/api/llm` in `/server.ts` and updated `/services/llmService.ts` to call this proxy route, keeping API keys hidden from client-side DevTools.
- [x] **[WorkspaceContext]** Implement `localStorage` synchronization for `WorkspaceState`.  
  **Status**: Completed. Synced current portfolios and specs to local browser storage, surviving cache clears and page reloads.

# Phase 4 — Future Enhancements
- [x] **[GitHub Service]** Implement full-tree cloning via backend proxy to remove 75-file limit.  
  **Status**: Completed. Created a `/api/github/clone` backend endpoint that fetches entire trees recursively with smart file exclusions, optional token auth, and raises the retrieval threshold to 300 source files.

# Phase 5 — Semantic Knowledge Registry Upgrade (UniSpec v2)
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
