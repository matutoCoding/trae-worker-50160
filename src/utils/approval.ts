import { Booking, ApprovalStep, OvertimeRecord, UserRole } from '@/types';
import { generateId, generateApprovalDeadline } from './time';

export function canApprove(
  booking: Booking,
  userRole: UserRole,
  userId: string
): boolean {
  if (booking.status !== 'pending') return false;
  
  const currentStep = getCurrentApprovalStep(booking);
  if (!currentStep) return false;
  
  if (currentStep.status !== 'pending' && currentStep.status !== 'overtime') {
    return false;
  }
  
  if (currentStep.level === 1) {
    return userRole === 'teacher' || userRole === 'admin';
  }
  
  if (currentStep.level === 2) {
    return userRole === 'admin';
  }
  
  return false;
}

export function getCurrentApprovalStep(booking: Booking): ApprovalStep | null {
  const sorted = [...booking.approvalSteps].sort((a, b) => a.level - b.level);
  for (const step of sorted) {
    if (step.status === 'pending' || step.status === 'overtime' || step.status === 'escalated') {
      return step;
    }
  }
  return null;
}

export function getApprovalProgress(booking: Booking): { current: number; total: number } {
  const total = booking.approvalSteps.length;
  const approved = booking.approvalSteps.filter(
    (s) => s.status === 'approved'
  ).length;
  return { current: approved, total };
}

export function processApprovalStep(
  booking: Booking,
  stepId: string,
  status: 'approved' | 'rejected',
  approverId: string,
  comment: string
): Booking {
  const now = new Date().toISOString();
  
  const updatedSteps = booking.approvalSteps.map((step) => {
    if (step.id === stepId) {
      return {
        ...step,
        status,
        approverId,
        comment,
        processedAt: now,
      };
    }
    return step;
  });
  
  let bookingStatus = booking.status;
  if (status === 'rejected') {
    bookingStatus = 'rejected';
  } else {
    const allApproved = updatedSteps.every((s) => s.status === 'approved');
    if (allApproved) {
      bookingStatus = 'approved';
    }
  }
  
  return {
    ...booking,
    status: bookingStatus,
    approvalSteps: updatedSteps,
  };
}

export function escalateApprovalStep(
  booking: Booking,
  stepId: string,
  responsiblePersonId: string
): { booking: Booking; overtimeRecord: OvertimeRecord } {
  const step = booking.approvalSteps.find((s) => s.id === stepId);
  if (!step) return { booking, overtimeRecord: {} as OvertimeRecord };
  
  const now = new Date().toISOString();
  const overdueHours = Math.max(1, Math.floor((new Date().getTime() - new Date(step.deadline).getTime()) / (1000 * 60 * 60)));
  
  let escalationLevel: 1 | 2 | 3 = 1;
  let message = '';
  
  if (overdueHours < 1) {
    escalationLevel = 1;
    message = '审批即将超时，请尽快处理';
  } else if (overdueHours < 4) {
    escalationLevel = 2;
    message = `审批已超时${overdueHours}小时，已自动升级至下一级审批`;
  } else {
    escalationLevel = 3;
    message = `审批已超时${overdueHours}小时，已升级至最高管理员紧急处理`;
  }
  
  const overtimeRecord: OvertimeRecord = {
    id: generateId(),
    bookingId: booking.id,
    approvalLevel: step.level,
    responsiblePersonId,
    overtimeAt: now,
    escalationLevel,
    notificationSent: true,
    message,
  };
  
  const updatedSteps = booking.approvalSteps.map((s) => {
    if (s.id === stepId) {
      return {
        ...s,
        status: 'escalated' as const,
      };
    }
    if (s.level === step.level + 1 && s.status === 'pending') {
      return {
        ...s,
        deadline: generateApprovalDeadline(12),
      };
    }
    return s;
  });
  
  return {
    booking: {
      ...booking,
      approvalSteps: updatedSteps,
      overtimeRecords: [...booking.overtimeRecords, overtimeRecord],
    },
    overtimeRecord,
  };
}

export function markStepAsOverdue(
  booking: Booking,
  stepId: string
): { booking: Booking; overtimeRecord: OvertimeRecord } {
  const step = booking.approvalSteps.find((s) => s.id === stepId);
  if (!step) return { booking, overtimeRecord: {} as OvertimeRecord };
  
  const now = new Date().toISOString();
  
  const overtimeRecord: OvertimeRecord = {
    id: generateId(),
    bookingId: booking.id,
    approvalLevel: step.level,
    responsiblePersonId: step.approverId || 'unassigned',
    overtimeAt: now,
    escalationLevel: 1,
    notificationSent: false,
    message: '审批节点已超时，即将自动升级',
  };
  
  const updatedSteps = booking.approvalSteps.map((s) => {
    if (s.id === stepId) {
      return {
        ...s,
        status: 'overtime' as const,
      };
    }
    return s;
  });
  
  return {
    booking: {
      ...booking,
      approvalSteps: updatedSteps,
      overtimeRecords: [...booking.overtimeRecords, overtimeRecord],
    },
    overtimeRecord,
  };
}
