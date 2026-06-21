const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { authMiddleware } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

// === STARTUP: Force sync dist files with git HEAD ===
const { execSync } = require('child_process');
const rootDir = path.join(__dirname, '..');
try {
  execSync('git checkout HEAD -- frontend/dist/', { cwd: rootDir, stdio: 'pipe' });
  console.log('Synced frontend/dist with git HEAD');
} catch (e) {
  console.log('Git sync skipped (not a git repo or no git available)');
}

// Clean up old landing/assets from previous build
const landingAssetsDir = path.join(rootDir, 'landing', 'assets');
if (fs.existsSync(landingAssetsDir)) {
  fs.readdirSync(landingAssetsDir).forEach(f => fs.unlinkSync(path.join(landingAssetsDir, f)));
  fs.rmdirSync(landingAssetsDir);
  console.log('Removed old landing/assets');
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/classes', authMiddleware, require('./routes/classes'));
app.use('/api/students', authMiddleware, require('./routes/students'));
app.use('/api/marks', authMiddleware, require('./routes/marks'));
app.use('/api/study-guides', authMiddleware, require('./routes/studyGuides'));
app.use('/api/tasks', authMiddleware, require('./routes/tasks'));
app.use('/api/attendance', authMiddleware, require('./routes/attendance'));
app.use('/api/dashboard', authMiddleware, require('./routes/dashboard'));
app.use('/api/reports', authMiddleware, require('./routes/reports'));
app.use('/api/messages', authMiddleware, require('./routes/messages'));

// Restore landing page if corrupted on startup (from previous build)
const fs = require('fs');
const https = require('https');
const landingPath = path.join(__dirname, '../landing/index.html');
if (fs.existsSync(landingPath)) {
  const content = fs.readFileSync(landingPath, 'utf8');
  if (content.includes('vite.svg') || content.includes('id="root"')) {
    console.log('Landing page is corrupted, restoring from GitHub...');
    https.get('https://raw.githubusercontent.com/diheleontlametse-cloud/edupulsa/main/landing/index.html', (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        fs.writeFileSync(landingPath, data);
        console.log('Landing page restored successfully');
      });
    }).on('error', (err) => {
      console.error('Failed to restore landing page:', err.message);
    });
  }
}

// Clean up old dist assets that are no longer referenced in index.html
const distDir = path.join(__dirname, '../frontend/dist');
const distAssetsDir = path.join(distDir, 'assets');
const distIndexPath = path.join(distDir, 'index.html');
if (fs.existsSync(distIndexPath) && fs.existsSync(distAssetsDir)) {
  const indexContent = fs.readFileSync(distIndexPath, 'utf8');
  const assetFiles = fs.readdirSync(distAssetsDir);
  const keptFiles = [];
  const removedFiles = [];
  assetFiles.forEach(file => {
    if (indexContent.includes(file)) {
      keptFiles.push(file);
    } else {
      fs.unlinkSync(path.join(distAssetsDir, file));
      removedFiles.push(file);
    }
  });
  if (removedFiles.length > 0) {
    console.log('Removed stale dist assets:', removedFiles.join(', '));
  }
  console.log('Kept dist assets:', keptFiles.join(', '));
}

app.get('/debug', (req, res) => {
  const fs = require('fs');
  const landingDir = path.join(__dirname, '../landing');
  const distDir = path.join(__dirname, '../frontend/dist');
  const distIndex = path.join(distDir, 'index.html');
  const landingIndex = path.join(landingDir, 'index.html');
  
  res.json({
    distIndexExists: fs.existsSync(distIndex),
    distIndexFirst200: fs.existsSync(distIndex) ? fs.readFileSync(distIndex, 'utf8').substring(0, 200) : 'NOT FOUND',
    landingIndexExists: fs.existsSync(landingIndex),
    landingIndexFirst200: fs.existsSync(landingIndex) ? fs.readFileSync(landingIndex, 'utf8').substring(0, 200) : 'NOT FOUND',
    distFiles: fs.existsSync(distDir) ? fs.readdirSync(distDir) : [],
    distAssetsFiles: fs.existsSync(path.join(distDir, 'assets')) ? fs.readdirSync(path.join(distDir, 'assets')) : [],
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Landing page at root
  app.use(express.static(path.join(__dirname, '../landing')));
  
  // App at /app
  app.use('/app', express.static(path.join(__dirname, '../frontend/dist')));
  
  // Fallback for app routes
  app.get('/app/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
  
  // Fallback for landing page
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../landing/index.html'));
  });
} else {
  // In development, serve landing page from root
  app.use(express.static(path.join(__dirname, '../landing')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../landing/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`EduPlan SA server running on port ${PORT}`);
  console.log(`Landing page: http://localhost:${PORT}`);
  console.log(`App: http://localhost:${PORT}/app`);
});
