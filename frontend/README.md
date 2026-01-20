# PlansiteOS Frontend

Modern React + TypeScript application for CTL Plumbing LLC's blueprint analysis and project management system.

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **TailwindCSS** - Utility-first CSS framework
- **Zustand** - State management
- **React Router v6** - Client-side routing
- **Lucide React** - Icon library
- **date-fns** - Date formatting

## Project Structure

```
src/
├── components/
│   ├── layout/          # AppShell, Sidebar, TopBar, MobileNav
│   └── ui/              # Reusable UI components
├── pages/               # Route pages
├── stores/              # Zustand state stores
├── lib/
│   └── utils.ts         # Utility functions
├── types/
│   └── index.ts         # TypeScript type definitions
├── App.tsx              # Router configuration
└── main.tsx             # Application entry point
```

## Getting Started

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Visit http://localhost:5173/

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Features

### Pages

- **Dashboard** - Overview with stats, recent jobs, and activity feed
- **Jobs** - Job listing and management
- **Estimates** - Estimate creation and tracking
- **Alerts** - Real-time notification center
- **Vlad AI** - AI assistant chat interface
- **Settings** - User preferences and pricing configuration

### Components

#### UI Components (`components/ui/`)

- **Button** - 5 variants (primary, secondary, danger, ghost, outline)
- **Card** - Flexible card component with header, content, footer
- **Badge** - Status badges with 7 color variants
- **Input** - Text input with label, error, and helper text
- **Textarea** - Multi-line text input
- **StatCard** - Dashboard statistics with trend indicators

#### Layout Components (`components/layout/`)

- **AppShell** - Main application wrapper with navigation
- **Sidebar** - Collapsible desktop navigation
- **TopBar** - Header with user menu and notifications
- **MobileNav** - Responsive mobile menu

### State Management (Zustand)

- **useUIStore** - UI state (sidebar, theme, loading, errors)
- **useJobsStore** - Job CRUD operations
- **useEstimatesStore** - Estimate management
- **useAlertsStore** - Notification system with unread tracking
- **useVladStore** - AI chat conversations
- **useUserStore** - User authentication and profile

### Utilities (`lib/utils.ts`)

- **cn()** - TailwindCSS class merging
- **formatCurrency()** - Currency formatting ($125,000)
- **formatDate()** - Date formatting (Jan 15, 2024)
- **formatRelativeTime()** - Relative time (2 hours ago)
- **getJobStatusColor()** - Status badge colors
- **Validation** - Email and phone validation
- **Performance** - Debounce, sleep utilities

## CTL Brand Colors

The application uses CTL Plumbing's brand colors:

- **Navy** - Primary brand color (#102a43)
- **Safety Orange** - Action/accent color (#f97316)
- **Success Green** - Success states (#22c55e)
- **Danger Red** - Error states (#ef4444)
- **Warning Yellow** - Warning states (#f59e0b)

## Environment Variables

Create a `.env.local` file for local development:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_TITLE=PlansiteOS
```

## TypeScript

All code is fully typed with comprehensive type definitions in `src/types/index.ts`.

## Responsive Design

- **Mobile** - < 768px (hamburger menu)
- **Tablet** - 768px - 1024px
- **Desktop** - > 1024px (sidebar navigation)

## Contributing

### Code Style

- Use TypeScript for all new files
- Follow existing component patterns
- Use TailwindCSS utility classes
- Keep components small and focused

### Component Guidelines

1. **Props** - Define TypeScript interfaces for all props
2. **Exports** - Use named exports for components
3. **Styling** - Use Tailwind classes with `cn()` utility
4. **State** - Use Zustand stores for shared state

## License

Proprietary - CTL Plumbing LLC

## Built For

CTL Plumbing LLC - DFW's premier plumbing contractors
