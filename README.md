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
- Allow students to self check-in and time out using their NEU Google account

### User Flows

**Students / Faculty:**
1. Open the site → click **Continue with Google** using NEU email
2. Land on the **Check-In page** — enter Student ID, select purpose
3. Department/program dropdowns appear only if not yet set in profile
4. Submit → **"Welcome to NEU Library!"** success screen with name, purpose, time, and QR code
5. Student can **save their QR code** for faster future check-ins via librarian scan
6. Click **Time Out & Leave** when done → logged out → back to login

**Librarians / Admins:**
1. Login with Google using NEU email
2. Access full dashboard, logs, reports, and management tools
3. Can manually log visits via **Log Visit** page using student ID or QR scan

---

## 2. Features

### Authentication
- ✅ **Google Sign-In only** — NEU domain enforced (`@neu.edu.ph`)
- ✅ **"Welcome to NEU Library!"** greeting on successful login
- ✅ Blocked accounts auto signed-out with message to contact administrator
- ✅ Deleted accounts auto signed-out with error message

### Student Check-In Flow
- ✅ Google Sign-In → dedicated Check-In page (no dashboard access)
- ✅ Student ID auto-formats as XX-XXXXX-XXXX
- ✅ Department/program auto-filled if already set; dropdowns appear if not
- ✅ Purpose of Visit dropdown (defaults to Study / Review)
- ✅ Success screen: "Welcome to NEU Library!" with name, purpose, and check-in time
- ✅ **QR code generated** on success screen — downloadable as PNG
- ✅ **Time Out & Leave** button — logs time-out and signs out
- ✅ Check-in state **persists across page refresh** (localStorage)

### Dashboard (Staff/Admin)
- ✅ Real-time stat cards: Currently Inside, Total Today, Completed
- ✅ Live active visitors table with Time Out button and duration counter
- ✅ Today's visit log
- ✅ **Admin-only Visitor Statistics panel:**
  - Date range: Today, This Week, This Month, Custom (always visible date pickers)
  - Filter by purpose, college, employee type
  - 4 analytics cards + visit reasons bar chart

### Log Visit (Staff)
- ✅ Manual entry: Student ID (auto-format), Full Name, Purpose
- ✅ Default purpose: Study / Review
- ✅ Duplicate prevention — blocks logging a student already inside
- ✅ Name autosuggest from visit history
- ✅ **QR code scanner** — scan student's saved QR to auto-fill ID and name
- ✅ Dept/program dropdowns appear if student has none on file

### Visitor Logs (Staff/Admin)
- ✅ Date range presets (Today, This Week, This Month, All Time) + custom picker
- ✅ Search by name, ID, or purpose
- ✅ Status filter, CSV export
- ✅ Top 5 Visitors bar chart
- ✅ Time-out directly from logs page

### Reports (Staff/Admin)
- ✅ Monthly trend bar chart (last 6 months)
- ✅ Busiest days of week chart
- ✅ Peak hours chart (6AM–9PM)
- ✅ Visit reasons breakdown with horizontal bars
- ✅ College/department breakdown
- ✅ Top 8 visitors table with gold medals for top 3
- ✅ Period selector: This Week / This Month / Last 3 Months / This Year / Custom
- ✅ Export CSV + Print

### Manage Users (Admin)
- ✅ All users with role summary stats (Students, Faculty, Librarians, Admins)
- ✅ Role dropdown per user — updates Firestore instantly
- ✅ **Block / Unblock** users — blocked users cannot log in
- ✅ Search by name, email, or student ID
- ✅ Filter by role, department, sort by name/role/newest/oldest
- ✅ Result count + Clear filters button
- ✅ Admin cannot change or block their own account

---

## 3. Role-Based Access Control

| Feature | Student / Faculty | Librarian | Admin |
|---|:---:|:---:|:---:|
| Self Check-In (Google) | ✅ | ✅ | ✅ |
| Time Out self | ✅ | ✅ | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| Log Visit (manual/QR) | ❌ | ✅ | ✅ |
| Time-Out other visitors | ❌ | ✅ | ✅ |
| View all visitor logs | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ✅ | ✅ |
| Reports page | ❌ | ✅ | ✅ |
| Visitor statistics panel | ❌ | ❌ | ✅ |
| Manage user roles | ❌ | ❌ | ✅ |
| Block / Unblock users | ❌ | ❌ | ✅ |

> Students and faculty are redirected to the Check-In page after login. They never see the sidebar, dashboard, or any staff pages.

> All new Google accounts default to `student` role. Admins promote users via Manage Users — no Firestore Console access needed.

---

## 4. Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | react-router-dom v6 |
| Authentication | Firebase Authentication (Google Sign-In) |
| Database | Cloud Firestore (real-time via onSnapshot) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Styling | Inline CSS + CSS custom properties |
| Fonts | Poppins via Google Fonts |
| QR Code Generation | `qrcode` npm package |
| QR Code Scanning | Native BarcodeDetector API (Chrome/Android) |
| Notifications | react-hot-toast |
| Date Utilities | date-fns |

---

## 5. System Architecture

```
neu-library-logger/
├── public/
│   ├── neu-logo.png
│   └── login-bg.png
├── src/
│   ├── components/layout/Layout.jsx   # Sidebar + mobile nav (staff only)
│   ├── firebase/
│   │   ├── auth.js                    # Google login, logout, block
│   │   └── logs.js                    # Firestore CRUD + real-time listeners
│   ├── hooks/useAuth.jsx              # Auth context, blocked/deleted detection
│   ├── pages/
│   │   ├── LoginPage.jsx              # Google-only sign in
│   │   ├── StudentCheckIn.jsx         # Student check-in + QR + time out
│   │   ├── DashboardPage.jsx          # Live stats + admin analytics
│   │   ├── TimeInPage.jsx             # Manual log visit with QR scanner
│   │   ├── LogsPage.jsx               # Visitor logs with filters
│   │   ├── ReportsPage.jsx            # Analytics and charts
│   │   └── AdminPage.jsx              # Manage users
│   └── utils/
│       ├── helpers.js                 # Date formatters (PH timezone), purpose options
│       └── departments.js             # NEU colleges and programs
├── vercel.json
└── firestore.rules
```

### Important: Timezone Handling
All date operations use **local Philippine time (UTC+8)** by deriving dates from the `timeIn` Firestore timestamp rather than the stored `date` field. This ensures correct filtering regardless of when logs were created.

---

## 6. Database Structure

### `users` Collection
| Field | Type | Description |
|---|---|---|
| `uid` | string | Firebase Auth UID |
| `displayName` | string | Full name |
| `email` | string | NEU email |
| `role` | string | student / faculty / librarian / admin |
| `studentId` | string | XX-XXXXX-XXXX format |
| `department` | string | College code (e.g. CICS, CBE) |
| `program` | string | Degree program |
| `blocked` | boolean | If true, user cannot log in |
| `createdAt` | timestamp | Account creation date |

### `logs` Collection
| Field | Type | Description |
|---|---|---|
| `studentId` | string | Visitor's student ID |
| `studentName` | string | Visitor's full name |
| `purpose` | string | Reason for visit |
| `department` | string | Visitor's college |
| `program` | string | Visitor's program |
| `visitorRole` | string | Role at time of visit |
| `loggedBy` | string | Name of who logged the visit |
| `loggedByUid` | string | UID of who logged |
| `timeIn` | timestamp | Entry time (source of truth for date) |
| `timeOut` | timestamp / null | Exit time |
| `status` | string | `active` or `completed` |
| `date` | string | YYYY-MM-DD (legacy, may be UTC — use timeIn instead) |

---

## 7. Authentication & Security

### Login Method
- **Google Sign-In only** — restricted to `@neu.edu.ph` accounts via Firebase `hd` parameter
- All new accounts default to `student` role
- Role promotion is done by an Admin through Manage Users — no Firestore Console access needed

### Blocked Account Protection
When an admin blocks a user in Manage Users, `blocked: true` is set in Firestore. On next login attempt, `useAuth` detects this and immediately signs them out, showing:
> *"Your account has been blocked. Please contact the library administrator to regain access."*

Admins can unblock users anytime from Manage Users.

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
      allow update: if isStaff() || (isAuth() && resource.data.loggedByUid == request.auth.uid);
      allow delete: if isAdmin();
    }
  }
}
```

---

## 8. Pages & Functionality

### Login Page (`/login`)
- Single **Continue with Google** button
- NEU domain enforced — only `@neu.edu.ph` accounts accepted
- Shows error message for blocked or deleted accounts

### Student Check-In (`/checkin`)
- Shown to students/faculty after Google login
- Student ID with auto-format XX-XXXXX-XXXX
- Dept/program dropdowns appear only if not set in profile — saved on submit
- Success screen: welcome message, QR code, Save QR button, Time Out & Leave button
- State persists across refresh via localStorage — students stay on success screen until they time out

### Dashboard (`/dashboard`) — Staff/Admin
- 3 real-time stat cards: Currently Inside, Total Today, Completed
- Live active visitors table with duration counter and Time Out button
- Today's visit log
- Admin-only: Visitor Statistics panel with date range, filters, and bar chart

### Log Visit (`/time-in`) — Staff
- Manual entry with duplicate prevention and name autosuggest
- QR scanner button (Chrome/Android) — scans student's saved QR code

### Visitor Logs (`/logs`) — Staff
- Date presets + custom range, search, status filter
- Top 5 Visitors bar chart, CSV export, Time Out button per row
- Filters by local Philippine time — works correctly regardless of stored date field

### Reports (`/reports`) — Staff
- Monthly trend, busiest days, peak hours, purpose breakdown, college breakdown
- Top visitors table, print and export

### Manage Users (`/admin`) — Admin Only
- Search, filter by role/department, sort options
- Role change dropdown — updates Firestore instantly
- Block/Unblock button with confirmation modal
- Blocked users shown with red "Blocked" badge

---

## 9. Getting Started

```bash
git clone https://github.com/reneespina0929-tech/neu-library-logger.git
cd neu-library-logger
npm install
cp .env.example .env.local  # add Firebase config
npm run dev
```

### Firebase Setup
1. Enable **Authentication → Google Sign-In**
2. Add authorized domains: `localhost` and Vercel URL
3. Enable **Firestore** and apply security rules from Section 7

### Setting Up the First Admin
New accounts default to `student`. To create the first admin:
1. Register an account via Google Sign-In
2. Go to **Firebase Console → Firestore → users collection**
3. Find your document → change `role` to `"admin"`
4. After the first admin is set, all future role promotions can be done through **Manage Users**

---

## 10. Deployment

Push to `main` → Vercel auto-builds and deploys within ~60 seconds.

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## 11. Known Limitations

| Limitation | Details |
|---|---|
| QR Scanner | Chrome/Chromium only, requires physical camera |
| Logs Limit | Max 500 records per query |
| Auth Deletion | Blocking removes Firestore access but Firebase Auth account remains |
| Offline Support | No offline mode — requires active internet connection |
| Single Library | Designed for one branch only |
| Old Log Dates | Logs created before timezone fix may have wrong `date` field — filtering uses `timeIn` as source of truth |

---

## 12. Future Enhancements

- [ ] Seat capacity indicator
- [ ] RFID card support via USB reader
- [ ] QR scanner fallback for Safari/Firefox
- [ ] Multi-branch support
- [ ] Printable monthly reports
- [ ] Email notifications for blocked accounts

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