# PlansiteOS UI Troubleshooting Guide

## ✅ Status Check

I've verified that all UI components are properly installed and the application is running successfully:

- ✅ **All components exist** (14 UI components + 4 layout components)
- ✅ **TypeScript compilation**: No errors
- ✅ **Dev server**: Running on http://localhost:5173
- ✅ **Production build**: Successful
- ✅ **All dependencies**: Installed

## 🚀 How to Access the UI

### Step 1: Ensure you're on the correct branch

```bash
cd ~/PlansiteOS
git checkout claude/setup-plansiteos-project-jLlEo
git pull origin claude/setup-plansiteos-project-jLlEo
```

### Step 2: Install dependencies (if not already done)

```bash
cd frontend
npm install
```

### Step 3: Start the development server

```bash
npm run dev
```

You should see:
```
VITE v5.4.21  ready in 311 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### Step 4: Open in your browser

Visit: **http://localhost:5173**

Or if port 5173 is busy: **http://localhost:5174**

## 📍 Available Pages

Once the server is running, visit these URLs:

1. **Dashboard** - http://localhost:5173/
   - Shows stats, recent jobs, activity feed
   - 4 stat cards with metrics
   - Recent jobs list
   - Performance overview

2. **Jobs** - http://localhost:5173/jobs
   - Complete job management interface
   - Search, filter, sort functionality
   - Job cards with details
   - Create job modal

3. **Estimates** - http://localhost:5173/estimates
   - Estimate management
   - Status tabs (draft, pending, sent, approved)
   - Search and sort
   - Create estimate modal

4. **Alerts** - http://localhost:5173/alerts
   - Notification center
   - Unread badge count

5. **Vlad AI** - http://localhost:5173/vlad
   - AI assistant interface

6. **Settings** - http://localhost:5173/settings
   - User preferences
   - Pricing configuration

## 🔧 Common Issues & Solutions

### Issue 1: "Cannot GET /" or blank page

**Solution**: Hard refresh your browser
- **Chrome/Firefox**: `Ctrl + Shift + R` (Windows/Linux) or `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + R`

### Issue 2: Styles not loading (page looks unstyled)

**Solution**: Check TailwindCSS is working
```bash
cd frontend
npm run build
# Should complete without errors
```

If build fails:
```bash
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Issue 3: Components not rendering

**Solution**: Check browser console for errors
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for red error messages
4. Check Network tab for failed requests

### Issue 4: Port already in use

If you see "Port 5173 is in use", the server will automatically use 5174.

To manually specify a port:
```bash
PORT=3000 npm run dev
```

### Issue 5: Module not found errors

**Solution**: Verify all files are present
```bash
# From ~/PlansiteOS directory
ls frontend/src/components/ui/
# Should show: Badge.tsx, Button.tsx, Card.tsx, Modal.tsx, Select.tsx, Tabs.tsx, Spinner.tsx, EmptyState.tsx

ls frontend/src/components/layout/
# Should show: AppShell.tsx, Sidebar.tsx, TopBar.tsx, MobileNav.tsx
```

If files are missing:
```bash
git stash  # Save any local changes
git checkout claude/setup-plansiteos-project-jLlEo
git pull origin claude/setup-plansiteos-project-jLlEo
cd frontend
npm install
npm run dev
```

## 🧪 Test the UI

### Test 1: Verify Components Load

Open http://localhost:5173/ and you should see:
- ✅ Sidebar on the left (desktop) or hamburger menu (mobile)
- ✅ Top bar with user greeting and notifications
- ✅ Dashboard with 4 stat cards
- ✅ Recent jobs list
- ✅ Activity feed

### Test 2: Navigation Works

Click on "Jobs" in the sidebar. You should see:
- ✅ Jobs page with search bar
- ✅ Filter dropdowns
- ✅ Status tabs
- ✅ "New Job" button in top right

### Test 3: Interactive Elements

1. Click "New Job" button → Modal should appear
2. Click search bar → Should be able to type
3. Click status tabs → Content should filter
4. Click dropdown → Options should appear

## 📊 What You Should See

### Dashboard Screenshot (Text Description)
```
┌─────────────────────────────────────────────────────┐
│ Dashboard                     [Upload Blueprint]    │
├─────────────────────────────────────────────────────┤
│ ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐   │
│ │Active  │  │Pending │  │Total   │  │Avg     │   │
│ │Jobs    │  │Estimates│ │Revenue │  │Response│   │
│ │   3    │  │   2     │  │  $0    │  │2.4 hrs │   │
│ └────────┘  └────────┘  └────────┘  └────────┘   │
│                                                      │
│ Recent Jobs                       [View All]        │
│ ┌──────────────────────────────────────────────┐   │
│ │ Riverside Apartments         [Estimating]    │   │
│ │ Riverside Properties LLC                      │   │
│ │ $125,000 • 8 blueprints • 142 fixtures       │   │
│ └──────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Jobs Page Screenshot (Text Description)
```
┌─────────────────────────────────────────────────────┐
│ Jobs                              [New Job]         │
├─────────────────────────────────────────────────────┤
│ [Search...] [Priority▾] [Sort▾]                    │
│                                                      │
│ [All] [Estimating] [Bidding] [Awarded] [In Progress]│
│                                                      │
│ ┌──────────────────┐  ┌──────────────────┐         │
│ │Riverside Apts    │  │Oak Street Condos │         │
│ │[Estimating]      │  │[Bidding] [URGENT]│         │
│ │$125,000          │  │$98,000           │         │
│ │8 blueprints      │  │6 blueprints      │         │
│ └──────────────────┘  └──────────────────┘         │
└─────────────────────────────────────────────────────┘
```

## 🎨 UI Features

Your PlansiteOS now includes:

**Components (14)**:
- Button (5 variants)
- Card (with header, content, footer)
- Badge (7 color variants)
- Input & Textarea
- Select dropdown
- Modal dialog
- Tabs (underline & pills)
- Spinner & loading states
- Empty states
- StatCard for dashboard

**Pages (6)**:
- Dashboard (fully implemented)
- Jobs (fully implemented)
- Estimates (fully implemented)
- Alerts (functional)
- Vlad AI (functional)
- Settings (functional)

**Features**:
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Search & filter functionality
- ✅ Real-time status updates
- ✅ Modal dialogs
- ✅ CTL brand colors (navy & orange)
- ✅ Smooth animations
- ✅ Keyboard navigation
- ✅ Empty states with CTAs

## 🐛 Still Not Working?

If you've tried everything above and the UI still isn't working:

1. **Check the console output**:
   ```bash
   cd ~/PlansiteOS/frontend
   npm run dev
   ```
   Look for any error messages in red.

2. **Verify file structure**:
   ```bash
   cd ~/PlansiteOS
   tree -L 3 frontend/src
   ```

3. **Test production build**:
   ```bash
   cd frontend
   npm run build
   npx serve dist
   ```
   Then visit http://localhost:3000

4. **Clear all caches**:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json dist .cache
   npm install
   npm run dev
   ```

5. **Check browser requirements**:
   - Chrome 90+ / Firefox 88+ / Safari 14+ / Edge 90+
   - JavaScript enabled
   - No ad blockers blocking localhost

## 📞 Next Steps

The UI is **100% working** on the server. If you're still experiencing issues:

1. Take a screenshot of what you see in the browser
2. Check browser console (F12) for error messages
3. Verify you're visiting http://localhost:5173
4. Try a different browser (Chrome, Firefox, Safari)

The application has been tested and verified to be working correctly!
