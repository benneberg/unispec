import React from 'react';

const Hr = () => <hr className="my-6 border-slate-600" />;
const H2: React.FC<{children: React.ReactNode}> = ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3 border-b border-slate-600 pb-2 text-white">{children}</h2>;
const H3: React.FC<{children: React.ReactNode}> = ({ children }) => <h3 className="text-xl font-semibold mt-4 mb-2 text-purple-300">{children}</h3>;
const Ul: React.FC<{children: React.ReactNode}> = ({ children }) => <ul className="space-y-1 list-disc list-inside text-slate-300 my-2">{children}</ul>;

const PrdContent: React.FC = () => (
  <div className="prose prose-invert max-w-none">
    <p><strong>Product Name:</strong> App Merger Studio</p>
    <p><strong>Version:</strong> 1.0</p>
    <p><strong>Purpose:</strong> Unifying multiple related applications into a single consolidated specification, architecture, and final blueprint for code generation.</p>
    <Hr />
    <H2>1. Overview</H2>
    <p>App Merger Studio is a standalone, browser-based application for extracting specifications, analyzing multiple application variants, comparing features and architectures, and generating a consolidated master specification for use in downstream development environments or LLM coding workflows.</p>
    <p>The tool enables users to ingest diverse inputs—including code repositories, uploaded source files, or documented features—and produces structured, comparable specifications. It then derives a unified PRD and architecture to guide creation of a final combined application.</p>
    <Hr />
    <H2>2. Goals</H2>
    <H3>2.1 Primary Goals</H3>
    <Ul>
      <li>Provide a structured workflow for merging multiple related apps into one cohesive final design.</li>
      <li>Automate extraction of functional and technical specifications using LLM analysis.</li>
      <li>Enable comparison and reconciliation of differences across multiple variants.</li>
      <li>Generate high-quality, production-ready PRD and Architecture documents.</li>
      <li>Operate as a standalone HTML/JS tool with optional cloud or local LLM backends.</li>
    </Ul>
    <H3>2.2 Secondary Goals</H3>
    <Ul>
      <li>Offer GitHub integration for pulling repositories.</li>
      <li>Support direct code uploads or text-based specification input.</li>
      <li>Provide export of all outputs as Markdown or zipped documentation bundles.</li>
      <li>Facilitate downstream code generation through external tools (VSCode + ChatGPT/Claude/v0).</li>
    </Ul>
    <Hr />
    <H2>3. Users</H2>
    <H3>3.1 Primary User</H3>
    <Ul>
        <li>Individual developer consolidating multiple prototypes into a single final app.</li>
        <li>AI-assisted software engineer requiring detailed specs before coding.</li>
    </Ul>
    <H3>3.2 Secondary Users</H3>
    <Ul>
        <li>Teams analyzing divergent prototypes.</li>
        <li>Anyone performing architecture discovery/refactoring of multiple codebases.</li>
    </Ul>
    <Hr />
    <H2>4. Core Use Cases</H2>
    <ol className="list-decimal list-inside space-y-1">
        <li>Ingest multiple application variants (3–5 apps).</li>
        <li>Generate consistent specs from each variant.</li>
        <li>Compare and reconcile variances across apps.</li>
        <li>Produce consolidated master PRD and architecture.</li>
        <li>Export documents or send them to external LLM agents for code generation.</li>
    </ol>
    <Hr />
    <H2>5. Features</H2>
    <H3>5.1 Workspace Management</H3>
    <Ul>
        <li>Create a new workspace.</li>
        <li>Add multiple variants (App A, App B, etc.).</li>
        <li>Store metadata and specs per variant.</li>
    </Ul>
    <H3>5.2 Input Channels</H3>
    <Ul>
        <li>Upload local code (zip, folder).</li>
        <li>GitHub Repo Clone via personal access token.</li>
        <li>Manual text/Markdown entry for user-provided specs.</li>
        <li>Single-file app upload for small prototypes.</li>
    </Ul>
    <H3>5.3 Spec Extraction (AI-Assisted)</H3>
    <p>For each variant, the system can generate:</p>
    <Ul>
        <li>Functional Specification</li>
        <li>Architecture Specification</li>
        <li>Data Models</li>
        <li>API Endpoints</li>
        <li>Strengths/Weaknesses Overview</li>
        <li>Implementation Notes</li>
    </Ul>
    <H3>5.4 Variant Comparison Engine</H3>
    <Ul>
        <li>Feature comparison matrix</li>
        <li>Architecture comparison matrix</li>
        <li>Data model diff visualizer</li>
        <li>AI-driven merge recommendations</li>
        <li>Highlighted inconsistencies and trade-offs</li>
    </Ul>
    <H3>5.5 Consolidated Master Documents</H3>
    <p>The system generates a full suite of documentation:</p>
    <Ul>
        <li>PRD.md</li>
        <li>Architecture.md</li>
        <li>Modules.md</li>
        <li>Data-Model.md</li>
        <li>Design-Decisions.md</li>
        <li>Migration-Plan.md</li>
    </Ul>
    <H3>5.6 Export Tools</H3>
    <Ul>
        <li>Export as zipped Markdown files</li>
        <li>Export final project scaffold (optional)</li>
        <li>Export directly to GitHub repo</li>
        <li>Copy-to-clipboard for further use in LLM coding sessions</li>
    </Ul>
    <H3>5.7 Optional Advanced Features</H3>
    <Ul>
        <li>Local LLM support (Ollama, WebGPU, Jan.ai)</li>
        <li>Automatic dependency graph generation</li>
        <li>Visual architecture diagrams (LLM-generated schema → Mermaid.js)</li>
        <li>Project template generation for final unified app</li>
    </Ul>
  </div>
);

export default PrdContent;