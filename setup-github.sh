#!/bin/bash

echo "🚀 UNI Manager - GitHub Setup Script"
echo "====================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Step 1: Checking if we're in the right directory...${NC}"
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the UNIVERSITY MANAGER FINALED folder"
    exit 1
fi
echo -e "${GREEN}✓ Correct directory${NC}"
echo ""

echo -e "${YELLOW}Step 2: Checking Git...${NC}"
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
else
    echo -e "${GREEN}✓ Git already initialized${NC}"
fi
echo ""

echo -e "${YELLOW}Step 3: Creating initial commit...${NC}"
git add .
git commit -m "Initial commit: UNI Manager v1.0.0

- Complete university management system
- Multi-role architecture (Principal, HOD, Faculty, Student)
- Full CRUD for Users, Departments, Batches, Subjects
- Attendance tracking system
- Assignment management with submissions
- Grade management (MST1, MST2, Final)
- Fee tracking and payment
- Complaint system with resolution workflow
- Notice board for announcements
- Enterprise-grade security with RBAC
- Input validation with Zod
- IDOR prevention
- Firebase Authentication
- PostgreSQL database with Prisma ORM"

echo -e "${GREEN}✓ Initial commit created${NC}"
echo ""

echo -e "${YELLOW}Step 4: Next Steps${NC}"
echo ""
echo "To push to GitHub, run these commands:"
echo ""
echo "1. Create a new repository on GitHub (without README, .gitignore, or License)"
echo "   Visit: https://github.com/new"
echo ""
echo "2. Add the remote repository:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/uni-manager.git"
echo ""
echo "3. Push to GitHub:"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo -e "${GREEN}✓ Setup complete!${NC}"
echo ""
echo "📁 Note: Only the UNIVERSITY MANAGER FINALED folder will be pushed to GitHub"
echo "   The other folders (1, 2, 3, 4) are excluded."
