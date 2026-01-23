# PlansiteOS Frontend - Dashboard UI

A mobile-first, dark-themed React dashboard for plumbing contractors.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit **http://localhost:5173/** when running dev server.

## 📱 Features

### Navigation (5 Tabs)

1. **Dashboard** - Stats, revenue chart, activity feed, quick actions
2. **Blueprints** - Upload, analyze, and manage construction blueprints
3. **Estimates** - Create, send, and track estimates with line items
4. **Leads** - Kanban board for lead management and conversion
5. **Messages** - Chat interface for builder/homeowner communication

### Design System

**Theme:** Dark mode with slate/blue color scheme
**Layout:** Bottom tab bar (mobile), Sidebar (desktop)
**Icons:** Heroicons
**Charts:** Recharts

## 📦 Tech Stack

- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v4
- React Router v6
- Recharts (data viz)
- React Query (ready for server state)
- Zustand (ready for UI state)

## 📁 Structure

```
src/
├── components/
│   ├── ui/          # Reusable UI components (Button, Card, Modal, etc.)
│   └── layout/      # Navigation and layout (TabBar, Layout)
├── pages/           # 5 main page components
├── hooks/           # Custom React hooks (to be added)
├── lib/             # Utilities and helpers (to be added)
├── types/           # TypeScript type definitions (to be added)
├── App.tsx          # Root app component
├── main.tsx         # Entry point
└── styles.css       # Global styles & Tailwind config
```

## 🎨 UI Components

All components are in `src/components/ui/`:

- **Button** - 4 variants (primary, secondary, ghost, danger), 3 sizes
- **Card** - Container with header/title/content subcomponents
- **Badge** - 6 color variants for status indicators
- **Input/Select/Textarea** - Form controls with labels and errors
- **Modal** - Overlay modal with animations
- **Table** - Styled table components
- **Tabs** - Tab navigation component
- **Avatar** - User avatar with fallback
- **EmptyState** - Placeholder for empty lists

Import from `src/components/ui/index.ts`:

```tsx
import { Button, Card, Badge, Input, Modal } from './components/ui';
```

## 🔌 Backend Integration

The UI currently uses mock data. To connect to your backend:

1. **Set up React Query:**

```tsx
// In main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// Wrap App with QueryClientProvider
```

2. **Create API client:**

```tsx
// src/lib/api.ts
export const api = {
  getEstimates: () => fetch('/api/estimates').then(r => r.json()),
  // Add other endpoints...
};
```

3. **Replace mock data in pages:**

```tsx
// In Estimates.tsx
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

const { data: estimates } = useQuery({
  queryKey: ['estimates'],
  queryFn: api.getEstimates
});
```

## 🎯 Next Steps

- [ ] Connect to PlansiteOS backend API
- [ ] Add authentication/login page
- [ ] Implement real drag-and-drop (Kanban)
- [ ] Add blueprint upload functionality
- [ ] Implement PDF export for estimates
- [ ] Add toast notifications system
- [ ] Set up form validation (React Hook Form)
- [ ] Add loading skeletons
- [ ] Implement WebSocket for messages
- [ ] Add error boundaries
- [ ] Set up E2E tests (Playwright/Cypress)

## 📱 Mobile Support

- Fully responsive design (mobile-first)
- Touch-optimized (44px minimum tap targets)
- PWA-ready (manifest.json included)
- Bottom tab navigation on mobile
- Swipeable actions (to be implemented)

## 🎨 Customization

**Colors:** Edit `src/styles.css` `@theme` block

```css
@theme {
  --color-slate-950: #020617;
  /* Add custom colors here */
}
```

**Components:** All component styles use Tailwind classes, easily customizable

## 🐛 Known Issues

- Kanban drag-and-drop needs implementation (install `@dnd-kit/core`)
- Chart colors need adjustment for icons (use inline styles)
- Some TypeScript type refinements needed

## 📄 License

MIT - CTL Plumbing LLC
