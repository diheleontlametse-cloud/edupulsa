const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.join(__dirname, '..');
const distDir = path.join(rootDir, 'frontend', 'dist');
const distAssetsDir = path.join(distDir, 'assets');
const landingDir = path.join(rootDir, 'landing');
const landingAssetsDir = path.join(landingDir, 'assets');

// Step 1: Force git checkout of dist folder to ensure fresh files
try {
  console.log('Syncing frontend/dist with git HEAD...');
  execSync('git checkout HEAD -- frontend/dist/', { cwd: rootDir, stdio: 'inherit' });
  console.log('Dist folder synced successfully');
} catch (err) {
  console.error('Git checkout failed, falling back to manual cleanup:', err.message);
  
  // Fallback: manual cleanup
  if (fs.existsSync(distAssetsDir)) {
    const files = fs.readdirSync(distAssetsDir);
    const distIndexPath = path.join(distDir, 'index.html');
    let indexContent = '';
    if (fs.existsSync(distIndexPath)) {
      indexContent = fs.readFileSync(distIndexPath, 'utf8');
    }
    files.forEach(file => {
      if (!indexContent.includes(file)) {
        fs.unlinkSync(path.join(distAssetsDir, file));
        console.log('Removed stale asset:', file);
      }
    });
  }
}

// Step 2: Remove landing/assets folder (created by old build script)
if (fs.existsSync(landingAssetsDir)) {
  const files = fs.readdirSync(landingAssetsDir);
  files.forEach(file => {
    fs.unlinkSync(path.join(landingAssetsDir, file));
  });
  fs.rmdirSync(landingAssetsDir);
  console.log('Removed landing/assets folder');
}

// Step 3: Verify current state
if (fs.existsSync(distAssetsDir)) {
  const files = fs.readdirSync(distAssetsDir);
  console.log('Current dist assets:', files.join(', '));
}
