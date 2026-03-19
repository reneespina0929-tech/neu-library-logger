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
- Allow students to check in quickly using their NEU Google account

### User Flows

**Students / Faculty:**
1. Open the site → click **Continue with Google** using NEU email
2. Land on the **Check-In page** — enter Student ID, select purpose (dept/program auto-filled if already set)
3. Submit → **"Welcome to NEU Library!"** success screen
4. Auto signed out after 5 seconds → back to login for next student

**Librarians / Admins:**
1. Login with email/password or Google
2. Access full dashboard, logs, reports, and management tools

---

## 2. Features

### Authentication
- ✅ **Google Sign-In** — primary login for all users (NEU domain enforced)
- ✅ Email/password login — for staff accounts
- ✅ **"Welcome to NEU Library!"** greeting on successful login
- ✅ Forgot Password — Firebase email reset link
- ✅ Deleted accounts automatically blocked — forced sign-out with error message

### Student Check-In Flow
- ✅ Google Sign-In → lands on dedicated Check-In page (no dashboard access)
- ✅ Student ID field with auto-format XX-XXXXX-XXXX
- ✅ Department and program auto-fill if already set; dropdowns appear if not
- ✅ Purpose of Visit dropdown (defaults to Study / Review)
- ✅ Success screen with name, purpose, and check-in time
- ✅ Auto sign-out after 5 seconds → back to login

### Dashboard (Staff/Admin only)
- ✅ Real-time stat cards: Currently Inside, Total Today, Completed
- ✅ Live active visitors table with Time Out button
- ✅ Duration counter updates every 30 seconds without refresh
- ✅ Today's visit log
- ✅ **Admin-only Visitor Statistics panel:**
  - Date range: Today, This Week, This Month, Custom
  - Filter by purpose, college, employee type
  - 4 analytics cards + visit reasons bar chart

### Log Visit (Staff)
- ✅ Manual entry: Student ID, Full Name, Purpose
- ✅ Student ID auto-format XX-XXXXX-XXXX
- ✅ Default purpose: Study / Review
- ✅ Duplicate prevention — blocks logging a student already inside
- ✅ Name autosuggest from visit history
- ✅ QR code scanning (Chrome/Android)
- ✅ Dept/program dropdowns appear if student has none on file

### Visitor Logs (Staff/Admin)
- ✅ Date range presets + custom picker
- ✅ Search, status filter, CSV export
- ✅ Top 5 Visitors bar chart
- ✅ Time-out directly from logs page

### Reports (Staff/Admin)
- ✅ Monthly trend bar chart (last 6 months)
- ✅ Busiest days of week chart
- ✅ Peak hours chart (6AM–9PM)
- ✅ Visit reasons breakdown
- ✅ College/department breakdown
- ✅ Top 8 visitors table
- ✅ Period selector: This Week / This Month / Last 3 Months / This Year / Custom
- ✅ Export CSV + Print

### Profile Page (Staff)
- ✅ Edit name, Student ID, department, program
- ✅ QR code generation — tap to enlarge, download
- ✅ Change password
- ✅ Personal visit history

### Admin — Manage Users
- ✅ All users with role summary stats
- ✅ Role dropdown per user (saves instantly)
- ✅ Delete user with confirmation modal
- ✅ Search by name, email, or student ID

---

## 3. Role-Based Access Control

| Feature | Student / Faculty | Librarian | Admin |
|---|:---:|:---:|:---:|
| Check-In (self via Google) | ✅ | ✅ | ✅ |
| Dashboard | ❌ | ✅ | ✅ |
| Log Visit (manual/QR) | ❌ | ✅ | ✅ |
| Time-Out visitors | ❌ | ✅ | ✅ |
| View all visitor logs | ❌ | ✅ | ✅ |
| Export CSV | ❌ | ✅ | ✅ |
| Reports page | ❌ | ✅ | ✅ |
| View visitor statistics | ❌ | ❌ | ✅ |
| Manage user roles | ❌ | ❌ | ✅ |
| Delete users | ❌ | ❌ | ✅ |
| Switch roles on the fly | ❌ | ❌ | Hybrid only |

> Students and faculty are redirected to the Check-In page after login. They never see the sidebar, dashboard, or any staff pages.

---

## 4. Hybrid Accounts

Certain accounts can **switch between Student and Admin roles** directly from the sidebar or the Check-In page.

**Hybrid accounts:**
- `rene.espina@neu.edu.ph`
- `jcesperanza@neu.edu.ph`
- `internship@neu.edu.ph`

Switching to **Student** → redirects to Check-In flow  
Switching to **Admin** → redirects to Dashboard with full access

---

## 5. Technology Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Routing | react-router-dom v6 |
| Authentication | Firebase Authentication (Email/Password + Google) |
| Database | Cloud Firestore (real-time via onSnapshot) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Styling | Inline CSS + CSS custom properties |
| Fonts | Poppins via Google Fonts |
| QR Code | `qrcode` npm package |
| QR Scanner | Native BarcodeDetector API (Chrome/Android) |
| Notifications | react-hot-toast |
| Date Utilities | date-fns |

---

## 6. System Architecture

```
neu-library-logger/
├── public/
│   ├── neu-logo.png
│   └── login-bg.png
├── src/
│   ├── components/layout/Layout.jsx   # Sidebar + mobile nav (staff only)
│   ├── firebase/
│   │   ├── auth.js                    # Login, Google, register, delete
│   │   └── logs.js                    # Firestore CRUD + listeners
│   ├── hooks/useAuth.jsx              # Auth context + hybrid role switching
│   ├── pages/
│   │   ├── LoginPage.jsx              # Google + email/password login
│   │   ├── StudentCheckIn.jsx         # Student check-in flow (no sidebar)
│   │   ├── DashboardPage.jsx          # Staff dashboard + admin stats
│   │   ├── TimeInPage.jsx             # Manual log visit (staff)
│   │   ├── LogsPage.jsx               # Visitor logs with filters
│   │   ├── ReportsPage.jsx            # Analytics and charts
│   │   ├── ProfilePage.jsx            # Profile + QR code
│   │   └── AdminPage.jsx              # Manage users
│   └── utils/
│       ├── helpers.js
│       └── departments.js             # NEU colleges and programs
├── vercel.json
└── firestore.rules
```

---

## 7. Database Structure

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
| `loggedBy` | string | Name of staff/student who logged |
| `loggedByUid` | string | UID of who logged |
| `timeIn` | timestamp | Entry time |
| `timeOut` | timestamp / null | Exit time |
| `status` | string | `active` or `completed` |
| `date` | string | YYYY-MM-DD |

---

## 8. Authentication & Security

### Login Methods
- **Google Sign-In** — for all users, NEU domain restricted via `hd` parameter
- **Email/Password** — for staff accounts (librarians, admins)

### Deleted Account Protection
Deleted users are automatically signed out with the message:
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

---

## 9. Pages & Functionality

### Login Page (`/login`)
- **Continue with Google** — primary button for all users
- Email/password section labeled "Staff / Admin login"
- Forgot password flow

### Student Check-In (`/checkin`)
- Shown to students/faculty after Google login
- Student ID with auto-format, purpose dropdown
- Dept/program dropdowns appear only if not set in profile
- Success screen → auto sign-out in 5 seconds

### Dashboard (`/dashboard`) — Staff/Admin
- Stat cards, live visitors table, today's log
- Admin-only analytics panel with filters

### Log Visit (`/time-in`) — Staff
- Manual entry with duplicate prevention and name autosuggest
- QR scanner for fast check-in

### Visitor Logs (`/logs`) — Staff
- Full history, date filters, CSV export, time-out button

### Reports (`/reports`) — Staff
- Charts: monthly trend, busiest days, peak hours, purpose breakdown, college breakdown
- Top visitors table, print and export

### Profile (`/profile`) — Staff
- Edit info, QR code, change password, visit history

### Manage Users (`/admin`) — Admin
- Role management and user deletion

---

## 10. Getting Started

```bash
git clone https://github.com/reneespina0929-tech/neu-library-logger.git
cd neu-library-logger
npm install
cp .env.example .env.local  # add Firebase config
npm run dev
```

### Firebase Setup
1. Enable **Authentication** → Email/Password + Google
2. Add authorized domains: `localhost` and Vercel URL
3. Enable **Firestore** and apply security rules from Section 8

---

## 11. Deployment

Push to `main` → Vercel auto-builds and deploys within ~60 seconds.

```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

---

## 12. Known Limitations

| Limitation | Details |
|---|---|
| QR Scanner | Chrome/Chromium only, requires physical camera |
| Logs Limit | Max 500 records per query |
| Auth Deletion | Deleting a user removes Firestore profile but not Firebase Auth account |
| Offline Support | No offline mode |
| Single Library | One branch only |

---

## 13. Future Enhancements

- [ ] Seat capacity indicator
- [ ] RFID card support via USB reader
- [ ] QR scanner fallback for Safari/Firefox
- [ ] Multi-branch support
- [ ] Printable monthly reports

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