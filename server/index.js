import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const DIST_DIR = path.join(__dirname, '..', 'dist');

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from public (including local GIFs fallback)
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// In production, serve the React app
if (IS_PRODUCTION) {
  // Serve static assets from dist/
  app.use(express.static(DIST_DIR));
  
  // Serve GIFs mapping from public
  app.use('/gif-mapping.json', express.static(path.join(__dirname, '..', 'public', 'gif-mapping.json')));
}

// Multer setup for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Path to GIF mapping file (stored in public so it can be served)
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

// Google Drive setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/oauth2callback'
);

const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || '1YRIKZ5HPL76KDOPPzbOt2qIWrlRoGHL0';

// Upload to Google Drive
const uploadToDrive = async (fileBuffer, fileName, exerciseId) => {
  try {
    // Set credentials if provided
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
      
      // Refresh token if expired
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        process.env.GOOGLE_ACCESS_TOKEN = credentials.access_token;
        oauth2Client.setCredentials(credentials);
      } catch (refreshError) {
        console.log('Token refresh failed, trying with current credentials');
      }
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Find or create the GIFs folder in Drive
    let folderId = null;
    
    // First check if apps folder exists
    const appsRes = await drive.files.list({
      q: "name='apps' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      fields: 'files(id, name)'
    });
    
    let appsFolderId = DRIVE_FOLDER_ID; // Default to root or use the configured folder
    
    if (appsRes.data.files.length > 0) {
      appsFolderId = appsRes.data.files[0].id;
    }
    
    // Check for crosstraining folder
    const ctRes = await drive.files.list({
      q: `name='crosstraining' and '${appsFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    let ctFolderId = null;
    if (ctRes.data.files.length > 0) {
      ctFolderId = ctRes.data.files[0].id;
    } else {
      // Create crosstraining folder
      const ctFolder = await drive.files.create({
        resource: {
          name: 'crosstraining',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [appsFolderId]
        },
        fields: 'id'
      });
      ctFolderId = ctFolder.data.id;
    }
    
    // Check for or create gif subfolder
    const gifRes = await drive.files.list({
      q: `name='gif' and '${ctFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)'
    });
    
    if (gifRes.data.files.length > 0) {
      folderId = gifRes.data.files[0].id;
    } else {
      const gifFolder = await drive.files.create({
        resource: {
          name: 'gif',
          mimeType: 'application/vnd.google-apps.folder',
          parents: [ctFolderId]
        },
        fields: 'id'
      });
      folderId = gifFolder.data.id;
    }

    // Delete existing file for this exercise if exists
    const existingFiles = await drive.files.list({
      q: `name='${exerciseId}.gif' and '${folderId}' in parents and trashed=false`,
      fields: 'files(id, name)',
    });

    for (const existingFile of existingFiles.data.files) {
      try {
        await drive.files.delete({ fileId: existingFile.id });
      } catch (e) {
        console.log('Could not delete existing file:', e.message);
      }
    }

    // Upload new file
    const fileMeta = {
      name: `${exerciseId}.gif`,
      parents: [folderId],
    };

    const media = {
      mimeType: 'image/gif',
      body: Buffer.from(fileBuffer),
    };

    const response = await drive.files.create({
      resource: fileMeta,
      media: media,
      fields: 'id',
    });

    // Make the file public with anyone reader permission
    await drive.permissions.create({
      fileId: response.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // Return direct download URL
    const directUrl = `https://drive.google.com/uc?export=view&id=${response.data.id}`;
    
    return {
      id: response.data.id,
      url: directUrl,
    };
  } catch (error) {
    console.error('Error uploading to Drive:', error);
    throw error;
  }
};

// Delete from Google Drive
const deleteFromDrive = async (fileId) => {
  try {
    if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({
        access_token: process.env.GOOGLE_ACCESS_TOKEN,
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      });
    }

    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error('Error deleting from Drive:', error);
    throw error;
  }
};

// Routes

// Upload GIF to Google Drive
app.post('/api/upload-gif', upload.single('gif'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'image/gif') {
      return res.status(400).json({ error: 'Only GIF files are allowed' });
    }

    const { exerciseId } = req.body;
    if (!exerciseId) {
      return res.status(400).json({ error: 'Exercise ID required' });
    }

    console.log(`Uploading GIF for exercise: ${exerciseId}`);
    
    const result = await uploadToDrive(req.file.buffer, req.file.originalname, exerciseId);

    // Update mapping
    const mapping = loadMapping();
    mapping[exerciseId] = result.url;
    saveMapping(mapping);

    console.log(`Upload successful: ${exerciseId} -> ${result.url}`);
    res.json({ success: true, url: result.url, fileId: result.id });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed', details: error.message });
  }
});

// Delete GIF from Google Drive and mapping
app.delete('/api/delete-gif', async (req, res) => {
  try {
    const { exerciseId, fileId } = req.body;
    
    if (!exerciseId) {
      return res.status(400).json({ error: 'Exercise ID required' });
    }

    // If fileId provided, delete from Drive
    if (fileId) {
      try {
        await deleteFromDrive(fileId);
      } catch (e) {
        console.log('File may not exist in Drive:', e.message);
      }
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

// Get current GIF mapping
app.get('/api/gif-mapping', (req, res) => {
  const mapping = loadMapping();
  res.json(mapping);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// In production, serve React app for all non-API routes
if (IS_PRODUCTION) {
  app.get('*', (req, res) => {
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${IS_PRODUCTION ? 'production' : 'development'}`);
  if (IS_PRODUCTION) {
    console.log(`Serving React app from: ${DIST_DIR}`);
  }
  console.log(`Google Drive folder: ${DRIVE_FOLDER_ID}`);
});
