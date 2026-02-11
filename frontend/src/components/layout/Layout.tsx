import { ReactNode } from 'react';
import TabBar from './TabBar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 noise">
      {/* Ambient background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        {/* Top-left cool blue blob */}
        <div className="absolute -top-48 -left-48 h-[600px] w-[600px] rounded-full bg-blue-600/[0.04] blur-[120px]" />
        {/* Bottom-right warm purple blob */}
        <div className="absolute -bottom-48 -right-48 h-[500px] w-[500px] rounded-full bg-purple-600/[0.03] blur-[120px]" />
      </div>

      <TabBar />

      {/* Main Content */}
      <main className="lg:ml-[17rem] pb-24 lg:pb-8 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
