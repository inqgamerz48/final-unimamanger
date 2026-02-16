<div align="center">
  
  ![UNI Manager](https://img.shields.io/badge/UNI-Manager-6366f1?style=for-the-badge&logo=academic&logoColor=white)
  
  # 🎓 UNI Manager
  ### Enterprise-Grade University Management System

  [![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.10-2D3748?style=flat-square&logo=prisma)](https://prisma.io/)
  [![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com/)
  [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-316192?style=flat-square&logo=postgresql)](https://postgresql.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)
  
  **A comprehensive, secure, and scalable university management platform built with modern web technologies.**

  [🚀 Live Demo](https://final-unimamanger.vercel.app) • [🐛 Report Bug](https://github.com/inqgamerz48/final-unimamanger/issues)

</div>

---

## ✨ Features

### 🏛️ Multi-Role Architecture
- **Principal** - Full system administration, college settings, all departments
- **HOD** - Department-level management, reports, faculty/student oversight
- **Faculty** - Teaching, attendance, grades, assignments
- **Student** - Learning portal, submissions, fees, complaints

### 📚 Academic Management
- ✅ **Attendance Tracking** - Daily/monthly reports with statistics (faculty marks, students view)
- ✅ **Assignment Management** - Create, submit, and grade assignments
- ✅ **Grade Management** - Exam marks entry (MST1, MST2, Final)
- ✅ **Course/Subject Management** - Subjects, batches, departments
- ✅ **Fee Management** - Track dues, payments, fee types
- ✅ **Batch Management** - Year/semester based batch creation

### 🔔 Communication Hub
- ✅ **Notices & Announcements** - Centralized communication (admin, faculty, student notices)
- ✅ **Complaint System** - Student grievance tracking with resolution workflow
- ✅ **Dashboard Notifications** - Role-based dashboards with stats

### 📊 Reports & Analytics
- ✅ **HOD Reports** - Student lists, faculty lists, attendance, fees, performance
- ✅ **PDF Generation** - Download reports as PDF files
- ✅ **Department Statistics** - Student count, faculty count, subjects, batches

### 🔐 Enterprise Security
- ✅ **Role-Based Access Control (RBAC)** - Strict permission enforcement
- ✅ **Firebase Authentication** - Secure user management
- ✅ **IDOR Prevention** - Users can only access their own data
- ✅ **Input Validation** - Zod schema validation on all inputs
- ✅ **API Security** - Authentication headers on all requests
- ✅ **Department Isolation** - HODs can only access their department data

---

## 🚀 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Framer Motion |
| **Backend** | Next.js API Routes, Firebase Admin SDK |
| **Database** | PostgreSQL (Neon), Prisma ORM |
| **Auth** | Firebase Authentication |
| **PDF** | jsPDF, jsPDF-AutoTable |
| **Deployment** | Vercel |

---

## 📦 Current Capabilities

### Principal (Admin) Capabilities
- College settings configuration
- Department management (create, edit, delete)
- Batch management (create, edit, delete)
- Subject management (create, edit, delete)
- User management (create users, assign roles)
- Fee management (create fees, view payments)
- View all complaints and resolve them
- Post notices for all departments

### HOD Capabilities
- View department students
- View department faculty
- Manage subjects for department
- Manage batches for department
- Post notices for department
- View attendance reports
- Generate PDF reports (students, faculty, fees, performance)

### Faculty Capabilities
- View assigned subjects
- Mark attendance for students
- Create and manage assignments
- Grade student submissions
- Enter exam marks (MST1, MST2, Final)
- Post notices for students
- View notices

### Student Capabilities
- View assigned subjects
- View attendance records
- View and submit assignments
- View grades
- View and pay fees
- Submit complaints
- View notices

---

## ⚠️ Limitations & Known Issues

### Database Schema Sync
- Some environments may have database schema mismatches
- Run `npx prisma db push` or use provided SQL migration files
- Missing columns: `academicYear` in CollegeSettings, `feeType` in Fee

### Authentication
- Firebase Admin SDK requires proper environment variables
- Build may fail locally without Firebase credentials (works on Vercel with env vars set)

### Features In Progress
- ❌ Timetable management
- ❌ Library management
- ❌ Transport management
- ❌ Hostel management
- ❌ Exam scheduling
- ❌ Parent portal
- ❌ Email notifications (UI only)
- ❌ Real-time notifications

### Browser Support
- Requires modern browser with JavaScript enabled
- Best supported in Chrome, Firefox, Edge (latest versions)

---

## 🏗️ Architecture

```
uni-manager/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── admin/             # Admin panel pages
│   │   ├── faculty/           # Faculty portal pages
│   │   ├── hod/              # HOD dashboard pages
│   │   ├── student/           # Student portal pages
│   │   ├── login/             # Login page
│   │   └── api/              # API routes
│   │       ├── admin/         # Admin APIs
│   │       ├── faculty/       # Faculty APIs
│   │       ├── hod/           # HOD APIs
│   │       ├── student/       # Student APIs
│   │       └── auth/          # Auth APIs
│   ├── components/            # Reusable UI components
│   │   ├── layout/           # Layout components
│   │   ├── hod/               # HOD-specific components
│   │   └── ui/               # shadcn/ui components
│   ├── context/               # React contexts (auth)
│   ├── lib/                  # Utilities
│   │   ├── validations.ts    # Zod schemas
│   │   ├── firebase.ts       # Firebase client
│   │   ├── firebase-admin.ts # Firebase admin
│   │   ├── prisma.ts         # Prisma client
│   │   └── pdf-utils.ts      # PDF generation
│   └── types/                # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
└── public/                   # Static assets
```

---

## 🔧 Challenges Faced

### 1. Database Schema Migrations
**Challenge:** Prisma schema was updated but production database wasn't synced
**Solution:** Created manual SQL migration files for Neon SQL editor

### 2. Firebase Admin Initialization
**Challenge:** Firebase Admin SDK throws errors during SSR/build without credentials
**Solution:** Lazy initialization pattern - auth only initializes when actually called

### 3. Role-Based Access Control
**Challenge:** Different roles need different data access levels (e.g., HODs only see their department)
**Solution:** Added departmentId filtering in API queries based on user role

### 4. PDF Generation in Client
**Challenge:** jsPDF doesn't work with SSR/Next.js build
**Solution:** Used dynamic imports and async functions to load PDF libraries in browser only

### 5. Attendance UI Consistency
**Challenge:** Faculty attendance page had different styling than other pages
**Solution:** Refactored to use DashboardLayout and consistent dark theme

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Firebase project

### 1. Clone the Repository
```bash
git clone https://github.com/inqgamerz48/final-unimamanger.git
cd final-unimamanger
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env.local
```

Fill in your environment variables:
```env
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run Development Server
```bash
npm run dev
```

---

## 🚢 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

3. **Run SQL Migrations**
   - Use the SQL files in the root directory to update your Neon database schema
   - Or run `npx prisma db push` if using Prisma migrate

---

## 📝 Usage Guide

### First-Time Setup (Principal)

1. **Create Principal User**
   - Use the admin setup page at `/admin/setup`
   - Or manually create via Prisma Studio: `npx prisma studio`

2. **Setup College**
   - Login as Principal
   - Go to Settings → College Settings
   - Configure college name, academic year

3. **Create Departments**
   - Admin → Departments → Create Department

4. **Create Batches**
   - Admin → Batches → Create Batch (Year/Semester)

5. **Create Subjects**
   - Admin → Subjects → Add Subject

6. **Add Users**
   - Admin → Users → Create HODs, Faculty, Students

### Daily Workflows

**📊 Attendance**
```
Faculty → Attendance → Select Subject → Mark Status → Save
```

**📝 Grades**
```
Faculty → Grades → Select Subject → Enter Marks → Save
```

**📄 Reports (HOD)**
```
HOD → Reports → Select Report Type → Generate → Download PDF
```

---

## 🧪 Testing Checklist

- [ ] Principal can create departments, batches, subjects
- [ ] HOD can view department data and generate reports
- [ ] Faculty can mark attendance and enter grades
- [ ] Students can view attendance, submit assignments
- [ ] Fee creation works (requires database migration)
- [ ] PDF reports download correctly
- [ ] Notices appear for correct roles

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Commit with clear messages
5. Push to your fork
6. Open a Pull Request

### Commit Convention
- `Add:` New features
- `Fix:` Bug fixes
- `Update:` Modifications
- `Docs:` Documentation changes

---

## 📝 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Firebase](https://firebase.google.com/) - Authentication & Backend
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Unstyled accessible components
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components

---

<div align="center">
  
  **⭐ Star this repo if you find it helpful!**
  
  Made with ❤️ for better education management
  
</div>
