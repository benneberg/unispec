# ARCHITECTURE

## HIGH-LEVEL ARCHITECTURE
UniSpec is built as a **Client-Side Heavy SPA (Single Page Application)** using React. It leverages an autonomous agent pattern where the frontend manages long-running "Analysis Pipelines" by orchestrating sequential calls to Large Language Models (LLMs).

## COMPONENT BREAKDOWN
- **View Layer**: React + Tailwind CSS.
- **State Management**: `WorkspaceContext` (React Context API + `useReducer`). Handles the lifecycle of "Variants", "Agent Logs", and "Final Docs".
- **Service Layer**:
    - `llmService.ts`: Core logic for prompt engineering and LLM orchestration.
    - `geminiService.ts`: (Orphaned/Legacy) Google Generative AI integration.
- **Autonomous Agent**: Managed via `useEffect` hooks in `App.tsx` that transition through `AgentStatus` states (`idle`, `extracting`, `comparing`, `normalizing`, `consolidating`).

## DATA FLOW
1. **Input**: User adds a `Variant` (Name + Raw Source).
2. **Extraction Stage**: Parallel `extraction` passes for each variant.
    - Low-level (Features/UI) -> Mid-level (Logic/Flow) -> High-level (Architecture/Intent).
3. **Comparison Stage**: Aggregates extracted specs into a "Comparison Prompt" to identify deltas.
4. **Resolution Stage**: A "Normalizer" pass handles conflict resolution.
5. **Synthesis Stage**: Generates the final "Master Specification".
- **Source of Truth**: Volatile memory (`WorkspaceState`). No persistence (LocalStorage/DB) is currently implemented.

## EXTERNAL INTEGRATIONS
- **GitHub API**: Used for recursive file tree discovery and content fetching (`atob` decoding).
- **LLM Providers**: Direct browser-to-API calls (Groq / OpenRouter / OpenAI compatible).
- **Mermaid.js**: (Injected via CDN in `index.html`) for diagram rendering.

## DEPLOYMENT MODEL
- **Platform**: Hosted via Vite (Static assets).
- **Infrastructure**: Designed for serverless deployment (Cloud Run / Vercel), but currently lacks a production-ready backend for secret management.

## OBSERVABILITY MODEL
- **Status Logging**: An `agentLog` array in the state captures timestamps and pipeline transitions.
- **Progress Tracking**: Percentages are calculated based on pipeline stages (e.g., 5 stages = 20% increments).

## ARCHITECTURAL RISKS
- **Secret Hygiene (Critical)**: API keys are stored in component state and sent in cleartext headers from the browser.
- **Memory Pressure**: Stringifying multiple 75-file repositories into a single React state object will lead to performance degradation on long-lived sessions.
- **No Error Boundary**: Exceptions in the LLM response parsing (non-JSON responses) can halt the entire autonomous agent if not handled gracefully.

## RECOMMENDED IMPROVEMENTS
- **Move to Full-Stack**: Implement an Express/Node.js backend to handle GitHub proxying and LLM calls.
- **Vector Storage**: For larger repositories, replace raw string injection with a RAG (Retrieval-Augmented Generation) approach to fit within context windows.
- **Durable Persistence**: Integrate Firestore to allow users to save and share workspaces.
