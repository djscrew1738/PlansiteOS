import { ReactNode } from 'react';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 relative">
      {/* Blueprint-style Background */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: [
            'linear-gradient(rgba(42,90,154,0.6) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(42,90,154,0.6) 1px, transparent 1px)',
            'linear-gradient(rgba(26,58,106,0.4) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(26,58,106,0.4) 1px, transparent 1px)',
          ].join(','),
          backgroundSize: '100px 100px, 100px 100px, 20px 20px, 20px 20px',
        }}
      />

      {/* Radial Glow */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: [
            'radial-gradient(ellipse at 30% 20%, rgba(0,212,255,0.04) 0%, transparent 60%)',
            'radial-gradient(ellipse at 80% 80%, rgba(255,107,53,0.03) 0%, transparent 50%)',
          ].join(','),
        }}
      />

      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="lg:ml-64 pb-20 lg:pb-0 min-h-screen relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
