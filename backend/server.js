const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { authMiddleware } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

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
