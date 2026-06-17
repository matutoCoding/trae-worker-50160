import { useEffect, useCallback } from 'react';
import { useAppStore } from '@/store';

export function useOvertimeCheck(intervalMs: number = 60000) {
  const checkAndProcessOvertime = useAppStore((s) => s.checkAndProcessOvertime);

  const check = useCallback(() => {
    checkAndProcessOvertime();
  }, [checkAndProcessOvertime]);

  useEffect(() => {
    check();
    const timer = setInterval(check, intervalMs);
    return () => clearInterval(timer);
  }, [check, intervalMs]);
}

export function useBookingStats() {
  const bookings = useAppStore((s) => s.bookings);
  const currentUser = useAppStore((s) => s.currentUser);

  const today = new Date().toISOString().split('T')[0];

  const stats = {
    total: bookings.length,
    pending: bookings.filter((b) => b.status === 'pending').length,
    approved: bookings.filter((b) => b.status === 'approved').length,
    rejected: bookings.filter((b) => b.status === 'rejected').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
    completed: bookings.filter((b) => b.status === 'completed').length,
    overtime: bookings.filter((b) => b.overtimeRecords.length > 0 && b.status === 'pending').length,
    merged: bookings.filter((b) => b.isMerged).length,
    today: bookings.filter((b) => b.date === today).length,
    pendingApproval: bookings.filter((b) => {
      if (b.status !== 'pending') return false;
      if (!currentUser) return false;
      const currentStep = b.approvalSteps.find(
        (s) => s.status === 'pending' || s.status === 'overtime' || s.status === 'escalated'
      );
      if (!currentStep) return false;
      if (currentStep.level === 1) {
        return currentUser.role === 'teacher' || currentUser.role === 'admin';
      }
      if (currentStep.level === 2) {
        return currentUser.role === 'admin';
      }
      return false;
    }).length,
  };

  return stats;
}
