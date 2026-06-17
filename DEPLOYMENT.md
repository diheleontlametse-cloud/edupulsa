# EduPlan SA - Deployment Plan

## Overview

EduPlan SA is a full-stack web application for South African teachers. This document outlines how to deploy it publicly so anyone can access it from anywhere.

---

## Architecture

```
┌─────────────────────────────────────────┐
│             User Browser                 │
│  ┌─────────────────────────────────┐    │
│  │  Landing Page (/)               │    │
│  │  - Marketing website            │    │
│  │  - Features, testimonials, CTA  │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │  App (/app)                     │    │
│  │  - Dashboard, classes, marks   │    │
│  │  - Login required               │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────┐
│         Backend Server (Node.js)        │
│  ┌─────────────────────────────────┐  │
│  │  API Routes (/api/*)            │  │
│  │  - Auth, classes, students     │  │
│  │  - Marks, attendance, reports  │  │
│  └─────────────────────────────────┘  │
│  ┌─────────────────────────────────┐  │
│  │  SQLite Database                │  │
│  │  - File-based, zero config     │  │
│  └─────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Option 1: Deploy to Render (Recommended - Free)

**Render** is a free cloud hosting platform. Perfect for getting started.

### Step 1: Prepare Your Code

```bash
cd C:\Users\dihel\Documents\kimi\workspace\edupulsa
```

### Step 2: Create a Git Repository

```bash
git init
git add .
git commit -m "EduPlan SA v1.0"
```

### Step 3: Create GitHub Repository

1. Go to [github.com](https://github.com) and log in
2. Click the **+** button → **New repository**
3. Name it `edupulsa`
4. Click **Create repository**
5. Copy the commands from the page and run them:

```bash
git remote add origin https://github.com/YOUR_USERNAME/edupulsa.git
git branch -M main
git push -u origin main
```

### Step 4: Deploy on Render

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click **New +** → **Web Service**
3. Connect your `edupulsa` repository

**Settings:**
| Setting | Value |
|---------|-------|
| Name | `edupulsa` |
| Root Directory | `backend` |
| Runtime | `Node` |
| Build Command | `cd ../frontend && npm install && npm run build && cd ../landing && cp -r ../frontend/dist/* . && cd ../backend && npm install` |
| Start Command | `npm start` |
| Plan | Free |

**Environment Variables:**
| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `JWT_SECRET` | `your-secret-key-change-this` |
| `PORT` | `10000` (Render assigns this) |

4. Click **Create Web Service**
5. Wait 10 minutes for the build

**Your URLs will be:**
- Landing page: `https://edupulsa.onrender.com`
- App: `https://edupulsa.onrender.com/app`
- API: `https://edupulsa.onrender.com/api`

---

## Option 2: Deploy to Railway (Alternative)

**Railway** is another free platform with a generous tier.

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click **New Project** → **Deploy from GitHub repo**
4. Select `edupulsa`

**Settings:**
- Root Directory: `backend`
- Start Command: `npm start`

Add environment variables: `NODE_ENV=production`, `JWT_SECRET=your-secret`

---

## Option 3: Deploy to a VPS (DigitalOcean, Linode, AWS)

For more control and reliability, use a VPS.

### Step 1: Set Up Server

```bash
# SSH into your server
ssh root@your-server-ip

# Update packages
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install Nginx and PM2
apt install -y nginx
npm install -g pm2
```

### Step 2: Clone and Build

```bash
cd /var/www
git clone https://github.com/YOUR_USERNAME/edupulsa.git
cd edupulsa

# Build frontend
cd frontend
npm install
npm run build

# Copy build to landing
cd ../landing
cp -r ../frontend/dist/* .

# Install backend dependencies
cd ../backend
npm install
```

### Step 3: Configure Nginx

```bash
nano /etc/nginx/sites-available/edupulsa
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        root /var/www/edupulsa/landing;
        try_files $uri $uri/ /index.html;
    }

    location /app {
        alias /var/www/edupulsa/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable:
```bash
ln -s /etc/nginx/sites-available/edupulsa /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 4: Start with PM2

```bash
cd /var/www/edupulsa/backend
NODE_ENV=production pm2 start server.js --name edupulsa
pm2 save
pm2 startup
```

### Step 5: HTTPS with Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d your-domain.com
```

---

## Option 4: Deploy to Netlify + Render (Split Frontend/Backend)

For better performance, split the frontend and backend.

### Frontend on Netlify (Free)

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop the `frontend/dist` folder
3. Your app is live at `https://your-site.netlify.app`

### Backend on Render (Free)

1. Deploy backend as a Web Service (see Option 1)
2. Set `CORS` to allow your Netlify domain
3. Update frontend API calls to point to Render backend

---

## Before Deploying Checklist

- [ ] Change `JWT_SECRET` from default to something random
- [ ] Set `NODE_ENV` to `production`
- [ ] Build the frontend: `npm run build`
- [ ] Test locally: `npm start` and visit `http://localhost:3001`
- [ ] Make sure landing page is in `landing/` folder
- [ ] Make sure app is built in `frontend/dist`
- [ ] Update README with your domain
- [ ] Create a strong admin password

---

## Post-Deployment

### Add a Custom Domain

1. Buy a domain (e.g., `edupulsa.co.za` from domains.co.za)
2. Point DNS to your hosting provider
3. Add SSL certificate

### Monitoring

- Render has built-in logs
- For VPS: use `pm2 logs` or set up a monitoring service

### Backups

- SQLite database is in `backend/teacherhub.db`
- Set up automated backups: `cp backend/teacherhub.db backups/`

---

## Quick Start Commands

```bash
# Local development
cd backend && npm install && npm start
# In new terminal:
cd frontend && npm install && npm run dev
# Visit: http://localhost:5173

# Production build
cd frontend && npm run build
cd ../landing && cp -r ../frontend/dist/* .
cd ../backend && NODE_ENV=production npm start
# Visit: http://localhost:3001
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3001 in use | Change `PORT` in `backend/server.js` or kill the process |
| CORS errors | Make sure `cors()` is enabled in `backend/server.js` |
| 404 on refresh | Ensure Nginx/Render has `try_files` fallback |
| Database locked | Restart the server, or use a different SQLite file |
| Frontend not updating | Clear browser cache and rebuild |

---

## Next Steps

1. Deploy the app
2. Share the link with teachers
3. Collect feedback
4. Add features based on user requests
5. Consider upgrading to a paid plan for more resources

---

**Questions?** Check the README.md in the `edupulsa` folder for more details.
