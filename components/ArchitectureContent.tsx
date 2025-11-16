import React from 'react';

const Hr = () => <hr className="my-6 border-slate-600" />;
const H2: React.FC<{children: React.ReactNode}> = ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 border-b border-slate-600 pb-2 text-white">{children}</h2>;
const H3: React.FC<{children: React.ReactNode}> = ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-purple-300">{children}</h3>;
const Ul: React.FC<{children: React.ReactNode}> = ({ children }) => <ul className="space-y-1 list-disc list-inside text-slate-300 my-2">{children}</ul>;

const ArchitectureContent: React.FC = () => (
    <div className="prose prose-invert max-w-none">
        <p><strong>Product:</strong> App Merger Studio</p>
        <p><strong>Version:</strong> 1.0</p>
        <Hr />
        <H2>1. Architectural Overview</H2>
        <p>App Merger Studio follows a frontend-only, modular, component-based architecture using browser technology and optional external AI services.</p>
        <p>The system’s core is a lightweight orchestrator coordinating:</p>
        <Ul>
            <li>input management</li>
            <li>AI-based analysis</li>
            <li>document generation</li>
            <li>comparison strategies</li>
            <li>export mechanisms</li>
        </Ul>
        <p>No dedicated backend is required unless the user enables cloud LLM integration.</p>
        <Hr />
        <H2>2. High-Level Architecture Diagram</H2>
        <p>(Described textually for clarity)</p>
        <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto whitespace-pre">
{`┌──────────────────────────────────────────┐
│                Frontend SPA              │
│  (HTML/JS, Tailwind, Local State Store)  │
└───────────────┬───────────┬─────────────┘
                │           │
                │           │
     ┌──────────┘           └───────────┐
     ▼                                  ▼
 Workspace Engine                LLM Integration Layer
 (Variant Manager,              (Cloud API, Local LLM,
  Spec Store, Comparison)        Prompt Templates)
     │                                  │
     └──────────┬───────────────┬───────┘
                │               │
                ▼               ▼
  Spec Extraction Engine   Comparison Engine
 (Functional, Tech, Data)   (Matrices, Diffs)
                │               │
                └───────────────┘
                         ▼
             Consolidation Engine
        (Master PRD, Architecture, Docs)
                         ▼
               Export & Integration
         (Markdown bundle, GitHub push)`}
        </pre>
        <Hr />
        <H2>3. Subsystems</H2>
        <H3>3.1 Workspace Engine</H3>
        <p>Handles all in-memory data and interactions.</p>
        <p><strong>Responsibilities:</strong></p>
        <Ul>
            <li>Create/open workspaces</li>
            <li>Add/remove variants</li>
            <li>Store extracted specs</li>
            <li>Track comparison state</li>
            <li>Provide global context to all components</li>
        </Ul>
        <p><strong>Data Structures:</strong></p>
        <pre className="bg-slate-900 p-4 rounded-lg text-sm overflow-auto whitespace-pre-wrap">
{`workspace: {
  id,
  name,
  variants: [
    {
      id,
      name,
      sourceType,
      rawContent,
      extractedSpecs: { functional, architecture, dataModel, strengths }
    }
  ],
  consolidatedSpecs: { prd, architecture, modules, dataModel, decisions }
}`}
        </pre>
        <H3>3.2 Input Processing Layer</H3>
        <p>Functions to ingest code or documents:</p>
        <Ul>
            <li>File reader (zip/unpacked files)</li>
            <li>GitHub fetcher</li>
            <li>Raw text parser</li>
        </Ul>
        <p>Outputs normalized structures for LLM.</p>
        <H3>3.3 Spec Extraction Engine</H3>
        <p>Uses prompt templates + LLM calls to generate detailed specifications from each variant:</p>
        <Ul>
            <li>Functional spec</li>
            <li>Architecture spec</li>
            <li>Data model</li>
            <li>Strengths/weaknesses</li>
        </Ul>
        <p>Must support:</p>
        <Ul>
            <li>Cloud endpoint (OpenAI/Anthropic)</li>
            <li>Local endpoint (Ollama, Jan.ai)</li>
            <li>Strict deterministic prompting</li>
        </Ul>
        <p>Spec format: Markdown + embedded metadata.</p>
        <H3>3.4 Comparison Engine</H3>
        <p>Responsible for analyzing differences between variants.</p>
        <p><strong>Core components:</strong></p>
        <Ul>
            <li>Feature comparison</li>
            <li>Architecture entity comparison</li>
            <li>Data model diff</li>
            <li>Strength scoring</li>
            <li>LLM call for qualitative merge summary</li>
        </Ul>
        <p><strong>Outputs:</strong></p>
        <Ul>
            <li>Comparison matrices</li>
            <li>Recommendations</li>
        </Ul>
    </div>
);

export default ArchitectureContent;