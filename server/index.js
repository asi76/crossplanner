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
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DIST_DIR = path.join(__dirname, '..', 'dist');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const GIFS_DIR = path.join(PUBLIC_DIR, 'gifs');
const MAPPING_FILE = path.join(PUBLIC_DIR, 'gif-mapping.json');

// Ensure directories exist
if (!fs.existsSync(GIFS_DIR)) {
  fs.mkdirSync(GIFS_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files
app.use('/public', express.static(PUBLIC_DIR));

// Serve GIFs directly
app.use('/gifs', express.static(GIFS_DIR));

// Serve React app in production
if (IS_PRODUCTION) {
  app.use(express.static(DIST_DIR));
}

// Load GIF mapping
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

// Save GIF mapping
const saveMapping = (mapping) => {
  fs.writeFileSync(MAPPING_FILE, JSON.stringify(mapping, null, 2));
};

// Multer config — save to public/gifs/
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, GIFS_DIR);
  },
  filename: (req, file, cb) => {
    const exerciseId = req.body.exerciseId || req.params.exerciseId;
    cb(null, `${exerciseId}.gif`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/gif') {
      cb(null, true);
    } else {
      cb(new Error('Only GIF files allowed'));
    }
  }
});

// Upload GIF
app.post('/api/upload-gif', upload.single('gif'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { exerciseId } = req.body;
    if (!exerciseId) {
      return res.status(400).json({ error: 'Exercise ID required' });
    }

    // Save with exercise ID as filename
    const filename = `${exerciseId}.gif`;
    const destPath = path.join(GIFS_DIR, filename);
    
    // Delete existing file if different
    if (fs.existsSync(destPath) && fs.readFileSync(destPath).toString('hex') !== fs.readFileSync(req.file.path).toString('hex')) {
      fs.unlinkSync(destPath);
    }
    
    // Move to final location
    if (req.file.path !== destPath) {
      fs.copyFileSync(req.file.path, destPath);
      fs.unlinkSync(req.file.path);
    }

    // Generate URL (relative or absolute based on host)
    const gifUrl = `/gifs/${filename}`;

    // Update mapping
    const mapping = loadMapping();
    mapping[exerciseId] = gifUrl;
    saveMapping(mapping);

    console.log(`Uploaded: ${filename} -> ${gifUrl}`);
    res.json({ success: true, url: gifUrl, filename });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete GIF
app.delete('/api/delete-gif', (req, res) => {
  try {
    const { exerciseId } = req.body;
    if (!exerciseId) {
      return res.status(400).json({ error: 'Exercise ID required' });
    }

    const filename = `${exerciseId}.gif`;
    const filePath = path.join(GIFS_DIR, filename);

    // Delete file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve React app for all non-API routes in production
if (IS_PRODUCTION) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`GIFs directory: ${GIFS_DIR}`);
  console.log(`Mode: ${IS_PRODUCTION ? 'production' : 'development'}`);
});
