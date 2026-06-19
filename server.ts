
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
