# PURPOSE

## PRODUCT SUMMARY
UniSpec (App Merger Studio) is a highly specialized AI-orchestration platform designed to solve the "Multi-Variant Documentation Debt" problem. It ingests source code or technical specifications for multiple versions of an application (variants), performs hierarchical feature extraction, identifies conflicts and overlaps, and synthesizes a single, unified "Master Specification" (PRD, Architecture, and Data Model).

## PROBLEM STATEMENT
Organizations often maintain multiple forks or variants of a product (e.g., Regional versions, Legacy vs. Modern, Pro vs. Standard). Synchronizing these into a single consolidated roadmap or architecture is a manual, error-prone "archaeology" task. UniSpec automates the extraction and harmonization of intent from disparate implementations.
- **Confidence**: High (Inferred from `llmService.ts` pipeline stages: `harmonizeSpecifications` and `consolidateAllIntoMasterDoc`).

## TARGET AUDIENCE
- **Systems Architects**: To map technical overlaps between service forks.
- **Product Managers**: To reconcile PRDs from different regions into a unified product vision.
- **Security/Audit Teams**: To detect undocumented feature drifts between production variants.
- **Usage Pattern**: Highly technical "pockets" of usage; user provides repository URLs or raw specs, configures an LLM provider (Groq/OpenRouter), and monitors a multi-stage autonomous agent.
- **Confidence**: High (Based on the presence of `ArchitectureDiagrams.tsx`, `PrdContent.tsx`, and `DeveloperQAModal.tsx`).

## VALUE PROPOSITION
- **Hierarchical Extraction**: Unlike simple summarizers, UniSpec uses a 5-pass pipeline (Low-level features -> Mid-level synthesis -> High-level intent -> Spec build -> Consolidation).
- **Conflict Detection**: Explicitly identifies where variants diverge in logic or data models.
- **Autonomous Agent**: Orchestrates the analysis of multiple variants simultaneously without constant user intervention.

## CORE FEATURES

### Verified (Exists in Code)
- **Source Ingestion**: GitHub repository cloning (via API), file uploads, and manual text input.
- **Multi-Stage Pipeline**: Modular extraction of low-level specs, high-level intent, and technical architecture.
- **Comparison Engine**: Side-by-side analysis of variant specifications.
- **Consolidation**: Generation of a unified Master Document.
- **Developer QA**: An interactive chat interface specifically to query the agent about the analysis results.

### Inferred (Low/Medium Confidence)
- **Visual Mapping**: The project includes `ArchitectureDiagrams.tsx` suggesting Mermaid.js integration, though rendering logic is minimal.
- **Region Management**: `RegionInfoCard.tsx` (now deleted) suggested an initial focus on regional app variants.

### Future (Based on TODOs & Gaps)
- **Persistence**: Currently session-volatile (Memory only).
- **Security Proxying**: Current implementation exposes API keys in the client headers.
- **Advanced Export**: Placeholders for multi-format documentation export.
