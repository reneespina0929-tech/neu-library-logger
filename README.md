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
4. [Hybrid Accounts](#4-hybrid-accounts)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture](#6-system-architecture)
7. [Database Structure](#7-database-structure)
8. [Authentication & Security](#8-authentication--security)
9. [Pages & Functionality](#9-pages--functionality)
10. [Getting Started](#10-getting-started)
11. [Deployment](#11-deployment)
12. [Known Limitations](#12-known-limitations)
13. [Future Enhancements](#13-future-enhancements)
14. [Developer](#14-developer)

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
- ✅ **Google Sign-In** with NEU email domain enforcement (`@neu.edu.ph` only)
- ✅ **"Welcome to NEU Library!"** greeting toast on every successful login
- ✅ Forgot Password — Firebase email reset link
- ✅ Change Password with current password re-authentication
- ✅ Deleted accounts are automatically blocked — forced sign-out with error message

### Registration
- ✅ Full name, NEU email, department, program, password
- ✅ Department dropdown cascades into program list (all NEU colleges included)
- ✅ Department and program saved to profile on registration
- ✅ Email domain validated — only `@neu.edu.ph` accepted
- ✅ All new accounts start as `student` role by default

### Dashboard
- ✅ Personalized greeting with current date
- ✅ 3 real-time stat cards: Currently Inside, Total Today, Completed
- ✅ Live active visitors table with pulsing indicator
- ✅ Duration counter updates every 30 seconds without page refresh
- ✅ Time Out button on active visitors (Librarian/Admin only)
- ✅ Today's visit log (last 20 entries)
- ✅ **Admin-only Visitor Statistics panel:**
  - Date range: Today, This Week, This Month, Custom
  - Filter by reason for visiting (purpose)
  - Filter by college / department
  - Filter by employee type (Teacher / Staff)
  - 4 analytics cards: Total Visits, Currently Inside, Completed, Average Duration
  - Visit reasons breakdown bar chart

### Log Visit (Time-In)
- ✅ Student ID auto-formats as XX-XXXXX-XXXX (digits only, dashes auto-inserted)
- ✅ Default purpose pre-selected as "Study / Review" for faster entry
- ✅ Duplicate prevention — blocks logging a student already inside
- ✅ Name autosuggest from visit history for returning students
- ✅ QR code scanning (Chrome/Android) to auto-fill Student ID and Name
- ✅ Department and program auto-saved on log entry for analytics
- ✅ **If student has no department on file** — department/program dropdowns appear and save to both the log and the student's profile

### Visitor Logs
- ✅ Full visit history (Librarian/Admin only)
- ✅ Preset date filters: Today, This Week, This Month, All Time
- ✅ Custom date range picker
- ✅ Search by student name, ID, or purpose
- ✅ Filter by status: All, Currently Inside, Completed
- ✅ Top 5 Visitors bar chart for selected range
- ✅ Visit count badge on frequent visitors
- ✅ Edit log entries (correct name, ID, or purpose)
- ✅ Time-out directly from Logs page
- ✅ Export to CSV with date range in filename

### Profile Page
- ✅ Edit display name, Student ID, Department, and Program
- ✅ All edits reflect instantly without page refresh
- ✅ QR Code generation — tap to enlarge, download as PNG
- ✅ Change password with re-authentication
- ✅ Personal visit history

### Admin — Manage Users
- ✅ List all registered users with role summary stats (Students, Faculty, Librarians, Admins)
- ✅ Change user roles instantly via dropdown
- ✅ Delete users with confirmation modal (visit logs are preserved)
- ✅ Search users by name, email, or student ID
- ✅ Admin cannot change or delete their own account

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
| Switch roles on the fly | ❌ | ❌ | ❌ | Hybrid only |

> All new accounts are assigned the `student` role by default. Role promotion is done by an Admin through the Manage Users page.

---

## 4. Hybrid Accounts

Certain accounts can **switch between Student and Admin roles on the fly** directly from the sidebar — without going through the Manage Users page.

**Hybrid accounts:**
- `rene.espina@neu.edu.ph`
- `jcesperanza@neu.edu.ph`

### How it works
1. Log in with a hybrid account (email/password or Google)
2. A **Switch Role** toggle appears in the sidebar above the user card
3. Click **Student** or **Admin** to switch instantly
4. The entire UI updates — sidebar navigation, dashboard panels, and access permissions all change to match the selected role
5. The role is saved to Firestore so it persists across page refreshes

### Why this exists
These accounts serve as both regular user demonstrations and administrative accounts, allowing role behavior to be shown without needing separate logins.

---

## 5. Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | react-router-dom v6 |
| Authentication | Firebase Authentication (Email/Password + Google Sign-In) |
| Database | Cloud Firestore (NoSQL, real-time via onSnapshot) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Styling | Inline CSS + CSS custom properties (no external CSS framework) |
| Fonts | Poppins via Google Fonts |
| QR Code Generation | `qrcode` npm package |
| QR Code Scanning | Native BarcodeDetector API (Chrome/Android) |
| Notifications | react-hot-toast |
| Date Utilities | date-fns |

---

## 6. System Architecture

```
neu-library-logger/
├── public/
│   ├── neu-logo.png               # NEU seal logo
│   ├── login-bg.png               # Login/register background photo
│   └── favicon.ico                # Browser tab icon
├── src/
│   ├── components/
│   │   ├── layout/Layout.jsx      # Sidebar, mobile nav, role switcher
│   │   └── QrScanner.jsx          # Camera-based QR scanner
│   ├── firebase/
│   │   ├── config.js              # Firebase initialization
│   │   ├── auth.js                # Auth functions (login, Google, register, reset, delete)
│   │   └── logs.js                # Firestore CRUD and real-time listeners
│   ├── hooks/
│   │   └── useAuth.jsx            # Auth context, hybrid role switching, deleted account detection
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
1. User authenticates via Firebase (email/password or Google)
2. `useAuth` hook listens to Firestore profile via `onSnapshot` for real-time updates
3. Role stored in user profile controls UI visibility and route access
4. Hybrid accounts can override their active role without a separate login
5. Deleted accounts are detected automatically and forced to sign out

---

## 7. Database Structure

### `users` Collection
| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Auth UID |
| `displayName` | string | Full name |
| `email` | string | NEU email address |
| `role` | string | student / faculty / librarian / admin |
| `studentId` | string | Student ID in XX-XXXXX-XXXX format |
| `department` | string | College code (e.g. CICS, CBE, CAS) |
| `program` | string | Degree program |
| `createdAt` | timestamp | Account creation date |

### `logs` Collection
| Field | Type | Description |
|---|---|---|
| `studentId` | string | Visitor's student ID |
| `studentName` | string | Visitor's full name |
| `purpose` | string | Reason for visit |
| `department` | string | Visitor's college (auto-looked up on time-in) |
| `program` | string | Visitor's program |
| `visitorRole` | string | Visitor's role at time of visit |
| `loggedBy` | string | Name of staff who logged the visit |
| `loggedByUid` | string | UID of staff who logged the visit |
| `timeIn` | timestamp | Time of entry |
| `timeOut` | timestamp / null | Time of exit (null if still inside) |
| `status` | string | `active` or `completed` |
| `date` | string | YYYY-MM-DD (for client-side date filtering) |
| `editedAt` | timestamp | Set when a log entry is edited |

---

## 8. Authentication & Security

### Login Methods
- **Email/Password** — restricted to `@neu.edu.ph` at registration
- **Google Sign-In** — restricted to `@neu.edu.ph` Google accounts via `hd` parameter

### Deleted Account Protection
When an admin deletes a user from Manage Users, their Firestore profile is removed. On next login attempt, `useAuth` detects the missing profile and immediately signs them out, showing:
> *"Your account has been removed. Please contact the library administrator."*

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
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

---

## 9. Pages & Functionality

### Login Page (`/login`)
- Email/password login with `@neu.edu.ph` validation
- **Google Sign-In** button — NEU domain enforced
- **"Welcome to NEU Library!"** toast on successful login
- Forgot password flow — sends Firebase reset email
- Building background photo with dark overlay
- Error message shown if account has been deleted by admin

### Register Page (`/register`)
- Full name, NEU email, department, program, password
- Department dropdown cascades into program list
- Both department and program are required and saved on registration
- All new accounts start as `student` role

### Dashboard (`/dashboard`)
- Personalized greeting with current date and time of day
- 3 stat cards: Currently Inside, Total Today, Completed
- Live active visitors table — duration updates every 30 seconds
- Time Out button for staff on active visitors
- Today's visit log (last 20 entries)
- **Admin-only statistics panel:**
  - Date range: Today / This Week / This Month / Custom
  - Filters: Purpose, College, Employee Type (Teacher/Staff)
  - 4 stat cards + visit reasons bar chart

### Log Visit (`/time-in`)
- Auto-formatted Student ID field (XX-XXXXX-XXXX)
- Name autosuggest from visit history
- Default purpose: Study / Review
- Duplicate visit prevention with warning banner
- QR scan button (Chrome/Android)
- Department/program dropdowns appear if student has none on file — saved to profile on submit

### Visitor Logs (`/logs`) — Staff Only
- Date range presets + custom picker
- Search, status filter, CSV export
- Top 5 Visitors bar chart
- Edit ✏️ and Time Out 🕐 per row

### Profile Page (`/profile`)
- Edit name, Student ID, department, program — updates instantly
- QR code — tap to enlarge, download as PNG
- Change password with re-authentication
- Personal visit history

### Manage Users (`/admin`) — Admin Only
- All users with role summary stats
- Role dropdown per user
- Delete user with confirmation modal
- Search by name, email, or student ID

---

## 10. Getting Started

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
2. Enable **Authentication → Sign-in methods → Email/Password** and **Google**
3. Under Google sign-in, add your domain to authorized domains
4. Add authorized domains: `localhost` and your Vercel URL
5. Enable **Firestore Database** and apply the security rules from Section 8
6. Copy your Firebase config to `.env.local`

### Setting Up the First Admin
New accounts default to `student`. To create the first admin:
1. Register an account normally
2. Go to **Firebase Console → Firestore → users collection**
3. Find the document for your account
4. Change the `role` field to `admin`

---

## 11. Deployment

LibraLog uses a continuous deployment pipeline:

1. Developer pushes to `main` branch on GitHub
2. Vercel detects the push and triggers a new build
3. Vite builds the React app for production
4. Built assets deploy to Vercel's global CDN
5. Live URL updates within ~60 seconds

### `vercel.json`
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## 12. Known Limitations

| Limitation | Details |
|---|---|
| QR Scanner | Requires Chrome or Chromium-based browser with a physical camera |
| Logs Limit | Fetches maximum 500 records per query |
| College Filter | Only works for logs created after department tracking was added |
| Initial Admin | First admin must be set manually via Firebase Console |
| Offline Support | No offline mode — requires active internet connection |
| Single Library | Designed for one library branch only |

---

## 13. Future Enhancements

- [ ] Announcement / notice board for library staff
- [ ] Seat capacity indicator (e.g. "32 / 50 seats")
- [ ] RFID card support via USB reader
- [ ] Printable monthly visit reports
- [ ] QR scanner fallback for Safari and Firefox
- [ ] Multi-branch library support
- [ ] Email notifications for visit confirmations

---

## 14. Developer

**Rene Espina**  
New Era University — College of Information and Computing Sciences  
GitHub: [@reneespina0929-tech](https://github.com/reneespina0929-tech)

---

**Institution:** New Era University Library, Quezon City, Philippines  
**Academic Year:** 2025–2026

---

*© 2026 New Era University · All rights reserved*