import { Booking, OvertimeRecord, User } from '@/types';
import { isOverdue, getOverdueHours } from './time';
import { markStepAsOverdue, escalateApprovalStep, getCurrentApprovalStep } from './approval';

export interface OvertimeCheckResult {
  updatedBookings: Booking[];
  newOvertimeRecords: OvertimeRecord[];
}

export function checkAndProcessOvertime(
  bookings: Booking[],
  teachers: User[],
  admins: User[]
): OvertimeCheckResult {
  const updatedBookings: Booking[] = [];
  const newOvertimeRecords: OvertimeRecord[] = [];

  for (const booking of bookings) {
    if (booking.status !== 'pending') {
      updatedBookings.push(booking);
      continue;
    }

    let updatedBooking = { ...booking };
    let hasChanges = false;

    for (const step of updatedBooking.approvalSteps) {
      if (step.status !== 'pending' && step.status !== 'overtime') {
        continue;
      }

      if (!isOverdue(step.deadline)) {
        continue;
      }

      const overdueHours = getOverdueHours(step.deadline);
      const responsibleUser = step.approverId
        ? [...teachers, ...admins].find((u) => u.id === step.approverId)
        : null;
      const responsibleId = responsibleUser?.id || (step.level === 1 ? teachers[0]?.id : admins[0]?.id) || 'unknown';

      if (step.status === 'pending') {
        const { booking: marked, overtimeRecord } = markStepAsOverdue(updatedBooking, step.id);
        updatedBooking = marked;
        newOvertimeRecords.push(overtimeRecord);
        hasChanges = true;
      }

      if (overdueHours >= 1) {
        const { booking: escalated, overtimeRecord: escalateRecord } = escalateApprovalStep(
          updatedBooking,
          step.id,
          responsibleId
        );
        updatedBooking = escalated;
        newOvertimeRecords.push(escalateRecord);
        hasChanges = true;
      }
    }

    updatedBookings.push(hasChanges ? updatedBooking : booking);
  }

  return { updatedBookings, newOvertimeRecords };
}

export function getOvertimeStats(bookings: Booking[]): {
  totalOvertime: number;
  level1: number;
  level2: number;
  level3: number;
  byPerson: Record<string, number>;
} {
  const stats = {
    totalOvertime: 0,
    level1: 0,
    level2: 0,
    level3: 0,
    byPerson: {} as Record<string, number>,
  };

  for (const booking of bookings) {
    for (const record of booking.overtimeRecords) {
      stats.totalOvertime++;
      if (record.escalationLevel === 1) stats.level1++;
      if (record.escalationLevel === 2) stats.level2++;
      if (record.escalationLevel === 3) stats.level3++;
      stats.byPerson[record.responsiblePersonId] =
        (stats.byPerson[record.responsiblePersonId] || 0) + 1;
    }
  }

  return stats;
}

export function getPendingOvertimeBookings(bookings: Booking[]): Booking[] {
  return bookings.filter((b) => b.overtimeRecords.length > 0 && b.status === 'pending');
}

export function simulateTimePass(booking: Booking, hoursToAdd: number): Booking {
  const msToAdd = hoursToAdd * 60 * 60 * 1000;
  return {
    ...booking,
    approvalSteps: booking.approvalSteps.map((step) => {
      if (step.status === 'pending' || step.status === 'overtime') {
        const originalDeadline = new Date(step.deadline).getTime();
        const newDeadline = new Date(originalDeadline - msToAdd);
        return {
          ...step,
          deadline: newDeadline.toISOString(),
        };
      }
      return step;
    }),
  };
}
