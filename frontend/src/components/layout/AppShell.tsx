import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { useUIStore } from '../../stores/useUIStore';
import { useUserStore } from '../../stores/useUserStore';
import { useAlertsStore } from '../../stores/useAlertsStore';
import { cn } from '../../lib/utils';
import type { Alert, User } from '../../types';

export function AppShell() {
  const { sidebarOpen } = useUIStore();
  const { setUser } = useUserStore();
  const { setAlerts } = useAlertsStore();

  // Initialize mock data on mount
  useEffect(() => {
    // Mock user
    const mockUser: User = {
      id: 'user_1',
      email: 'john@ctlplumbing.com',
      name: 'John Smith',
      role: 'admin',
      phone: '(214) 555-0123',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    // Mock alerts
    const mockAlerts: Alert[] = [
      {
        id: 'alert_1',
        type: 'estimateApproved',
        severity: 'success',
        title: 'Estimate Approved',
        message: 'Estimate #EST-2024-042 has been approved by client',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        id: 'alert_2',
        type: 'bidDue',
        severity: 'warning',
        title: 'Bid Due Soon',
        message: 'Bid for Riverside Apartments due in 2 days',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
      {
        id: 'alert_3',
        type: 'jobUpdate',
        severity: 'info',
        title: 'Job Update',
        message: 'Oak Street Condos moved to "In Progress"',
        read: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ];

    setUser(mockUser);
    setAlerts(mockAlerts);
  }, [setUser, setAlerts]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <MobileNav />
      <TopBar />

      {/* Main Content */}
      <main
        className={cn(
          'pt-16 min-h-screen transition-all duration-300',
          sidebarOpen ? 'lg:pl-64' : 'lg:pl-20'
        )}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
