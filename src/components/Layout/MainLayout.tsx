import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useOvertimeCheck } from '@/hooks/useOvertimeCheck';

export default function MainLayout() {
  useOvertimeCheck(30000);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 ml-60">
        <div className="p-6 min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
