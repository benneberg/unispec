
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

      res.json({
        owner,
        repo,
        branch,
        files: fileContents,
        truncated,
        totalFiles: filesToFetch.length,
        fetchedFiles: slicedFiles.length
      });
    } catch (error) {
      console.error('GitHub Proxy clone error:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to clone repository via proxy' });
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

startServer();
