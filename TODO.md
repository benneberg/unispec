# TODO

# Phase 1 — Make It Work
- [ ] **[ConsolidatedDocsDisplay]** Replace `<pre>` character limiting with a Markdown renderer (e.g. `react-markdown`).  
  Priority: P0  
  Impact: High  
  Effort: S  
  Evidence: `ConsolidatedDocsDisplay.tsx:62`  
  Recommendation: Install `react-markdown` and render `value` directly.  
  Confidence: High
- [ ] **[llmService]** Correct `mid-level` check in `App.tsx` extraction loop to ensure it doesn't fail on missing keys.  
  Priority: P1  
  Impact: Medium  
  Effort: S  
  Evidence: `App.tsx:185`  
  Confidence: High

# Phase 2 — Make It Reliable
- [ ] **[App.tsx]** Extract the Autonomous Agent State Machine into a custom `useAgent` hook.  
  Priority: P1  
  Impact: High  
  Effort: M  
  Evidence: `App.tsx:322` (Effect is 60+ lines with complex transitions)  
  Confidence: High
- [ ] **[llmService]** Add retry logic for "Failed to parse JSON response" errors from LLMs.  
  Priority: P2  
  Impact: Medium  
  Effort: S  
  Evidence: `llmService.ts:54`  
  Confidence: High

# Phase 3 — Make It Production Ready
- [ ] **[Architecture]** Implement Backend proxy routes for all LLM calls to secure API keys.  
  Priority: P0  
  Impact: High  
  Effort: L  
  Evidence: Entire `llmService.ts` makes client-side fetch.  
  Recommendation: Create `/api/llm` route.  
  Confidence: High
- [ ] **[WorkspaceContext]** Implement `localStorage` synchronization for `WorkspaceState`.  
  Priority: P1  
  Impact: High  
  Effort: S  
  Evidence: `WorkspaceContext.tsx:40`  
  Confidence: High

# Phase 4 — Future Enhancements
- [ ] **[GitHub Service]** Implement full-tree cloning via backend proxy to remove 75-file limit.  
  Priority: P2  
  Impact: High  
  Effort: L  
  Evidence: `App.tsx:106`  
  Confidence: Medium
