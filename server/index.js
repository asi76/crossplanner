import express from 'express';
import cors from 'cors';
import fs from 'fs';
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
async function githubCommit(path, contentBase64, message) {
  if (!GITHUB_TOKEN) {
    throw new Error('GitHub token not configured');
  }

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${path}`;
  
  let sha = null;
  try {
    const getRes = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    if (getRes.ok) {
      const data = await getRes.json();
      sha = data.sha;
    }
  } catch (e) {
    // File doesn't exist yet, that's fine
  }

  const body = {
    message,
    content: contentBase64,
    branch: GIT_BRANCH,
    ...(sha && { sha })
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'GitHub commit failed');
  }

  return response.json();
}

// Upload GIF — commits directly to GitHub
app.post('/api/upload-gif', async (req, res) => {
  try {
    const { exerciseId, gifData } = req.body;
    
    if (!exerciseId || !gifData) {
      return res.status(400).json({ error: 'exerciseId and gifData required' });
    }

    if (!gifData.startsWith('data:image/gif;base64,')) {
      return res.status(400).json({ error: 'Invalid GIF format' });
    }

    const filename = `${exerciseId}.gif`;
    const base64Data = gifData.replace(/^data:image\/gif;base64,/, '');
    const repoPath = `${GIFS_REPO_PATH}/${filename}`;

    console.log(`Uploading ${filename} to GitHub...`);
    
    await githubCommit(
      repoPath,
      base64Data,
      `chore: add GIF ${filename}`
    );

    // Return GitHub raw URL
    const rawUrl = `https://raw.githubusercontent.com/${GITHUB_REPO}/${GIT_BRANCH}/${repoPath}`;
    
    console.log(`Uploaded: ${filename} -> ${rawUrl}`);
    res.json({ success: true, url: rawUrl, filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete GIF — not implemented since we'd need to delete from git history
app.delete('/api/delete-gif', async (req, res) => {
  res.status(501).json({ error: 'Delete not implemented — GIFs persist in git history' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', github: !!GITHUB_TOKEN });
});

// Serve React app for all non-API routes in production
if (IS_PRODUCTION) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server on port ${PORT} | GitHub sync: ${!!GITHUB_TOKEN}`);
});
