
import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(cors());
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for dev/iframe compatibility
  }));

  // Proxy API for LLM calls
  app.post('/api/llm', async (req, res) => {
    const { provider, apiKey, body } = req.body;
    
    if (!apiKey) {
      return res.status(400).json({ error: { message: 'API Key is required' } });
    }

    let url = '';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    };

    if (provider === 'groq') {
       url = 'https://api.groq.com/openai/v1/chat/completions';
    } else {
       url = 'https://openrouter.ai/api/v1/chat/completions';
       headers['HTTP-Referer'] = 'https://unispec.ai';
       headers['X-Title'] = 'UniSpec App Merger';
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) {
        return res.status(response.status).json(data);
      }
      res.json(data);
    } catch (error) {
      console.error('LLM Proxy error:', error);
      res.status(500).json({ error: { message: 'Failed to proxy LLM request' } });
    }
  });

  // Proxy API for full-tree GitHub repository cloning
  app.post('/api/github/clone', async (req, res) => {
    const { owner, repo, defaultBranch } = req.body;
    if (!owner || !repo) {
      return res.status(400).json({ error: 'Owner and repo are required' });
    }

    try {
      let branch = defaultBranch;
      const headers: Record<string, string> = {
        'User-Agent': 'UniSpec-Merger-Studio-App',
        'Accept': 'application/vnd.github.v3+json'
      };
      if (process.env.GITHUB_TOKEN) {
        headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
      }

      if (!branch) {
        const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
        if (!repoInfoRes.ok) {
          return res.status(repoInfoRes.status).json({ error: `Failed to fetch repository information: ${repoInfoRes.statusText}` });
        }
        const repoInfo = await repoInfoRes.json();
        branch = repoInfo.default_branch;
      }

      const treeRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers });
      if (!treeRes.ok) {
        return res.status(treeRes.status).json({ error: `Failed to fetch repository tree structure: ${treeRes.statusText}` });
      }
      const treeData = await treeRes.json();

      // Smart file classification & exclusion list
      const filesToFetch = (treeData.tree || []).filter((item: any) => 
        item.type === 'blob' && 
        !/\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot|pdf|zip|gz|tar|tgz|bz2|7z|dmg|exe|apk|bin|lock|DS_Store|lockb|mp3|mp4|mov|avi)$/i.test(item.path) &&
        !item.path.includes('node_modules/') &&
        !item.path.includes('.git/') &&
        !item.path.includes('dist/') &&
        !item.path.includes('build/') &&
        !item.path.includes('.next/') &&
        !item.path.includes('out/')
      );

      const limit = 300; // Large, safe threshold for server-side aggregation
      const truncated = filesToFetch.length > limit;
      const slicedFiles = filesToFetch.slice(0, limit);

      const fileContents: Record<string, string> = {};

      // Batch requests to prevent rate limiting or connection exhausting
      const chunkSize = 15;
      for (let i = 0; i < slicedFiles.length; i += chunkSize) {
        const chunk = slicedFiles.slice(i, i + chunkSize);
        await Promise.all(chunk.map(async (file: any) => {
          try {
            const fileRes = await fetch(file.url, { headers });
            if (!fileRes.ok) {
              fileContents[file.path] = `[Error: Failed to fetch file content, status ${fileRes.status}]`;
              return;
            }
            const blobData = await fileRes.json();
            if (blobData.encoding === 'base64') {
              const decodedContent = Buffer.from(blobData.content, 'base64').toString('utf8');
              fileContents[file.path] = decodedContent;
            } else if (blobData.content) {
              fileContents[file.path] = blobData.content;
            } else {
              fileContents[file.path] = "";
            }
          } catch (e) {
            fileContents[file.path] = `[Error: ${e instanceof Error ? e.message : 'Unknown error'}]`;
          }
        }));
      }

      // After clone succeeds, check for CCC artifacts
      const hasCCC = Object.keys(fileContents).some(p => p.startsWith('.llm-context/'));
      let cccArtifacts = null;

      if (hasCCC) {
        // Extract the CCC artifacts into a structured object
        cccArtifacts = {
          llmMd: fileContents['.llm-context/LLM.md'] || null,
          publicApi: fileContents['.llm-context/public-api.txt'] || null,
          capabilities: fileContents['.llm-context/capabilities.json'] || null,
          dependencyGraph: fileContents['.llm-context/dependency-graph.md'] || null,
          typesExtracted: fileContents['.llm-context/types-extracted.ts'] || null,
          callGraph: fileContents['.llm-context/call-graph.json'] || null,
        };
      }

      res.json({
        owner,
        repo,
        branch,
        files: fileContents,
        truncated,
        totalFiles: filesToFetch.length,
        fetchedFiles: slicedFiles.length,
        hasCCC,
        cccArtifacts
      });
    } catch (error) {
      console.error('GitHub Proxy clone error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to clone repository via proxy' });
    }
  });

  // Deterministic non-LLM Content Compressor Endpoint (Phase 1.1)
  app.post('/api/compress', (req, res) => {
    const { files }: { files: Record<string, string> } = req.body;
    if (!files) {
      return res.status(400).json({ error: 'Files object is required' });
    }
    const compressed = compressFileMap(files);
    res.json(compressed);
  });

  // Standalone Extraction Bundle Compiler Endpoint (Phase 2.2)
  app.post('/api/extract-bundle', async (req, res) => {
    const { artifact, variantFiles, apiConfig } = req.body;
    if (!artifact || !variantFiles || !apiConfig) {
      return res.status(400).json({ error: 'artifact, variantFiles, and apiConfig are required' });
    }

    try {
      const bundle = {
        artifactId: artifact.id,
        artifactName: artifact.name,
        sourceVariant: artifact.implementations?.[0]?.repositoryId || 'unknown',
        files: [] as { path: string; content: string; role: 'primary' | 'dependency' | 'type' }[],
        interfaceContract: '',
        installNotes: '',
      };

      // Pull actual file contents for declared filePaths
      const filePaths = artifact.implementations?.[0]?.filePaths || [];
      for (const filePath of filePaths) {
        const content = variantFiles[filePath];
        if (content) {
          bundle.files.push({ path: filePath, content, role: 'primary' });
        }
      }

      // If no files mapped in implementation metadata, attempt smart regex backup selection
      if (bundle.files.length === 0) {
        const normalizedArtName = artifact.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const possibleFiles = Object.keys(variantFiles).filter(p => {
          const normPath = p.toLowerCase().replace(/[^a-z0-9]/g, '');
          return normPath.includes(normalizedArtName);
        });
        for (const filePath of possibleFiles.slice(0, 5)) {
          bundle.files.push({ path: filePath, content: variantFiles[filePath], role: 'primary' });
        }
      }

      // If still empty, grab any files that contain mentions or fallback to a template placeholder
      if (bundle.files.length === 0) {
        bundle.files.push({ 
          path: `src/${artifact.name.toLowerCase().replace(/\s+/g, '-')}-stub.ts`, 
          content: `// Source Stub for ${artifact.name}\n// Original content was embedded or unavailable directly.\nexport const ${artifact.name.replace(/[^a-zA-Z0-9]/g, '')} = {\n  purpose: "${artifact.purpose}"\n};`, 
          role: 'primary' 
        });
      }

      // LLM pass: generate interface contract + install notes
      const contractPrompt = `
You are extracting a standalone module from a larger codebase.
Artifact: ${artifact.name}
Purpose: ${artifact.purpose}
Files included:
${bundle.files.map(f => `### ${f.path}\n${f.content.substring(0, 1000)}`).join('\n\n')}

Generate:
1. An interface contract (how to consume this module in another project — exports, required config, expected inputs/outputs)
2. Install notes (what dependencies, env vars, or setup steps are needed)

Respond with a strictly formatted JSON object matching this schema:
{
  "interfaceContract": "Detailed Markdown of how to consume this module",
  "installNotes": "Detailed step-by-step notes on dependencies, package.json entries, and environment variables needed"
}

Do not include any conversational preamble or trailing markdown blocks. Return ONLY the JSON object.
`;
      const contractResult = await performApiCallServer(contractPrompt, apiConfig);
      bundle.interfaceContract = contractResult.interfaceContract || 'Failed to generate markdown contract automatically.';
      bundle.installNotes = contractResult.installNotes || 'Failed to generate installation notes automatically.';

      res.json(bundle);
    } catch (e) {
      console.error('Failed to extract standalone bundle:', e);
      res.status(500).json({ error: e instanceof Error ? e.message : 'Failed to extract bundle' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`UniSpec Server running on http://localhost:${PORT}`);
  });
}

// Helper functions for compression and server-side LLM calls

async function performApiCallServer(prompt: string, apiConfig: any): Promise<any> {
  const { provider, apiKey, model } = apiConfig;
  const body = {
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 3000,
    response_format: { type: "json_object" }
  };

  let url = '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  };

  if (provider === 'groq') {
     url = 'https://api.groq.com/openai/v1/chat/completions';
  } else {
     url = 'https://openrouter.ai/api/v1/chat/completions';
     headers['HTTP-Referer'] = 'https://unispec.ai';
     headers['X-Title'] = 'UniSpec App Merger';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `LLM request failed with status ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  try {
    const cleanedContent = content.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanedContent);
  } catch (e) {
    return { interfaceContract: content, installNotes: 'Ref to raw content for setup instructions.' };
  }
}

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
      (trimmed.startsWith('const ') && trimmed.includes('=>')) ||
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

startServer();
