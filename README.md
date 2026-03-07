# 📚 LibraLog — NEU Library Logger

A clean, modern library visit tracking system for **New Era University**.  
Built with **React + Vite + Firebase** and deployed on **Vercel**.

---

## 🗂 Folder Structure

```
neu-library-logger/
├── public/
├── src/
│   ├── assets/              # Images, icons
│   ├── components/
│   │   ├── auth/            # (reserved for future auth components)
│   │   ├── dashboard/       # (reserved for dashboard widgets)
│   │   ├── layout/
│   │   │   └── Layout.jsx   # Sidebar + navigation wrapper
│   │   └── logs/            # (reserved for log components)
│   ├── firebase/
│   │   ├── config.js        # Firebase initialization
│   │   ├── auth.js          # Login / register / logout
│   │   └── logs.js          # Visit log CRUD operations
│   ├── hooks/
│   │   └── useAuth.js       # Auth context + custom hook
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── TimeInPage.jsx
│   │   ├── LogsPage.jsx
│   │   └── ProfilePage.jsx
│   ├── utils/
│   │   └── helpers.js       # Date/time formatters, constants
│   ├── App.jsx              # Routes
│   ├── main.jsx             # Entry point
│   └── index.css            # Global styles + CSS variables
├── .env.example             # Template for environment variables
├── .gitignore
├── firestore.rules          # Firestore security rules
├── index.html
├── package.json
├── vercel.json              # Vercel SPA routing fix
└── vite.config.js
```

---

## 🚀 Setup Guide (Step by Step)

### Step 1 — Install Node.js
Download and install from https://nodejs.org (choose the LTS version)

### Step 2 — Create a Firebase Project
1. Go to https://console.firebase.google.com
2. Click **"Add project"** → name it `neu-library-logger` → Continue
3. Disable Google Analytics (optional) → **Create project**

### Step 3 — Enable Firebase Services
**Authentication:**
1. Left sidebar → **Authentication** → Get started
2. Click **Email/Password** → Enable → Save

**Firestore Database:**
1. Left sidebar → **Firestore Database** → Create database
2. Choose **"Start in test mode"** (we'll add rules later) → Next
3. Pick a location close to you (e.g., `asia-southeast1`) → Enable

### Step 4 — Get Firebase Config Keys
1. Go to **Project Settings** (gear icon ⚙️ in sidebar)
2. Scroll to **"Your apps"** → Click **"</>"** (Web) icon
3. Register app name: `neu-library-logger-web`
4. Copy the `firebaseConfig` object values

### Step 5 — Set Up the Project Locally
```bash
# Clone or download the project, then:
cd neu-library-logger
npm install

# Create your environment file:
cp .env.example .env.local
```
Open `.env.local` and paste your Firebase values:
```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:123:web:abc
```

### Step 6 — Apply Firestore Security Rules
1. In Firebase Console → **Firestore Database** → **Rules** tab
2. Replace everything with the contents of `firestore.rules`
3. Click **Publish**

### Step 7 — Run Locally
```bash
npm run dev
```
Open http://localhost:5173 in your browser.

---

## 🌐 Deploy to Vercel

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
# Create a GitHub repo, then:
git remote add origin https://github.com/YOUR_USERNAME/neu-library-logger.git
git push -u origin main
```

### Step 2 — Import to Vercel
1. Go to https://vercel.com and sign in
2. Click **"Add New Project"** → Import your GitHub repo
3. Vercel will auto-detect Vite — no changes needed to build settings

### Step 3 — Add Environment Variables in Vercel
1. Before deploying, click **"Environment Variables"**
2. Add each variable from your `.env.local` file:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
3. Click **Deploy** 🎉

### Step 4 — Add your Vercel domain to Firebase
1. Copy your Vercel URL (e.g., `neu-library-logger.vercel.app`)
2. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
3. Click **Add domain** → paste your Vercel URL → Add

---

## 👥 User Roles
| Role | Can Log Time-In | Can Time-Out Visitors | View All Logs |
|------|:-:|:-:|:-:|
| Student | ✅ | ❌ | ✅ |
| Faculty | ✅ | ❌ | ✅ |
| Librarian | ✅ | ✅ | ✅ |
| Admin | ✅ | ✅ | ✅ |

---

## ✨ Features
- 🔐 Email/password authentication
- 📊 Real-time dashboard with live visitor count
- ⏱ Time-in / Time-out logging
- 🔍 Search & filter visit logs
- 📥 Export logs to CSV
- 👤 User profiles with personal visit history
- 📱 Responsive layout (mobile-friendly)
- 🔄 Real-time updates via Firestore listeners

---

Made for New Era University Library 📖
