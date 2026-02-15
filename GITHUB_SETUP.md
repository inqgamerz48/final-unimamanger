# 🚀 GitHub Setup Guide

## Quick Setup (Windows)

### Option 1: Using the Setup Script

1. Open PowerShell or Command Prompt in the `UNIVERSITY MANAGER FINALED` folder

2. Run the setup script:
```powershell
# If you have Git Bash installed:
bash setup-github.sh

# Or manually follow Option 2 below
```

### Option 2: Manual Setup

1. **Navigate to the project folder:**
```powershell
cd "C:\Users\nandu\Desktop\UNIMANAGER FINAL VERSION\UNIVERSITY MANAGER FINALED"
```

2. **Initialize Git (if not already done):**
```powershell
git init
```

3. **Add all files:**
```powershell
git add .
```

4. **Create initial commit:**
```powershell
git commit -m "Initial commit: UNI Manager v1.0.0"
```

5. **Create GitHub Repository:**
   - Go to https://github.com/new
   - Repository name: `uni-manager`
   - **IMPORTANT:** Don't initialize with README, .gitignore, or License
   - Click "Create repository"

6. **Connect to GitHub:**
```powershell
git remote add origin https://github.com/YOUR_USERNAME/uni-manager.git
```

7. **Push to GitHub:**
```powershell
git branch -M main
git push -u origin main
```

## 📁 What's Being Pushed?

✅ **INCLUDED:**
- All source code (`src/`)
- Database schema (`prisma/`)
- Configuration files
- Documentation (`README.md`)
- This setup guide

❌ **EXCLUDED:**
- Node modules
- Environment files (.env)
- Build files (.next/)
- IDE settings
- Other folders (1, 2, 3, 4)

## 🔒 Security Notes

Before pushing to GitHub, make sure:

1. ✅ `.env` file is in `.gitignore` (already done)
2. ✅ No Firebase credentials in code
3. ✅ No database passwords in code
4. ✅ `.env.example` doesn't contain real credentials

## 🎯 After Push

Once pushed to GitHub:

1. **Add repository secrets** (for CI/CD if needed):
   - Go to Settings → Secrets and variables → Actions
   - Add your environment variables

2. **Enable GitHub Pages** (optional):
   - Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root

3. **Add topics/tags:**
   - `nextjs`, `react`, `typescript`, `university`, `education`
   - `prisma`, `firebase`, `postgresql`, `management-system`

4. **Create releases:**
   - Go to Releases → Create a new release
   - Tag: v1.0.0
   - Title: "Initial Release - UNI Manager"

## 🆘 Troubleshooting

### "fatal: not a git repository"
```powershell
git init
```

### "fatal: remote origin already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/uni-manager.git
```

### "failed to push some refs"
```powershell
git pull origin main --rebase
git push origin main
```

### Authentication Issues
- Use GitHub Personal Access Token instead of password
- Or use GitHub Desktop for GUI-based workflow

## 📞 Need Help?

If you encounter issues:
1. Check Git is installed: `git --version`
2. Verify you're in the correct folder
3. Make sure you're pushing from `UNIVERSITY MANAGER FINALED` only
4. Check GitHub status: https://www.githubstatus.com/

## ✨ Making Your Repo Look Professional

After pushing:

1. **Add a description**: "Enterprise-grade university management system built with Next.js"
2. **Add website URL**: Your deployed app URL
3. **Pin the repository** on your profile
4. **Enable discussions** for community support
5. **Add social preview image** (Settings → Social preview)

---

**🎉 You're ready to showcase your project to the world!**
