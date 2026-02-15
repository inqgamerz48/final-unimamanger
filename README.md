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
  
  [🚀 Live Demo](https://uni-manager-demo.vercel.app) • [📖 Documentation](https://docs.uni-manager.dev) • [🐛 Report Bug](https://github.com/yourusername/uni-manager/issues)
  
</div>

---

## ✨ Features

### 🏛️ **Multi-Role Architecture**
- **Principal** - Full system administration
- **HOD** - Department-level management  
- **Faculty** - Teaching and grading
- **Student** - Learning and submissions

### 📚 **Academic Management**
- ✅ **Attendance Tracking** - Daily/monthly reports with statistics
- ✅ **Assignment Management** - Create, submit, and grade assignments
- ✅ **Grade Management** - Exam marks entry (MST1, MST2, Final)
- ✅ **Course Management** - Subjects, batches, and departments
- ✅ **Fee Management** - Track dues and payments

### 🔔 **Communication Hub**
- ✅ **Notices & Announcements** - Centralized communication
- ✅ **Complaint System** - Student grievance tracking with resolution workflow

### 🔐 **Enterprise Security**
- ✅ **Role-Based Access Control (RBAC)** - Strict permission enforcement
- ✅ **Firebase Authentication** - Secure user management
- ✅ **IDOR Prevention** - Users can only access their own data
- ✅ **Input Validation** - Zod schema validation on all inputs
- ✅ **API Security** - Authentication headers on all requests

---

## 🚀 Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **Styling** | Tailwind CSS, Radix UI, Framer Motion |
| **Backend** | Next.js API Routes, Firebase Admin SDK |
| **Database** | PostgreSQL (Neon), Prisma ORM |
| **Auth** | Firebase Authentication |
| **Validation** | Zod |
| **Deployment** | Vercel (recommended) |

---

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- PostgreSQL database (Neon recommended)
- Firebase project

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/uni-manager.git
cd uni-manager
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your environment variables:

```env
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://user:password@host.neon.tech/dbname?sslmode=require"

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin (for server-side)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# (Optional) Seed the database
npx prisma db seed
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Architecture

```
uni-manager/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── (auth)/            # Authentication routes
│   │   ├── admin/             # Admin panel
│   │   ├── faculty/           # Faculty portal
│   │   ├── student/           # Student portal
│   │   └── api/               # API routes
│   │       ├── admin/         # Admin APIs
│   │       ├── faculty/       # Faculty APIs
│   │       ├── student/       # Student APIs
│   │       └── auth/          # Auth APIs
│   ├── components/            # Reusable UI components
│   │   └── ui/               # shadcn/ui components
│   ├── context/              # React contexts
│   ├── lib/                  # Utilities & configurations
│   │   ├── validations.ts    # Zod schemas
│   │   ├── firebase.ts       # Firebase client
│   │   ├── firebase-admin.ts # Firebase admin
│   │   └── prisma.ts         # Prisma client
│   └── types/                # TypeScript types
├── prisma/
│   └── schema.prisma         # Database schema
└── public/                   # Static assets
```

---

## 🔐 Security Features

### Multi-Layer Security Architecture

1. **Authentication Layer**
   - Firebase Auth for secure user management
   - JWT token verification on every request
   - Session management with secure cookies

2. **Authorization Layer**
   - Strict RBAC enforcement on all API endpoints
   - Role-based route protection
   - Department-level isolation for HODs

3. **Data Protection**
   - IDOR (Insecure Direct Object Reference) prevention
   - Input validation with Zod schemas
   - SQL injection prevention via Prisma ORM

4. **API Security**
   - All endpoints require authentication headers
   - Faculty can only access their assigned subjects
   - Students can only view their own records

---

## 📱 Screenshots

<div align="center">

| Admin Dashboard | Faculty Portal | Student View |
|----------------|----------------|--------------|
| ![Admin](docs/images/admin-dashboard.png) | ![Faculty](docs/images/faculty-portal.png) | ![Student](docs/images/student-view.png) |

</div>

---

## 🎯 Usage Guide

### First-Time Setup

1. **Create First Admin (Principal)**
   ```bash
   # Use the setup script or manually create via Prisma Studio
   npx prisma studio
   ```

2. **Login as Principal**
   - Navigate to `/login`
   - Use the credentials created in step 1

3. **Setup College Structure**
   - Create Departments
   - Create Batches (Year/Semester)
   - Create Subjects

4. **Add Users**
   - Create HODs and assign them to departments
   - Create Faculty and assign subjects
   - Create Students

### Daily Workflows

**📊 Attendance Tracking**
```
Faculty → Attendance → Select Subject → Mark Present/Absent → Save
```

**📝 Assignment Management**
```
Faculty → Assignments → Create New → Set Due Date → Students Submit → Faculty Grades
```

**📈 Grade Entry**
```
Faculty → Grades → Select Subject → Enter Marks → Save
```

**💬 Complaint Resolution**
```
Student → Complaints → Submit New
Admin → Complaints → View → Resolve/Reject
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
   - Add environment variables from `.env.local`
   - Deploy!

3. **Database Migration**
   ```bash
   # Run migrations on production database
   npx prisma migrate deploy
   ```

### Production Checklist

- [ ] Set up production Firebase project
- [ ] Configure production database (Neon/Supabase)
- [ ] Set up environment variables in hosting platform
- [ ] Enable Firebase Auth email/password provider
- [ ] Configure Firebase Admin SDK credentials
- [ ] Run database migrations
- [ ] Create first Principal user
- [ ] Test all critical workflows

---

## 🧪 Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

---

## 🛠️ Development

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint errors
npm run lint:fix

# Type check
npm run type-check
```

### Database Management

```bash
# Open Prisma Studio
npx prisma studio

# Create migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset

# Seed database
npx prisma db seed
```

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
4. **Commit with clear messages**
   ```bash
   git commit -m "Add: amazing feature description"
   ```
5. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**

### Commit Convention

- `Add:` New features
- `Fix:` Bug fixes
- `Update:` Modifications
- `Remove:` Deletions
- `Docs:` Documentation changes
- `Security:` Security improvements

---

## 📊 Project Stats

![GitHub Stats](https://github-readme-stats.vercel.app/api?username=yourusername&repo=uni-manager&show_icons=true&theme=tokyonight)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Prisma](https://prisma.io/) - Next-generation ORM
- [Firebase](https://firebase.google.com/) - Authentication & Backend
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Radix UI](https://www.radix-ui.com/) - Unstyled accessible components
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components

---

## 📞 Support

Need help? Have questions?

- 📧 Email: support@uni-manager.dev
- 💬 Discord: [Join our community](https://discord.gg/uni-manager)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/uni-manager/issues)

---

<div align="center">
  
  **⭐ Star this repo if you find it helpful!**
  
  Made with ❤️ for better education management
  
</div>
