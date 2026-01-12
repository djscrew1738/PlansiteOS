# Upload PlansiteOS to GitHub

## 📦 What You Have

A complete, production-ready PlansiteOS v2.0 repository with:
- ✅ Clean directory structure
- ✅ All necessary files
- ✅ .gitignore configured
- ✅ README and documentation
- ✅ MIT License
- ✅ Single-file frontend (easy to understand)
- ✅ Modular backend with AI integration

---

## 🚀 Upload to GitHub (3 Steps)

### Step 1: Copy to Your Server

```bash
# On your local machine, copy the PlansiteOS-GitHub folder
cd /home/acer-square
cp -r /path/to/PlansiteOS-GitHub ./PlansiteOS
cd PlansiteOS
```

### Step 2: Initialize Git

```bash
# Initialize repository
git init

# Add all files
git add .

# Create first commit
git commit -m "feat: PlansiteOS v2.0 - AI-powered blueprint analysis"
```

### Step 3: Push to GitHub

```bash
# Add your GitHub repository as remote
git remote add origin https://github.com/djscrew1738/PlansiteOS.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## 🔐 If Repository Already Exists

If you already have a PlansiteOS repo on GitHub:

```bash
# Option A: Replace everything (careful!)
git push -f origin main

# Option B: Create new branch
git checkout -b v2-upgrade
git push origin v2-upgrade
# Then merge via GitHub PR
```

---

## ✅ What Gets Uploaded

```
PlansiteOS/
├── .env.example         ✅ Config template
├── .gitignore          ✅ Excludes node_modules, etc.
├── LICENSE             ✅ MIT License
├── README.md           ✅ Main documentation
├── QUICK_START.md      ✅ 5-minute setup guide
├── package.json        ✅ Root dependencies
├── backend/            ✅ Express API
│   ├── package.json
│   └── src/
│       ├── server.js
│       ├── routes/
│       └── services/
├── frontend/           ✅ Web interface
│   ├── package.json
│   ├── vite.config.js
│   └── public/
│       └── index.html
└── storage/            ✅ Upload directories
    ├── uploads/
    ├── processed/
    └── exports/
```

**NOT uploaded** (per .gitignore):
- node_modules/
- .env (your secrets)
- storage/*/* (uploaded files)
- dist/ (build outputs)

---

## 🎯 After Upload

1. **Share the repo:** https://github.com/djscrew1738/PlansiteOS
2. **Clone on other machines:**
   ```bash
   git clone https://github.com/djscrew1738/PlansiteOS.git
   cd PlansiteOS
   npm install && cd backend && npm install && cd ../frontend && npm install
   ```

3. **Deploy to production:**
   ```bash
   git pull origin main
   npm install
   npm run dev
   ```

---

## 📝 Git Commands Reference

```bash
# Check status
git status

# Add new files
git add .

# Commit changes
git commit -m "your message here"

# Push to GitHub
git push

# Pull latest changes
git pull

# View commit history
git log --oneline

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

---

## 🔄 Update Workflow

When you make changes:

```bash
# 1. Save your changes
git add .

# 2. Commit with message
git commit -m "fix: improved blueprint analysis accuracy"

# 3. Push to GitHub
git push

# That's it!
```

---

## 🆘 Troubleshooting

### "Repository not found"

Make sure you created the repo on GitHub first:
1. Go to https://github.com/new
2. Name it "PlansiteOS"
3. Don't initialize with README (we already have one)
4. Click "Create repository"
5. Use the URL they give you

### "Failed to push"

```bash
# Pull first, then push
git pull origin main --allow-unrelated-histories
git push
```

### "Permission denied"

Set up SSH key or use personal access token:
```bash
# Use HTTPS with token instead
git remote set-url origin https://YOUR_TOKEN@github.com/djscrew1738/PlansiteOS.git
```

---

## 🎉 You're Done!

Your PlansiteOS v2.0 is now on GitHub and ready to:
- Share with others
- Deploy to multiple servers
- Track changes over time
- Collaborate with your crew

**Next:** Follow [QUICK_START.md](QUICK_START.md) to run it!
