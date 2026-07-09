# ARCHITECTURE

## HIGH-LEVEL ARCHITECTURE
UniSpec is built as a **Full-Stack Application** utilizing a React frontend styled with Tailwind CSS (featuring a premium corporate mobile-first layout) and powered by an **Express (Node.js)** backend server. This architecture ensures high performance, client-side rate limit relief, and enhanced security for API key operations.

## COMPONENT BREAKDOWN
- **Frontend View Layer**: React 19 + Tailwind CSS + Lucide Icons. Layout designed under a high-contrast corporate theme.
- **State Management**: `WorkspaceContext` (React Context API + `useReducer`) with **LocalStorage Synchronization** to persist workspace portfolios across browser sessions.
- **Service Layer**:
    - `llmService.ts`: Core logic for prompt engineering and LLM orchestration, proxying all external requests through the Express backend `/api/llm` endpoint.
    - `server.ts`: Node.js Express server acting as a middleware and proxy endpoint for LLM completion requests and GitHub cloning.
- **Autonomous Agent**: Orchestrated using a custom `useAgent` hook that manages the transitions through `AgentStatus` states (`idle`, `extracting`, `comparing`, `normalizing`, `consolidating`).

## DATA FLOW
1. **Input**: User adds a `Variant` (Name + Raw Source) via file upload, manual payload, or secure GitHub cloning.
2. **GitHub Ingress**: The backend `/api/github/clone` recursively fetches the tree, handles rate limits gracefully (utilizing optional `GITHUB_TOKEN` credentials on the server), applies file classifications, and streams content back to the client.
3. **Extraction & Semantic Classification Stage (UniSpec v2 Pipeline)**:
    - **Pass 1 (Low-level)**: Features, components, and UI layout extraction.
    - **Pass 2 (Mid-level)**: Local states, business logic, and page navigation flows.
    - **Pass 3 (High-level)**: Architecture design patterns, data models, and strategic intent.
    - **Pass 4 (Semantic Classification)**: Promotes code blocks to discrete **Knowledge Artifacts** with assigned quality metrics (confidence, reuse potential, maturity level) validated using rigorous **Zod Schemas** in `/knowledge/schema.ts` to block raw registry corruption.
4. **Comparison & Consolidation Stage**: Aggregates extracted artifacts into the master `consolidateRegistry` engine, merging identical/overlapping components across variants, incrementing source counts, mapping dependencies, and generating a **Maturity Evolution Report** tracking the maturity drift.
5. **Resolution Stage**: A "Normalizer" pass handles conflict resolution and specs harmonization.
6. **Synthesis Stage**: Generates the final "Master Specification" dynamically synthesized from the structured Knowledge Artifact Registry.
7. **Storage**: Current Portfolios, consolidated specifications, knowledge registries, and evolution timelines are synchronized and persisted in `localStorage`.

## EXTERNAL INTEGRATIONS
- **GitHub Proxy Service**: Recursive file tree discovery and server-side parallel fetching with a 300-file threshold.
- **Secure LLM Proxy Service**: Requests are proxied via `/api/llm` to OpenRouter or Groq, keeping keys safe.
- **Mermaid.js**: Visually renders diagrams of specifications dynamically.

## DEPLOYMENT MODEL
- **Framework**: Vite handles the frontend build pipeline, producing static assets in `dist/`.
- **Backend Build**: `esbuild` bundles `server.ts` into a standalone, optimized CommonJS `dist/server.cjs` file.
- **Runtime**: Runs on Node.js using `npm start`, ideal for modern container hosting such as Google Cloud Run.

## OBSERVABILITY MODEL
- **Status Logging**: An `agentLog` array captures real-time orchestration timestamps and pipeline status.
- **Console Output**: A premium responsive dashboard showing real-time feedback and execution traces.
