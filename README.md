# 📚 LibraLog — NEU Library Visit Logger

> A real-time, role-based library visit tracking system for **New Era University**.  
> Replaces manual paper logbooks with a modern web application.

<br>

🌐 **Live Site:** [neu-library-logger.vercel.app](https://neu-library-logger.vercel.app)

---

## 📸 Preview

| Login Page | Dashboard | Visitor Logs |
|:---:|:---:|:---:|
| ![Login](docs/preview-login.png) | ![Dashboard](docs/preview-dashboard.png) | ![Logs](docs/preview-logs.png) |

---

## ✨ Features

- 🔐 **Authentication** — Email/password login restricted to `@neu.edu.ph` accounts
- 👥 **Role-Based Access** — Student, Faculty, Librarian, and Admin roles
- ⏱️ **Time-In / Time-Out Logging** — Real-time visit tracking
- 📷 **QR Code System** — Students generate a personal QR; staff scan to auto-fill
- 🔍 **Duplicate Prevention** — Blocks logging a student who is already inside
- 📋 **Visitor Logs** — Full history with date range filters and CSV export
- 📊 **Top Visitors Analytics** — Bar chart of most frequent visitors
- 👤 **Profile Page** — Edit name, Student ID, change password, view visit history
- 🛠️ **Admin Panel** — Manage user roles, remove accounts
- 📱 **Fully Responsive** — Works on mobile and desktop
- 🔑 **Forgot / Reset Password** — Firebase email reset flow

---

## 🔐 Role Access

| Feature | Student | Faculty | Librarian | Admin |
|---|:---:|:---:|:---:|:---:|
| Time-In (self) | ✅ | ✅ | ✅ | ✅ |
| Time-Out visitors | ❌ | ❌ | ✅ | ✅ |
| View all visitor logs | ❌ | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ❌ | ✅ | ✅ |
| Edit log entries | ❌ | ❌ | ✅ | ✅ |
| Manage user roles | ❌ | ❌ | ❌ | ✅ |
| Remove users | ❌ | ❌ | ❌ | ✅ |

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Routing | react-router-dom v6 |
| Authentication | Firebase Authentication |
| Database | Cloud Firestore |
| Hosting | Vercel |
| Styling | Inline CSS + CSS Variables |
| Fonts | Poppins (Google Fonts) |
| QR Code | `qrcode` npm package |
| QR Scanner | Native BarcodeDetector API |
| Notifications | react-hot-toast |
| Date Utilities | date-fns |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- A Firebase project with Authentication and Firestore enabled

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/reneespina0929-tech/neu-library-logger.git
cd neu-library-logger

# 2. Install dependencies
npm install

# 3. Create environment variables
cp .env.example .env.local
# Fill in your Firebase config values

# 4. Start the development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

## 🗂️ Project Structure

```
neu-library-logger/
├── public/                  # Static assets (logo, favicon, bg image)
├── src/
│   ├── components/
│   │   ├── layout/          # Sidebar, mobile nav
│   │   └── QrScanner.jsx    # Camera QR scanner
│   ├── firebase/
│   │   ├── config.js        # Firebase initialization
│   │   ├── auth.js          # Auth functions
│   │   └── logs.js          # Firestore CRUD
│   ├── hooks/
│   │   └── useAuth.jsx      # Auth context
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── RegisterPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── TimeInPage.jsx
│   │   ├── LogsPage.jsx
│   │   ├── ProfilePage.jsx
│   │   └── AdminPage.jsx
│   └── utils/
│       └── helpers.js       # Formatters and constants
├── vercel.json              # SPA routing config
└── firestore.rules          # Security rules
```

---

## 📄 Documentation

Full technical documentation is available in the repository:  
📎 [`LibraLog-Documentation.pdf`](./LibraLog-Documentation.pdf)

---

## 🔒 Firestore Security Rules

- Users can only read/write their own profile
- Admins can read, update, and delete any user profile
- Authenticated users can create log entries
- Only Librarians and Admins can update or delete logs

---

## 🌱 Planned Features

- [ ] Announcement / notice board for library staff
- [ ] Seat capacity indicator
- [ ] RFID card support via USB reader
- [ ] Visit purpose analytics dashboard
- [ ] QR scanner fallback for Safari/Firefox
- [ ] Multi-branch library support

---

## 👨‍💻 Developer

**Rene Espina**  
New Era University — College of Computer Studies  
GitHub: [@reneespina0929-tech](https://github.com/reneespina0929-tech)

---

## 🏫 Institution

**New Era University Library**  
Quezon City, Philippines  

---

*© 2026 New Era University · All rights reserved*