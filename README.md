# UniSpec — App Merger Studio

UniSpec is an AI-powered technical analysis tool designed to decompose, compare, and consolidate multiple application variants into a single, unified Master Specification.

## 🚀 Overview
UniSpec automates the complex task of "Software Archaeology." When you have multiple versions of a codebase or different technical specifications for the same product, UniSpec uses a hierarchical LLM pipeline to build a comprehensive map of features, architecture, and logic to generate a unified source of truth.

## ✨ Key Features
- **Multi-Variant Ingestion**: 
    - Clone GitHub repositories directly via the API.
    - Upload source code files.
    - Manual input for abstract specs.
- **Hierarchical Extraction Pipeline**:
    - **Pass 1: Low-Level**: UI elements, basic features, and components.
    - **Pass 2: Mid-Level**: Logic flows, data models, and business rules.
    - **Pass 3: High-Level**: Architectural intent, integration patterns, and goals.
- **Deep Comparison**: Automated conflict detection between application variants.
- **Master Doc Synthesis**: Generates a unified PRD and Architecture document.
- **Interactive QA**: Chat with the analysis agent to query specific details about the merged state.

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd unispec
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env` file (or use the in-app settings modal):
   ```env
   VITE_GEMINI_API_KEY=your_key_here
   ```

## ⚙️ Configuration
UniSpec supports multiple LLM providers:
- **Groq** (Recommended for speed)
- **OpenRouter**
- **Other OpenAI-compatible endpoints**

Configure the Provider and API Key via the **Settings (Gear Icon)** in the dashboard.

## 🖥 Usage
1. **Setup Workspace**: Give your analysis project a name.
2. **Add Variants**: 
   - Paste a GitHub URL (e.g. `https://github.com/owner/repo`).
   - Upload local files.
3. **Run Pipeline**: Click **Start Analysis**. The autonomous agent will cycle through extraction, comparison, and consolidation.
4. **Review Results**: Use the "Master Specs" tab to view the final consolidated documentation.

## 🏗 Architecture
- **Frontend**: React 19 + Tailwind CSS + Lucide Icons.
- **State**: React Context API with a robust state machine for the Autonomous Agent.
- **Analysis**: Custom prompt-chaining service (`llmService.ts`).

## 🧪 Testing
*(Tests are currently under development)*
Run the bootstrap checks:
```bash
npm run lint
```

## 📦 Build
```bash
npm run build
```
The static assets will be generated in the `dist/` folder.

## 🚢 Deployment
Deploy as a static SPA to platforms like Vercel, Netlify, or Cloud Run. Ensure the `VITE_` environment variables are configured in your CI/CD provider.
