# 📚 LibraLog — NEU Library Visit Logger

> A real-time, role-based library visit tracking system for **New Era University**.  
> Replaces manual paper logbooks with a modern, secure web application.

<br>

🌐 **Live Site:** [neu-library-logger.vercel.app](https://neu-library-logger.vercel.app)  
📁 **Repository:** [github.com/reneespina0929-tech/neu-library-logger](https://github.com/reneespina0929-tech/neu-library-logger)

---

## 📋 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Role-Based Access Control](#3-role-based-access-control)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Database Structure](#6-database-structure)
7. [Authentication & Security](#7-authentication--security)
8. [Pages & Functionality](#8-pages--functionality)
9. [Getting Started](#9-getting-started)
10. [Deployment](#10-deployment)
11. [Known Limitations](#11-known-limitations)
12. [Future Enhancements](#12-future-enhancements)
13. [Developer](#13-developer)

---

## 1. Project Overview

**LibraLog** is a web-based library visit logging system developed for the **New Era University (NEU) Library**. It digitizes and streamlines the process of recording student and faculty visits, replacing traditional paper logbooks with a real-time, role-based web application.

### Purpose
- Replace paper-based library logbooks with a digital system
- Provide real-time visibility into who is currently inside the library
- Enable librarians and admins to log, manage, and export visitor records
- Generate visit statistics and analytics for reporting
- Allow students to generate a personal QR code for faster check-in

### Target Users
| User | Description |
|---|---|
| Students & Faculty | Log their own library visits, generate QR codes, view personal visit history |
| Librarians | Time-in and time-out all visitors, view and manage all logs, export CSV reports |
| Admins | Full access including user management, visitor statistics, and analytics dashboard |

---

## 2. Features

### Authentication
- ✅ Email and password login restricted to `@neu.edu.ph` domain
- ✅ **Google Sign-In** with NEU email domain enforcement
- ✅ **"Welcome to NEU Library!"** greeting on successful login
- ✅ Forgot Password — Firebase email reset link
- ✅ Change Password with current password re-authentication

### Dashboard
- ✅ Real-time stats: currently inside, total today, completed visits
- ✅ Live table of active visitors with pulsing indicator
- ✅ Live duration counter (updates every 30 seconds without refresh)
- ✅ **Admin-only Visitor Statistics panel** with:
  - Filter by date range: Today, This Week, This Month, Custom
  - Filter by reason for visiting
  - Filter by college / department
  - Filter by employee type (Teacher / Staff)
  - Stat cards: Total Visits, Currently Inside, Completed, Average Duration
  - Visit reasons bar chart breakdown

### Log Visit (Time-In)
- ✅ Staff log visits by entering Student ID, Full Name, and Purpose
- ✅ Student ID auto-formats as XX-XXXXX-XXXX (digits only)
- ✅ Default purpose pre-selected as "Study / Review" for faster entry
- ✅ Duplicate prevention — blocks logging a student already inside
- ✅ Name autosuggest from visit history for returning students
- ✅ QR code scanning (Chrome/Android) to auto-fill Student ID and Name

### Visitor Logs
- ✅ Full paginated visit history (Librarian/Admin only)
- ✅ Preset filters: Today, This Week, This Month, All Time
- ✅ Custom date range picker
- ✅ Search by student name, ID, or purpose
- ✅ Filter by status: All, Currently Inside, Completed
- ✅ Top 5 Visitors bar chart for selected range
- ✅ Visit count badge on frequent visitors
- ✅ Edit log entries (correct name, ID, or purpose)
- ✅ Time-out directly from Logs page
- ✅ Export to CSV with date range in filename

### Profile Page
- ✅ Edit display name and Student ID (updates instantly, no refresh needed)
- ✅ Select Department and Program
- ✅ QR Code generation — encodes `studentId|studentName`
- ✅ Enlarge QR in fullscreen modal
- ✅ Download QR as PNG
- ✅ Personal visit history

### Admin — Manage Users
- ✅ List all registered users with role summary stats
- ✅ Change user roles instantly (Student, Faculty, Librarian, Admin)
- ✅ Delete users with confirmation modal (visit logs preserved)
- ✅ Search users by name, email, or student ID
- ✅ Admin cannot change or delete their own account

### General
- ✅ Fully responsive — mobile and desktop layouts
- ✅ Departments and programs dropdown (CICS, CAS, CBE, COE, etc.)
- ✅ Real-time data via Firestore `onSnapshot` listeners

---

## 3. Role-Based Access Control

| Feature | Student | Faculty | Librarian | Admin |
|---|:---:|:---:|:---:|:---:|
| Time-In (self) | ✅ | ✅ | ✅ | ✅ |
| Time-Out visitors | ❌ | ❌ | ✅ | ✅ |
| View all visitor logs | ❌ | ❌ | ✅ | ✅ |
| Edit log entries | ❌ | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ❌ | ✅ | ✅ |
| View visitor statistics | ❌ | ❌ | ❌ | ✅ |
| Manage user roles | ❌ | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ❌ | ✅ |

> **Note:** All new accounts are assigned the `student` role by default. Role promotion is done by an Admin through the Manage Users page.

---

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | react-router-dom v6 |
| Authentication | Firebase Authentication (Email/Password + Google) |
| Database | Cloud Firestore (NoSQL, real-time) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Styling | Inline CSS + CSS custom properties (no external framework) |
| Fonts | Poppins via Google Fonts |
| QR Code Generation | `qrcode` npm package |
| QR Code Scanning | Native BarcodeDetector API (Chrome/Android) |
| Notifications | react-hot-toast |
| Date Utilities | date-fns |

---

## 5. System Architecture

```
neu-library-logger/
├── public/                        # Static assets
│   ├── neu-logo.png               # NEU seal logo
│   ├── login-bg.png               # Login page background
│   └── favicon.ico                # Browser tab icon
├── src/
│   ├── components/
│   │   ├── layout/Layout.jsx      # Sidebar, mobile nav, page shell
│   │   └── QrScanner.jsx          # Camera-based QR scanner
│   ├── firebase/
│   │   ├── config.js              # Firebase initialization
│   │   ├── auth.js                # Auth functions (login, register, Google, reset)
│   │   └── logs.js                # Firestore CRUD and real-time listeners
│   ├── hooks/
│   │   └── useAuth.jsx            # Auth context and user profile hook
│   ├── pages/
│   │   ├── LoginPage.jsx          # Sign in + Google login + forgot password
│   │   ├── RegisterPage.jsx       # Account registration with dept/program
│   │   ├── DashboardPage.jsx      # Live stats + admin analytics panel
│   │   ├── TimeInPage.jsx         # Log a visit (manual or QR scan)
│   │   ├── LogsPage.jsx           # Full visit history with filters
│   │   ├── ProfilePage.jsx        # Profile, QR code, change password
│   │   └── AdminPage.jsx          # User management (admin only)
│   └── utils/
│       ├── helpers.js             # Date formatters, purpose options
│       └── departments.js         # NEU colleges and programs data
├── vercel.json                    # SPA routing config
└── firestore.rules                # Firestore security rules
```

### Data Flow
1. User authenticates via Firebase Authentication (email/password or Google)
2. `useAuth` hook fetches user profile from Firestore `users` collection
3. Role stored in user profile controls UI visibility and route access
4. Real-time Firestore `onSnapshot` listeners push live updates to components
5. All write operations go through `firebase/logs.js` and `firebase/auth.js`

---

## 6. Database Structure

### `users` Collection
| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Auth UID |
| `displayName` | string | Full name |
| `email` | string | NEU email address |
| `role` | string | student / faculty / librarian / admin |
| `studentId` | string | Student ID in XX-XXXXX-XXXX format |
| `department` | string | College code (e.g. CICS, CAS) |
| `program` | string | Degree program |
| `createdAt` | timestamp | Account creation date |

### `logs` Collection
| Field | Type | Description |
|---|---|---|
| `studentId` | string | Visitor's student ID |
| `studentName` | string | Visitor's full name |
| `purpose` | string | Reason for visit |
| `loggedBy` | string | Name of staff who logged the visit |
| `loggedByUid` | string | UID of staff who logged the visit |
| `timeIn` | timestamp | Time of entry |
| `timeOut` | timestamp / null | Time of exit (null if still inside) |
| `status` | string | `active` or `completed` |
| `date` | string | Date in YYYY-MM-DD format (for filtering) |
| `editedAt` | timestamp | Last edit timestamp (if edited) |

---

## 7. Authentication & Security

### Login Methods
- **Email/Password** — restricted to `@neu.edu.ph` domain at registration
- **Google Sign-In** — restricted to `@neu.edu.ph` Google accounts via `hd` parameter

### Firestore Security Rules
```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuth() { return request.auth != null; }
    function isAdmin() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == "admin";
    }
    function isStaff() {
      return isAuth() && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ["admin", "librarian"];
    }

    match /users/{userId} {
      allow read: if isAuth();
      allow create: if isAuth() && request.auth.uid == userId;
      allow update: if isAuth() && (request.auth.uid == userId || isAdmin());
      allow delete: if isAdmin();
    }

    match /logs/{logId} {
      allow read: if isAuth();
      allow create: if isAuth();
      allow update: if isStaff();
      allow delete: if isAdmin();
    }
  }
}
```

### Environment Variables
All Firebase credentials are stored as environment variables — never committed to the repository:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

## 8. Pages & Functionality

### Login Page (`/login`)
- Email/password login with `@neu.edu.ph` validation
- Google Sign-In button (NEU domain enforced)
- "Welcome to NEU Library!" toast on successful login
- Forgot password flow — sends Firebase reset email
- Building background photo with dark overlay

### Register Page (`/register`)
- Full name, NEU email, department, program, password
- Department dropdown cascades into program list
- Email domain validated on submission
- All new accounts start as `student` role

### Dashboard (`/dashboard`)
- Greeting with current date
- 3 stat cards: Currently Inside, Total Today, Completed
- Live active visitors table with Time Out button (staff only)
- Today's visit log (last 20 entries)
- **Admin statistics panel** (admin only):
  - Date range selector (Today / This Week / This Month / Custom)
  - Filters: Purpose, College, Employee Type
  - 4 analytics cards + visit reasons bar chart

### Log Visit (`/time-in`)
- Student ID field with auto-format (XX-XXXXX-XXXX)
- Full Name field with autosuggest from history
- Purpose dropdown (defaults to "Study / Review")
- Duplicate check — prevents double time-in
- Scan QR button for camera-based auto-fill

### Visitor Logs (`/logs`) — Staff Only
- Full history with date range presets and custom picker
- Search, status filter, and export to CSV
- Top 5 Visitors analytics bar
- Edit ✏️ and Time Out 🕐 action buttons per row

### Profile Page (`/profile`)
- Edit name, Student ID, department, program
- All edits reflect instantly without page refresh
- QR code generation (enlarge + download)
- Change password with re-authentication
- Personal visit history

### Manage Users (`/admin`) — Admin Only
- All users listed with role summary stats
- Role dropdown per user (saves instantly)
- Delete user with confirmation modal
- Search by name, email, or student ID

---

## 9. Getting Started

### Prerequisites
- Node.js v18+
- Firebase project with Authentication and Firestore enabled
- Google Sign-In enabled in Firebase Authentication

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
# Open http://localhost:5173
```

### Firebase Setup
1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → Sign-in methods → **Email/Password** and **Google**
3. Add authorized domains: `localhost` and your Vercel URL
4. Enable **Firestore Database** and apply the security rules from Section 7
5. Copy your Firebase config to `.env.local`

---

## 10. Deployment

LibraLog uses a continuous deployment pipeline:

1. Developer pushes to `main` branch on GitHub
2. Vercel detects the push and triggers a new build
3. Vite builds the React app for production
4. Built assets deploy to Vercel's global CDN
5. Live URL updates within ~60 seconds

### `vercel.json` — SPA Routing
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```
This ensures direct URL access (e.g. `/dashboard`) works correctly instead of returning 404.

---

## 11. Known Limitations

| Limitation | Details |
|---|---|
| QR Scanner | Requires Chrome or a Chromium-based browser with a physical camera |
| Logs Limit | Fetches a maximum of 500 records per query |
| Initial Admin | First admin must be set manually via Firebase Console |
| Offline Support | No offline mode — requires active internet connection |
| Single Library | Designed for one library branch only |
| College Filter | Stats college filter requires department to be stored on log entries |

---

## 12. Future Enhancements

- [ ] Announcement / notice board for library staff
- [ ] Seat capacity indicator (e.g. "32 / 50 seats")
- [ ] Monthly visit analytics and printable reports
- [ ] QR scanner fallback for Safari and Firefox
- [ ] Multi-branch library support
- [ ] Email notifications for visit confirmations

---

## 13. Developer

**Rene Espina**  
New Era University — College of Information and Computing Sciences  
GitHub: [@reneespina0929-tech](https://github.com/reneespina0929-tech)

---

**Institution:** New Era University Library, Quezon City, Philippines  
**Academic Year:** 2025–2026

---

*© 2026 New Era University · All rights reserved*