import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// GitHub config
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO || 'asi76/crosstraining';
const GIT_BRANCH = 'main';
const GIFS_REPO_PATH = 'public/gifs';

// Serve React app in production
if (IS_PRODUCTION) {
  app.use(express.static(DIST_DIR));
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// GitHub API helper
async function githubRequest(method, apiPath, body = null) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured');
  }

  const url = `https://api.github.com${apiPath}`;
  
  const options = {
    method,
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  
  // For DELETE, 204 No Content is success
  if (method === 'DELETE' && response.status === 204) {
    return { success: true };
  }
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'GitHub API error');
  }
  
  return data;
}

// Upload GIF — commits to GitHub
app.post('/api/upload-gif', async (req, res) => {
  console.log('POST /api/upload-gif called');
  
  try {
    const { exerciseId, gifData } = req.body;
    
    if (!exerciseId || !gifData) {
      return res.status(400).json({ error: 'exerciseId and gifData required' });
    }

    const filename = `${exerciseId}.gif`;
    const repoPath = `${GIFS_REPO_PATH}/${filename}`;

    // Get current file SHA if exists
    let sha = null;
    try {
      const existing = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${repoPath}?ref=${GIT_BRANCH}`);
      sha = existing.sha;
    } catch (e) {
      // File doesn't exist, that's fine
    }

    // Commit new file
    const base64Data = gifData.replace(/^data:image\/gif;base64,/, '');
    
    await githubRequest('PUT', `/repos/${GITHUB_REPO}/contents/${repoPath}`, {
      message: `chore: update GIF ${filename}`,
      content: base64Data,
      branch: GIT_BRANCH,
      ...(sha && { sha })
    });

    // Return GitHub raw URL
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GIT_BRANCH}/${repoPath}`;
    
    console.log('Upload success:', filename);
    res.json({ success: true, url: rawUrl, filename });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete GIF — removes from GitHub
app.delete('/api/delete-gif', async (req, res) => {
  try {
    const { exerciseId } = req.body;
    
    if (!exerciseId) {
      return res.status(400).json({ error: 'exerciseId required' });
    }

    const filename = `${exerciseId}.gif`;
    const repoPath = `${GIFS_REPO_PATH}/${filename}`;

    // Get current file SHA
    let sha = null;
    try {
      const existing = await githubRequest('GET', `/repos/${GITHUB_REPO}/contents/${repoPath}?ref=${GIT_BRANCH}`);
      sha = existing.sha;
    } catch (e) {
      return res.status(404).json({ error: 'File not found in repository' });
    }

    // Delete via GitHub API
    await githubRequest('DELETE', `/repos/${GITHUB_REPO}/contents/${repoPath}`, {
      message: `chore: delete GIF ${filename}`,
      branch: GIT_BRANCH,
      sha
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', github: !!GITHUB_TOKEN });
});

// Serve React app for all non-API routes in production
if (IS_PRODUCTION) {
  // Explicit 404 for unknown API routes (helps debug)
  app.get('/api/:route(*)', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found', path: req.path });
  });
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server on port ${PORT} | GitHub sync: ${!!GITHUB_TOKEN}`);
});
