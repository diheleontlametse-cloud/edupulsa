const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { authMiddleware } = require('./auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

// Debug route to check filesystem
app.get('/debug', (req, res) => {
  const fs = require('fs');
  const path = require('path');
  const landingDir = path.join(__dirname, '../landing');
  const frontendDistDir = path.join(__dirname, '../frontend/dist');
  
  const result = {
    nodeEnv: process.env.NODE_ENV,
    __dirname: __dirname,
    landingDir: landingDir,
    frontendDistDir: frontendDistDir,
    landingExists: fs.existsSync(landingDir),
    landingIndexExists: fs.existsSync(path.join(landingDir, 'index.html')),
    frontendDistExists: fs.existsSync(frontendDistDir),
    frontendDistIndexExists: fs.existsSync(path.join(frontendDistDir, 'index.html')),
  };
  
  if (result.landingExists) {
    result.landingFiles = fs.readdirSync(landingDir);
  }
  if (result.frontendDistExists) {
    result.frontendDistFiles = fs.readdirSync(frontendDistDir);
  }
  
  res.json(result);
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Landing page at root
  app.use(express.static(path.join(__dirname, '../landing')));
  
  // App at /app
  app.use('/app', express.static(path.join(__dirname, '../frontend/dist')));
  
  // API routes must be before the catch-all
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
