import { ReactNode } from 'react';
import TabBar from './TabBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950">
      <TabBar />

      {/* Main Content */}
      <main className="lg:ml-64 pb-20 lg:pb-0 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
