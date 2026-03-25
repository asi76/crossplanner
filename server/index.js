import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static GIFs from public/gifs
app.use('/gifs', express.static(path.join(__dirname, '..', 'public', 'gifs')));

// Multer setup for file uploads — save directly to public/gifs
const ensureGifsDir = () => {
  const gifsDir = path.join(__dirname, '..', 'public', 'gifs');
  if (!fs.existsSync(gifsDir)) {
    fs.mkdirSync(gifsDir, { recursive: true });
  }
  return gifsDir;
};

const multerUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/gif') {
      cb(null, true);
    } else {
      cb(new Error('Only GIF files are allowed'));
    }
  }
});

// Path to local GIF mapping file
const MAPPING_FILE = path.join(__dirname, '..', 'public', 'gif-mapping.json');

// Load existing mapping
const loadMapping = () => {
  try {
    if (fs.existsSync(MAPPING_FILE)) {
      return JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Error loading mapping:', e);
  }
  return {};
};

// Save mapping
const saveMapping = (mapping) => {
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
};

// Routes

// Upload GIF — saves to public/gifs/ and returns local URL
app.post('/api/upload-gif', multerUpload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { exerciseId } = req.body;
    if (!exerciseId) {
      return res.status(400).json({ error: 'Exercise ID required' });
    }

    const gifsDir = ensureGifsDir();
    const filename = `${exerciseId}.gif`;
    const filePath = path.join(gifsDir, filename);

    // Save file locally
    fs.writeFileSync(filePath, req.file.buffer);

    // Local URL (relative, works on same origin)
    const localUrl = `/gifs/${filename}`;

    // Update mapping
    const mapping = loadMapping();
    mapping[exerciseId] = localUrl;
    saveMapping(mapping);

    console.log(`Uploaded ${filename} -> ${localUrl}`);
    res.json({ success: true, url: localUrl, filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete GIF — removes from public/gifs and mapping
app.delete('/api/delete-gif', async (req, res) => {
  try {
    const { exerciseId } = req.body;

    if (!exerciseId) {
      return res.status(400).json({ error: 'Exercise ID required' });
    }

    const gifsDir = ensureGifsDir();
    const filename = `${exerciseId}.gif`;
    const filePath = path.join(gifsDir, filename);

    // Delete file if exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted ${filename}`);
    }

    // Update mapping
    const mapping = loadMapping();
    if (mapping[exerciseId]) {
      delete mapping[exerciseId];
      saveMapping(mapping);
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ error: 'Delete failed', details: error.message });
  }
});

// Get mapping
app.get('/api/gif-mapping', (req, res) => {
  const mapping = loadMapping();
  res.json(mapping);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GIFs will be served from: http://localhost:${PORT}/gifs/`);
});
