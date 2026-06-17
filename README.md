# EduPlan SA

> South African Education Management Platform — Built for teachers, by teachers.

## 🎓 What is EduPlan SA?

EduPlan SA is a free, all-in-one web application designed specifically for **South African educators**. It helps teachers manage every aspect of their classroom life, from lesson planning to attendance tracking, all aligned with the **CAPS curriculum**.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🤖 AI Lesson Plans** | Generate complete CAPS-aligned lesson plans in seconds. Just enter grade, subject, and topic |
| **📊 Marks & Reports** | Record CASS tasks, exams, PAT projects. Calculate averages and export CSV reports |
| **📅 Attendance** | One-click daily attendance. Present, Absent, or Late. Save by class and date |
| **👨‍🎓 Student Management** | Full student rosters with filtering, search, and class assignment |
| **📚 Study Guides** | Generate CAPS-aligned study guides for exam prep with DBE references |
| **⭐ Student Rewards** | Give digital badges for Academic Excellence, Perfect Attendance, Leadership, etc. |
| **📋 Class Schedule** | Weekly timetable with SA subjects, grades, and time slots |
| **💬 Educator Chat** | Connect with fellow teachers by grade and subject |
| **🔐 Secure Login** | JWT-based authentication with protected routes |

---

## 🏗️ Architecture

```
edupulsa/
├── landing/              # Marketing website (this is what users see first)
│   └── index.html        # Beautiful landing page with features & CTA
├── frontend/             # React SPA (the app itself)
│   ├── src/
│   │   ├── pages/        # Dashboard, Classes, Marks, etc.
│   │   ├── components/   # Sidebar, Modal, Layout
│   │   ├── hooks/        # Data fetching hooks
│   │   ├── lib/          # SA constants (subjects, grades, provinces)
│   │   └── context/      # Auth context
│   └── dist/             # Production build
├── backend/              # Express API server
│   ├── server.js         # Entry point
│   ├── auth.js           # JWT authentication
│   ├── database.js       # SQLite setup
│   └── routes/           # API endpoints
└── DEPLOYMENT.md         # Full deployment guide
```

**Access Points:**
- `/` — Landing page (marketing)
- `/app` — The actual application (login required)
- `/api/*` — Backend API endpoints

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Node.js](https://nodejs.org/) 18+

### Start the Backend
```bash
cd backend
npm install
npm start
```
→ API runs on `http://localhost:3001`

### Start the Frontend
```bash
cd frontend
npm install
npm run dev
```
→ App runs on `http://localhost:5173`

### Or Use the Batch File (Easiest)
Double-click `Start EduPlan SA.bat` in the `edupulsa` folder. It opens both servers and the browser automatically.

---

## 📦 Deploy to Production

See **[DEPLOYMENT.md](DEPLOYMENT.md)** for full instructions.

### Quick Deploy (Render - Free)

1. Push to GitHub
2. Go to [render.com](https://render.com)
3. New Web Service → Connect your repo
4. Settings:
   - Root Directory: `backend`
   - Build Command: `cd ../frontend && npm install && npm run build && cd ../landing && cp -r ../frontend/dist/* . && cd ../backend && npm install`
   - Start Command: `npm start`
   - Environment: `NODE_ENV=production`, `JWT_SECRET=your-secret`
5. Click Create

**Live URLs:**
- `https://edupulsa.onrender.com` — Landing page
- `https://edupulsa.onrender.com/app` — The app

---

## 🎨 South African Curriculum

EduPlan SA is built around the South African education system:

- **Grades:** R, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
- **Subjects:** 50+ CAPS subjects including all Home Languages (isiZulu, isiXhosa, Afrikaans, Sesotho, Setswana, Sepedi, Tshivenda, Xitsonga)
- **Assessment Types:** CASS Tasks, PAT Projects, Controlled Tests, June/November Exams, Investigations
- **Resources:** DBE Workbooks, Siyavula, Mindset Learn, Past NSC Papers

---

## 🔑 Default Login (Demo)

| Field | Value |
|-------|-------|
| Email | `demo@teacherhub.com` |
| Password | `demo123` |

---

## 🛠️ Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **Backend:** Node.js + Express + SQLite3
- **Auth:** JWT + bcrypt
- **Design:** South African inspired (Teal, Sand, Gold)

---

## 📄 License

MIT — Free for personal and educational use.

---

**Empowering South African Education, One Classroom at a Time.** 🇿🇦
