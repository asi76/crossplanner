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

// Cloudinary config
const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || 'demo';
const API_KEY = process.env.CLOUDINARY_API_KEY || '';
const API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

// Serve React app in production
if (IS_PRODUCTION) {
  app.use(express.static(DIST_DIR));
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Upload to Cloudinary
app.post('/api/upload-gif', async (req, res) => {
  try {
    const { exerciseId, gifData } = req.body;
    
    if (!exerciseId || !gifData) {
      return res.status(400).json({ error: 'exerciseId and gifData required' });
    }

    const filename = `${exerciseId}.gif`;
    const base64Data = gifData.replace(/^data:image\/gif;base64,/, '');
    
    // Upload to Cloudinary
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `folder=gifs&timestamp=${timestamp}${API_SECRET}`;
    
    // Simple signature calculation (for basic uploads)
    const crypto = await import('crypto');
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
    
    const formData = new URLSearchParams();
    formData.append('file', base64Data);
    formData.append('folder', 'gifs');
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('api_key', API_KEY);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Upload failed');
    }
    
    console.log('Upload success:', filename, '->', data.secure_url);
    res.json({ success: true, url: data.secure_url, filename });
  } catch (error) {
    console.error('Upload error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete from Cloudinary (using URL-based deletion)
app.delete('/api/delete-gif', async (req, res) => {
  try {
    const { publicId } = req.body;
    
    if (!publicId) {
      return res.status(400).json({ error: 'publicId required' });
    }
    
    // Cloudinary delete by public_id
    const timestamp = Math.round(Date.now() / 1000);
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`;
    
    const crypto = await import('crypto');
    const signature = crypto.createHash('sha1').update(stringToSign).digest('hex');
    
    const formData = new URLSearchParams();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('api_key', API_KEY);
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    
    if (!response.ok && data.error?.message !== 'not found') {
      throw new Error(data.error?.message || 'Delete failed');
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', cloudinary: !!API_KEY });
});

// Serve React app for all non-API routes in production
if (IS_PRODUCTION) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server on port ${PORT} | Cloudinary: ${!!API_KEY}`);
});
